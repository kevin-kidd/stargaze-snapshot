const axios = require("axios");
const fs = require("fs");
const {checkBalances} = require("./checkBalances");
const {checkInventory} = require("./checkInventory");

const REST_URL = "https://rest.stargaze-1.publicawesome.dev/";

const proposals = JSON.parse(fs.readFileSync("./data/proposals.json", { encoding: "utf8" }));
let voters = {};

const getVoters = async (proposal) => {
    const headers = {
        "Content-Type": "application/json",
        "x-cosmos-block-height": proposal.height
    }
    const response = await axios.get(
        `${REST_URL}/cosmos/gov/v1beta1/proposals/${proposal.id}/votes?pagination.limit=10000`,
        {
            headers: headers
        }
    );
    if(!response.data) {
        console.error(`Error: Failed to fetch votes for proposal #${proposal.id} at block #${proposal.height}`);
        return
    }
    if(Number(response.data.pagination.total) > 0) {
        console.error(`Error: Total votes was greater than the pagination limit for proposal #${proposal.id} at block #${proposal.height}`);
        return
    }
    if(response.data.votes.length === 0) {
        console.error(`Error: Found 0 votes for proposal #${proposal.id} at block #${proposal.height}`);
        return
    }
    for(const vote of response.data.votes) {
        if(voters[vote.voter]) {
            if(!voters[vote.voter].includes(proposal.id)) {
                voters[vote.voter] = [...voters[vote.voter], proposal.id];
            }
        } else {
            voters[vote.voter] = [proposal.id]
        }
    }
}

const aggregateProposals = async () => {
    for(const proposal of proposals) {
        try {
            await getVoters(proposal);
        } catch (e) {
            console.error(e);
            return
        }
    }
    let validVoters = [];
    for(const [key, value] of Object.entries(voters)) {
        if(value.length >= 10) {
            validVoters.push(key);
        }
    }
    return validVoters;
}

const fetchVoters = async () => {
    const snapshot = await aggregateProposals();
    const nonZeroBalanceSnapshot = await checkBalances(snapshot);
    const qualifiedAddresses = await checkInventory(nonZeroBalanceSnapshot);
    console.log(`- Found ${qualifiedAddresses.length} addresses which voted on 10 or more proposals before block #${proposals[0].height}`);
    fs.writeFileSync("./data/snapshots/4908610/voters.json", JSON.stringify(qualifiedAddresses), { encoding: "utf8" });
}

module.exports = { fetchVoters }
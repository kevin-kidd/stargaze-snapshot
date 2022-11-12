const axios = require("axios");
const fs = require("fs");
const {checkBalances} = require("./checkBalances");
const {checkInventory} = require("./checkInventory");
const xlsx = require("node-xlsx");

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

const aggregateProposals = async (allAddresses) => {
    for(const proposal of proposals) {
        try {
            await getVoters(proposal);
        } catch (e) {
            console.error(e);
            return
        }
    }
    let validVoters = [];
    for(const [address, votes] of Object.entries(voters)) {
        if(
            !allAddresses.includes(address) && 
            votes.length >= 10 &&
            !validVoters.find((voter) => voter.address === address)
        ) {
            validVoters.push({
                address: address,
                votes: votes.toString(),
                totalVotes: votes.length
            });
        }
    }
    return validVoters;
}

const fetchVoters = async (blockHeight, allAddresses) => {

    const snapshot = await aggregateProposals(allAddresses);
    const nonZeroBalanceSnapshot = await checkBalances(snapshot);
    const qualifiedAddresses = await checkInventory(nonZeroBalanceSnapshot);

    fs.writeFileSync(`./data/snapshots/${blockHeight}/json/voters.json`, JSON.stringify(qualifiedAddresses), { encoding: "utf8" });

    let spreadsheetData = [["Address", "Stars Balance", "Delegated Stars Balance", "Total NFTs", "Total Votes", "Proposal IDs"]];
    qualifiedAddresses.forEach((addressDetails) => {
        allAddresses.push(addressDetails.address);
        spreadsheetData.push([
            addressDetails.address,
            addressDetails.starsBalance ?? "N/A",
            addressDetails.delegatedStarsBalance ?? "N/A",
            addressDetails.totalNFTs ?? "N/A",
            addressDetails.totalVotes ?? "N/A",
            addressDetails.votes ?? ""
        ]);
    });

    const spreadsheetBuffer = xlsx.build([{ name: `Voters - ${blockHeight}`, data: spreadsheetData }]);
    fs.writeFileSync(`./data/snapshots/${blockHeight}/xlsx/voters.xlsx`, spreadsheetBuffer);

    console.log(`- Found ${qualifiedAddresses.length} addresses which voted on 10 or more proposals before block #${blockHeight}`);
    return;
}

module.exports = { fetchVoters }
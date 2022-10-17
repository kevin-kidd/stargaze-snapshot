const axios = require("axios");
const fs = require("fs");

const REST_URL = "https://rest.stargaze-apis.com/";

const getCreators = async (contracts) => {
    let creators = [];
    for(const contract of contracts) {
        const response = await axios.get(`${REST_URL}/cosmwasm/wasm/v1/contract/${contract}`);
        if(!response.data) {
            console.error(`Error: Failed to fetch contract info for ${contract}`);
        }
        if(!response.data.contract_info || !response.data.contract_info.creator) {
            console.error(`Error: Failed to fetch creator address for ${contract}`);
        }
        creators.push(response.data.contract_info.creator);
    }
    return [...new Set(creators)];
};

const getContracts = async (snapshot) => {

    let contracts = [];
    for(const codeId of snapshot.codeIds) {
        const response = await axios.get(
            `${REST_URL}/cosmwasm/wasm/v1/code/${codeId}/contracts?pagination.limit=10000`,
            {
                headers: {
                    "Content-Type": "application/json",
                    "x-cosmos-block-height": snapshot.height
                }
            }
        );
        if(!response.data) {
            console.error(`Error: Failed to fetch contracts for Code ID #${codeId} at block #${snapshot.height}`);
            return
        }
        if(Number(response.data.pagination.total) > 0) {
            console.error(`Error: Number of contracts was greater than the limit for Code ID #${codeId} at block #${snapshot.height}`);
            return
        }
        contracts = [...contracts, ...response.data.contracts];
    }
    return contracts;
}

const fetchCreators = async () => {
    const snapshots = [
        {
            height: "3252783",
            codeIds: ["1","2","3","4","5","6"]
        },
        {
            height: "4908610",
            codeIds: ["1","2","3","4","5","6","7","8","9","10","11","12","13","14"]
        }
    ];
    for(const snapshot of snapshots) {
        const contracts = await getContracts(snapshot);
        const creators = await getCreators(contracts);
        fs.writeFileSync(`./data/snapshots/${snapshot.height}/creators.json`, JSON.stringify(creators), { encoding: "utf8" });
        console.log(`- Found ${creators.length} creators that instantiated a contract before block #${snapshot.height}`);
    }
}

module.exports = { fetchCreators }
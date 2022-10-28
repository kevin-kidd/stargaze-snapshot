const fs = require('fs');
const json = require('big-json');
const {checkBalances} = require("./checkBalances");
const {checkInventory} = require("./checkInventory");

const decimals = 6;
const minDelegation = 5000;
const snapshots = [
    {
        minDelegation: 5000,
        blockHeight: "4908610"
    },
    {
        minDelegation: 10000,
        blockHeight: "3252783"
    }
]

const parseDelegations = (delegations) => {
    const validDelegators = delegations.filter((delegation) => {
        if(delegation.shares / (10**decimals) >= minDelegation) {
            return delegation;
        }
    }).map((delegation) => delegation.delegator_address);
    return [...new Set(validDelegators)];
}

const fetchDelegators = async () => {
    for(const snapshot of snapshots) {
        const readStream = fs.createReadStream(`./data/exported/${snapshot.blockHeight}.json`);
        const parseStream = json.createParseStream();
        parseStream.on('data', async function(pojo) {
            const uniqueDelegators = await parseDelegations(pojo.app_state.staking.delegations);
            const nonZeroBalanceSnapshot = await checkBalances(uniqueDelegators);
            const qualifiedAddresses = await checkInventory(nonZeroBalanceSnapshot);
            fs.writeFileSync(
                `./data/snapshots/${snapshot.blockHeight}/stakers.json`,
                JSON.stringify(qualifiedAddresses),
                {
                    encoding: "utf8"
                }
            );
            console.log(`- Found ${qualifiedAddresses.length} addresses which delegated >${snapshot.minDelegation} $stars before block #${snapshot.blockHeight}.`);
        });
        readStream.pipe(parseStream);
    }
}

module.exports = { fetchDelegators }


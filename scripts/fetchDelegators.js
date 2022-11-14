const fs = require('fs');
const json = require('big-json');
const {checkBalances} = require("./checkBalances");
const {checkInventory} = require("./checkInventory");
const xlsx = require("node-xlsx");

const parseDelegations = (delegations, minDelegationAmount, allAddresses) => {
    let allAddressesTotal = {};
    let validDelegators = [];
    for(const delegation of delegations) {
        if(allAddressesTotal[delegation.delegator_address]) {
            allAddressesTotal[delegation.delegator_address] += Number(delegation.shares);
        } else {
            allAddressesTotal[delegation.delegator_address] = Number(delegation.shares);
        }
    }
    for(const [address, delegationTotal] of Object.entries(allAddressesTotal)) {
        if(delegationTotal / 10**6 >= minDelegationAmount) {
            if(!allAddresses.includes(address) && !validDelegators.includes(address)) { // Skip if address has already been added
                validDelegators.push(address);
            }
        }
   
    }
    return validDelegators;
}

const fetchDelegators = async (blockHeight, minDelegationAmount, allAddresses) => {


    return new Promise(function(resolve, reject) {
        const readStream = fs.createReadStream(`./data/exported/${blockHeight}.json`);
        const parseStream = json.createParseStream();
        let uniqueDelegators;
        parseStream.on('data', (pojo) => {
            uniqueDelegators = parseDelegations(pojo.app_state.staking.delegations, minDelegationAmount, allAddresses);
        });

        parseStream.on('end', async () => {
            const nonZeroBalanceSnapshot = await checkBalances(uniqueDelegators);
            const qualifiedAddresses = await checkInventory(nonZeroBalanceSnapshot);
    
            fs.writeFileSync(
                `./data/snapshots/${blockHeight}/json/stakers.json`,
                JSON.stringify(qualifiedAddresses),
                {
                    encoding: "utf8"
                }
            );
    
            let spreadsheetData = [["Address", "Stars Balance", "Delegated Stars Balance", "Total NFTs"]];
            qualifiedAddresses.forEach((addressDetails) => {
                allAddresses.push(addressDetails.address);
                spreadsheetData.push([
                    addressDetails.address,
                    addressDetails.starsBalance ?? "N/A",
                    addressDetails.delegatedStarsBalance ?? "N/A",
                    addressDetails.totalNFTs ?? "N/A"
                ])
            });
    
            const spreadsheetBuffer = xlsx.build([{ name: `Stakers - ${blockHeight}`, data: spreadsheetData }]);
            fs.writeFileSync(`./data/snapshots/${blockHeight}/xlsx/stakers.xlsx`, spreadsheetBuffer);
            console.log(`- Found ${qualifiedAddresses.length} addresses which delegated >${minDelegationAmount} $stars before block #${blockHeight}.`);
            resolve(allAddresses);
        })
    
        readStream.pipe(parseStream);
    });
    

}

module.exports = { fetchDelegators }


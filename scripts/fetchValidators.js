const fs = require("fs");
const json = require("big-json");

const fetchValidators = async (blockHeight) => {
    let activeValidators = [];

    const readStream = fs.createReadStream(`./data/exported/${blockHeight}.json`);
    const parseStream = json.createParseStream();

    parseStream.on('data', function(pojo) {
        const validators = pojo.app_state.staking.validators;
        for(const validator of validators) {
            if(validator.status === "BOND_STATUS_BONDED") {
                activeValidators.push(validator.operator_address);
            }
        }
        fs.writeFileSync(`./data/snapshots/${blockHeight}/json/validators.json`, JSON.stringify(activeValidators));
        console.log(`- Found ${activeValidators.length} active validators at block #${blockHeight}`);
    });
    readStream.pipe(parseStream);
    return;
}

module.exports = { fetchValidators }
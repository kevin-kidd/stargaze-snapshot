const fs = require("fs");
const json = require("big-json");

const heights = ["3252783", "4908610"];

const fetchValidators = () => {
    for(const height of heights) {

        let activeValidators = [];

        const readStream = fs.createReadStream(`./data/exported/${height}.json`);
        const parseStream = json.createParseStream();

        parseStream.on('data', function(pojo) {
            const validators = pojo.app_state.staking.validators;
            for(const validator of validators) {
                if(validator.status === "BOND_STATUS_BONDED") {
                    activeValidators.push(validator.operator_address);
                }
            }
            fs.writeFileSync(`./data/snapshots/${height}/validators.json`, JSON.stringify(activeValidators));
            console.log(`- Found ${activeValidators.length} active validators at block #${height}`);
        });
        readStream.pipe(parseStream);
    }
}

module.exports = { fetchValidators }
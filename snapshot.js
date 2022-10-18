const {fetchCreators} = require("./scripts/fetchCreators");
const {fetchVoters} = require("./scripts/fetchVoters");
const {fetchDelegators} = require("./scripts/fetchDelegators");
const {fetchValidators} = require("./scripts/fetchValidators");

const takeSnapshot = async () => {
    console.log("### TAKING SNAPSHOT ###");
    await fetchDelegators();
    await fetchVoters();
    await fetchCreators();
    await fetchValidators();
}

takeSnapshot()
    .then(() => console.log("### SUCCESS ###"))
    .catch((e) => console.error(e));
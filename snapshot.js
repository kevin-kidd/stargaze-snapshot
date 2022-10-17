const {fetchCreators} = require("./scripts/fetchCreators");
const {fetchVoters} = require("./scripts/fetchVoters");
const {fetchDelegators} = require("./scripts/fetchDelegators");

const takeSnapshot = async () => {
    console.log("### TAKING SNAPSHOT ###");
    await fetchDelegators();
    await fetchVoters()
    await fetchCreators()
}

takeSnapshot()
    .then(() => console.log("### SUCCESS ###"))
    .catch((e) => console.error(e));
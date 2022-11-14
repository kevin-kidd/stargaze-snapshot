const {fetchCreators} = require("./scripts/fetchCreators");
const {fetchVoters} = require("./scripts/fetchVoters");
const {fetchDelegators} = require("./scripts/fetchDelegators");
const {fetchValidators} = require("./scripts/fetchValidators");


const takeSnapshot = async () => {
    try {
        console.log("### TAKING SNAPSHOT ###");
        let allAddresses = [];

        // Wave 1
        await fetchCreators("3252783", ["1","2","3","4","5","6"], allAddresses); // Addresses that instantiated a contract before June 10
        
        await fetchValidators("3252783"); // Any address that deployed a contract before Oct 1st.
        await fetchValidators("4908610"); // Any address that deployed a contract before Oct 1st.
        // Ecosystem devs done manually (only 5 addrs)

        // Wave 2
        await fetchDelegators("3252783", 10000, allAddresses); // Addresses that had 10000+ STARS staked before June 10
        await fetchVoters("4908610", allAddresses); // Addresses that voted on 5+ gov proposals before  Oct 1st

        // Wave 3
        await fetchCreators(
            "4908610", 
            ["1","2","3","4","5","6","7","8","9","10","11","12","13","14"], 
            allAddresses
        ); // Addresses that instantiated a contract before Oct 1st. 

        // Wave 4
        await fetchDelegators("4908610", 5000, allAddresses); // Addresses that had 5000+ STARS staked before Oct 1st.

    } catch (error) {
        console.error(error);
    }
}

takeSnapshot();
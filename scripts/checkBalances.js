const axios = require("axios");

const REST_URL = "https://rest.stargaze-1.publicawesome.dev/";

const checkBalances = async (snapshot) => {
    let nonZeroBalanceSnapshot = [];
    for(const address of snapshot) {
        try {
            const response = await axios.get(`${REST_URL}/cosmos/bank/v1beta1/balances/${address}`);
            if(!response.data || !response.data.balances) {
                console.error("Error: Failed to fetch balance for address: " + address);
            }
            for(const balance of response.data.balances) {
                if(balance.amount > 0) {
                    nonZeroBalanceSnapshot.push(address);
                    break;
                }
            }
        } catch (e) {
            console.error(e.message);
            console.error("Error: Failed to fetch balance for address: " + address);
        }

    }
    return nonZeroBalanceSnapshot;
}

module.exports = { checkBalances }
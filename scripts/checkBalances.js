const axios = require("axios");

const REST_URL = "https://rest.stargaze-1.publicawesome.dev/";

const checkDelegations = async (address) => {
    try {
        const response = await axios.get(`${REST_URL}/cosmos/staking/v1beta1/delegations/${address}`);
        if(!response.data || !response.data.delegation_responses) {
            console.error("Error: Failed to fetch delegations for address: " + address);
        }
        if(response.data.delegation_responses.some(
            (delegationResponse) => (delegationResponse.delegation.shares / (10**6)) > 1)
        ) return true;
    } catch (e) {
        console.error(e.message);
        console.error("Error: Failed to fetch delegations for address: " + address);
    }
    return false;
}

const checkBalances = async (snapshot) => {
    let nonZeroBalanceSnapshot = [];
    for(const address of snapshot) {
        try {
            const response = await axios.get(`${REST_URL}/cosmos/bank/v1beta1/balances/${address}`);
            if(!response.data || !response.data.balances) {
                console.error("Error: Failed to fetch balance for address: " + address);
                continue;
            }
            let isValid = false;
            if(response.data.balances.some(
                (balance) => (balance.amount / (10**6)) > 1
            )) isValid = true;
            if(!isValid) {
                if(await checkDelegations(address)) nonZeroBalanceSnapshot.push(address);
            } else nonZeroBalanceSnapshot.push(address);
        } catch (e) {
            console.error(e.message);
            console.error("Error: Failed to fetch balance for address: " + address);
        }
    }
    return nonZeroBalanceSnapshot;
}

module.exports = { checkBalances }
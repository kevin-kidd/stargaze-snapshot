const axios = require("axios");

const REST_URL = "https://rest.stargaze-1.publicawesome.dev/";

const getDelegatedStarsBalance = async (address) => {
    try {
        const response = await axios.get(`${REST_URL}/cosmos/staking/v1beta1/delegations/${address}`);
        if(response.data && response.data.delegation_responses) {
            let totalDelegated = 0;
            response.data.delegation_responses.every(
                (delegationResponse) => totalDelegated += Number(delegationResponse.balance.amount)
            );
            return totalDelegated / 10**6;
        }
    } catch (e) {
        console.error(e.message);
        console.error("Error: Failed to fetch delegations for address: " + address);
    }
    return -1;
}

const getStarsBalance = async (address) => {
    try {
        const response = await axios.get(`${REST_URL}/cosmos/bank/v1beta1/balances/${address}`);
        if(response.data && response.data.balances) {
            const starsBalance = response.data.balances.find((balance) => balance.denom === "ustars");
            if(starsBalance) {
                return starsBalance.amount / 10**6
            }
        }
    } catch (error) {
        console.error(error.message);
        console.error("Error: Failed to fetch delegations for address: " + address);
    }
    return -1
}

const checkBalances = async (snapshot) => {
    let nonZeroBalanceSnapshot = [];
    for(const addressDetails of snapshot) {
        const address = addressDetails.address ?? addressDetails;
        const starsBalance = await getStarsBalance(address);
        const delegatedStarsBalance = await getDelegatedStarsBalance(address);
        if(starsBalance > 1 || delegatedStarsBalance > 1) {
            if(addressDetails.address) {
                nonZeroBalanceSnapshot.push({
                    ...addressDetails,
                    starsBalance: starsBalance,
                    delegatedStarsBalance: delegatedStarsBalance
                });
            } else {
                nonZeroBalanceSnapshot.push({
                    address: address,
                    starsBalance: starsBalance,
                    delegatedStarsBalance: delegatedStarsBalance
                });
            }
        }
    }
    return nonZeroBalanceSnapshot;
}

module.exports = { checkBalances }
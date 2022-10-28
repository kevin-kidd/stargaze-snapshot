const axios = require("axios");
const REST_URL = "https://nft-api.stargaze-apis.com/api/v1beta/profile"

const checkInventory = async (snapshot) => {
    let qualifiedAddresses = [];
    for(const address of snapshot) {
        try {
            const response = await axios.get(`${REST_URL}/${address}/nfts`);
            if(!response.data) {
                console.error("Error: Failed to fetch inventory for address: " + address);
                continue;
            }
            if(response.data.length >= 5) qualifiedAddresses.push(address);
        } catch (e) {
            console.error(e);
            console.error("Error: Failed to fetch inventory for address: " + address);
        }
    }
    return qualifiedAddresses;
}

module.exports = { checkInventory }
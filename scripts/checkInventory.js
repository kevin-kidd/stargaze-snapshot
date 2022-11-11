const axios = require("axios");
const REST_URL = "https://nft-api.stargaze-apis.com/api/v1beta/profile"

const checkInventory = async (snapshot) => {
    let qualifiedAddresses = [];
    for(const addressDetails of snapshot) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Sleep for rate-limiting
        try {
            const response = await axios.get(`${REST_URL}/${addressDetails.address}/nfts`);
            if(!response.data) {
                console.error("Error: Failed to fetch inventory for address: " + addressDetails.address);
                continue;
            }
            if(response.data.length >= 5) {
                qualifiedAddresses.push({
                    ...addressDetails,
                    totalNFTs: response.data.length
                });
            }
        } catch (e) {
            console.error(e);
            console.error("Error: Failed to fetch inventory for address: " + addressDetails.address);
        }
    }
    return qualifiedAddresses;
}

module.exports = { checkInventory }
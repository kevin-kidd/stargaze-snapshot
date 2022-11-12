const axios = require("axios");
const fs = require("fs");
const {checkBalances} = require("./checkBalances");
const xlsx = require("node-xlsx");
const { CosmWasmClient, fromBech32 } = require("cosmwasm");


const REST_URL = "https://rest.stargaze-1.publicawesome.dev/";

const blacklist = ["stars105puweuzdvf7eqs69znpkwuzx6h0h3ms8qzre28n5gx0ekp9p6aq8alx5y","stars1xfrerfu7lhgcrrq7hyyesfrqufgyafdqvafy35xsh59rjsps6yfq3gdyjl","stars16xkuke34x4tl5vjq9ke57ugaxn2gqr3ncthx9z7tlrx04kfrm3rsaaulja","stars17x6mzl2n5lwtljrkk5kzwuc8u5f7vpnm4p9mwkx483nrnn7hdvcqnd0hfq","stars17jttxmrpmsn3y5sch6x0f2wy54c97zxt8rxut5q67npssk3wuw6s2ptf0q","stars1fpskp97dxvmtapsg82txpau6l0fkmmcv7pjzjfhews58x6j3qtksdse5wt","stars1xxf2ngvfpa4tvum4mastqsttygv7n55uf0484tzzumsttmtxv7zs8lu8hj","stars1j0mdgvz9v9a5zpeuq40z43acze33g2npulggf7cdmdqeq3ecp9pswwrzya","stars15uh8m0e4vyyqpwh6h9cujp96w9pm5ev6rjmu6zc7rngu7eje7etqq8wl2u","stars1n4y7led6y38zkx97a0uv3wutxhymcsqetgfc6wdf4qshsxfal56stuepge","stars1htew5vwtrd9phjupnxycffwyzhh6hxv00fqu9nj5wjhnpjptjl6syqrjvl","stars15duvnjxpmyy3r8wym6746qh3hy4nk33k0e7daajyjrmdxm44m66qj6qvf3","stars1zgspe5m95f4qluqhu70ytdgu3cjkk3jcnr6mlqgrs3uwx6wrpknq5vqz43","stars1lx2hc89vej6zpne6c4r7afrdqll0l5xd8zjynp3yqwgj5amp67fshqtyh9","stars15hzplrf6uqyf77wmf5tku9hklejyh6xu36ytuk8u9wez3lz8tlzs6sd3pf","stars1989h9h8pq3a8cmxjjzsq8eee2m6pgs6d6kcswmjmdx9uafetnr8qywgrhv","stars1k0r37q8l9wasr6tufr7kq7s94ts9ehrkc4u3yg3u6azfcwlhr7usy8fa7e","stars1ryxvkkuhampajy7yaqqrmmpra8vvpwl7gg25dsmn36xddj6p74hqxmjakq","stars19eaxsy2g7ztv7lwmxs4ak8hnwsu6sc6wh9xgluca2mnxzvqx7dmq6xc4aq","stars1n9yug8pjqfexr5quhxrtnjws8dkex04xey7akhn4zyt7le3ll7vq7yq3xz","stars122se4dsye7e59nxdg0dr4ynpv85whltpm46rj5g2r8c5ndl3fchspaxr6w","stars1t238fmfg89ex7vz0q7kta9fwty39c8w2mh0hlt9xrw35h8yrwmuskaqraq","stars16ks7kaah8954l8j8dglkqyspgp8dy0ktsr0gmtxqmeqvvnjaalmqqe2mty","stars1amg55mapn8hunahcfgjhfaq3cxf7gg7430kmd30deefswlp8h8cs263dcz","stars1qspm6gw4um6cmduqm0r2t75808dfhe62u538hnqld0pqwnnwsslqp3z4h7","stars18cd8crkrkxz8uqgegqgwl5jy6v9t6v5058ltnwc54xvpl9hwz3kqsh6tuq","stars1s4ms89ypz29z2u04668vsqcfp5fylucd95mp7gtagvdf8ud4uluqre09jq","stars1gz3ul7s9jp6w2qr6ws02rxx7jmh8slytpulcv3nnvg44csz8xcuslxd9zh","stars1muymzd9yv4dqtwhcj6mqqw5ygfdx3p77zw2w2n5q9a0kfal8vlmq03caqs","stars1qhea6qdjzwdcafcl7kvh2cv2acvz4shgyumrgahsvkld24cc8edsralncw","stars14cnwglkwrflwzelay9agt88jw0d5073ngmu4rjfc2xyrk0arp0aqcp3taf","stars1l555uy06r4y4wr5dr7v32m646fwskgupft0tlnf0fzpgcyjq7fkqc3j253","stars1ch34rt5mrh5tc2eqy6ssftdawhsq57ha0adyzgu84dxs5802cdyql3vct6","stars1zq3gsr76akuuq63lky8dsktdca2sea5r9hk5xq62z758nc769lhq02plwd","stars182eklqkwww29ucw6u5e2vypedjd6tkpeysfu6cpm8a87ud54ures4kf77a","stars13e02erduqhy086jdytc9ye8j5966se3sl65tjnr8jqm25nhppaqqlx9e7j","stars1p2f0tuckx6czud9alghrqavw9j4sjknc25a743wxm8tkujnasrrs93flqq","stars1ttdnjp9c93r35c2dcsgtnd6pjv4zkh2xq8kvjxruv9cq4yqyuj7sncn3v2","stars1ktn5k4grcr72jkj2der7aqm4r0ghkmykdtqk4p0rs0mgd9kmem3qukljzy","stars1e7yxt5prh9q8hkm8exrrnx6mzwr3n3ald5ezu6rd7mhj9v5e3yystuy35d"];

const getCollectionName = async (contractAddress, queryClient) => {
    try {
        const configResponse = await queryClient.queryContractSmart(
            contractAddress,
            {
                config: {}
            }
        );
        const contractInfoResponse = await queryClient.queryContractSmart(
            configResponse.sg721_address,
            {
                contract_info: {}
            }
        );
        return contractInfoResponse.name;
    } catch (error) {
        return null
    }
}

const isValidAddress = (address) => {
    try {
        const { prefix, data } = fromBech32(address);
        // wallet address length 20
        return data.length === 20;
    } catch (e) {
        console.error(e);
        return false;
    }
  };

const getCreators = async (contracts, allAddresses) => {
    let creators = [];
    const queryClient = await CosmWasmClient.connect("https://rpc.stargaze-1.publicawesome.dev/");
    for(const contractAddress of contracts) {
        if(blacklist.includes(contractAddress)) continue;
        const response = await axios.get(`${REST_URL}/cosmwasm/wasm/v1/contract/${contractAddress}`);
        if(!response.data) {
            console.error(`Error: Failed to fetch contract info for ${contractAddress}`);
        }
        if(!response.data.contract_info || !response.data.contract_info.creator) {
            console.error(`Error: Failed to fetch creator address for ${contractAddress}`);
        }
        if(!isValidAddress(response.data.contract_info.creator)) continue;
        // Check if creator has already been added
        if(
            !allAddresses.includes(response.data.contract_info.creator) && 
            !creators.find(
                (creator) => creator.address === response.data.contract_info.creator)
        ) {
            const collectionName = await getCollectionName(contractAddress, queryClient);
            // Save creator address if they have not been added yet
            creators.push({
                address: response.data.contract_info.creator,
                contractAddress: contractAddress,
                name: collectionName,
            });
        }
    }
    return creators;
};

const getContracts = async (blockHeight, codeIds) => {
    let contracts = [];
    for(const codeId of codeIds) {
        const response = await axios.get(
            `${REST_URL}/cosmwasm/wasm/v1/code/${codeId}/contracts?pagination.limit=10000`,
            {
                headers: {
                    "Content-Type": "application/json",
                    "x-cosmos-block-height": blockHeight
                }
            }
        );
        if(!response.data) {
            console.error(`Error: Failed to fetch contracts for Code ID #${codeId} at block #${blockHeight}`);
            return
        }
        if(Number(response.data.pagination.total) > 0) {
            console.error(`Error: Number of contracts was greater than the limit for Code ID #${codeId} at block #${blockHeight}`);
            return
        }
        contracts = [...contracts, ...response.data.contracts];
    }
    return contracts;
}

const fetchCreators = async (blockHeight, codeIds, allAddresses) => {
    const contracts = await getContracts(blockHeight, codeIds);
    const creators = await getCreators(contracts, allAddresses);
    const nonZeroBalanceSnapshot = await checkBalances(creators);

    fs.writeFileSync(`./data/snapshots/${blockHeight}/json/creators.json`, JSON.stringify(nonZeroBalanceSnapshot), { encoding: "utf8" });

    let spreadsheetData = [["Address", "Stars Balance", "Delegated Stars Balance", "Collection Address", "Name", "Launchpad URL"]];
    nonZeroBalanceSnapshot.forEach((addressDetails) => {
        allAddresses.push(addressDetails.address);
        spreadsheetData.push([
            addressDetails.address,
            addressDetails.starsBalance ?? "N/A",
            addressDetails.delegatedStarsBalance ?? "N/A",
            addressDetails.contractAddress ?? "N/A",
            addressDetails.name ?? "N/A",
            addressDetails.name ? `https://app.stargaze.zone/launchpad/${addressDetails.contractAddress}` : "N/A"
        ]);
    });

    const spreadsheetBuffer = xlsx.build([{ name: `Creators - ${blockHeight}`, data: spreadsheetData }]);
    fs.writeFileSync(`./data/snapshots/${blockHeight}/xlsx/creators.xlsx`, spreadsheetBuffer);

    console.log(`- Found ${nonZeroBalanceSnapshot.length} creators that instantiated a contract before block #${blockHeight}`);
    return;
}

module.exports = { fetchCreators }
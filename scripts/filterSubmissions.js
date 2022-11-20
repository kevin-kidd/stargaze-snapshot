const fs = require("fs");
const { toBech32, fromBech32 } = require("cosmwasm");
const xlsx = require("xlsx");
const nodeXlsx = require("node-xlsx");
const {getDelegatedStarsBalance, getStarsBalance} = require("./checkBalances");

let ALL_ADDRESSES = [];

const BLOCK_HEIGHTS = ["3252783", "4908610"];

// const REQUIRED_MIN_BALANCE = 50;
// const SHEET_TO_FILTER = "submissions_wave_4";

const REQUIRED_MIN_BALANCE = 0;
const SHEET_TO_FILTER = "submissions_ecosystem_addresses";

const toStars = (address) => {
  try {
    const { prefix, data } = fromBech32(address);
    const compatiblePrefixes = ['osmo', 'cosmos', 'stars', 'regen'];
    if (!compatiblePrefixes.includes(prefix)) {
      return null
    }
    const starsAddr = toBech32('stars', data);
    if (![20, 32].includes(data.length)) {
      return null
    }
    return starsAddr;
  } catch (e) {
    return null
  }
};

const filterSubmissions = async () => {

  // Combine all snapshot lists
  for(const height of BLOCK_HEIGHTS) {
    fs.readdirSync(`../data/snapshots/${height}/json/`).forEach(fileName => {
      if(fileName.slice(-4) === "json") {
        const snapshot = JSON.parse(fs.readFileSync(`../data/snapshots/${height}/json/${fileName}`, { encoding: "utf8" }));
        ALL_ADDRESSES.push(...snapshot);
      }
    });
  }

  ALL_ADDRESSES = ALL_ADDRESSES.map((address) => address.address);

  // Convert xlsx to json
  const workbook = xlsx.readFileSync(`../data/${SHEET_TO_FILTER}.xlsx`);
  const submissions = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

  console.log(`Total submissions: ${submissions.length}`);

  // Grab addreses from the json data and check if real address
  let addresses = submissions.map((element) => {
    const address = toStars(element['Your $STARS address']);
    if(address !== null && !ALL_ADDRESSES.includes(address)) return address;
  }).filter((address) => address !== undefined);

  console.log(`Addresses which aren't in previous snapshots: ${addresses.length}`);

  if(REQUIRED_MIN_BALANCE > 0) {
    let qualifiedAddresses = [];
    for(const address of addresses) {
      // Check balance
      const starsBalance = await getStarsBalance(address);
      const delegatedStarsBalance = await getDelegatedStarsBalance(address);
      if(starsBalance > REQUIRED_MIN_BALANCE || delegatedStarsBalance > REQUIRED_MIN_BALANCE) {
        qualifiedAddresses.push({
          address: address,
          starsBalance: starsBalance,
          delegatedStarsBalance: delegatedStarsBalance
        });
      }
    }
    addresses = qualifiedAddresses;
    console.log(`Addresses which have >${REQUIRED_MIN_BALANCE} stars: ${addresses.length}`);
  }

  // Create the spreadsheet data
  let spreadsheetData;
  if(REQUIRED_MIN_BALANCE > 0) {
    spreadsheetData = [["Address", "Stars Balance", "Delegated Stars Balance"]];
  } else {
    spreadsheetData = [["Address"]];
  }
  addresses.forEach((addressDetails) => {
      if(REQUIRED_MIN_BALANCE > 0) {
        spreadsheetData.push([
          addressDetails.address,
          addressDetails.starsBalance ?? "N/A",
          addressDetails.delegatedStarsBalance ?? "N/A"
        ]);
      } else {
        spreadsheetData.push([addressDetails]);
      }
  });

  const spreadsheetBuffer = nodeXlsx.build([{ name: "Filtered Submissions", data: spreadsheetData }]);
  fs.writeFileSync(`../data/snapshots/filtered_submissions/xlsx/${SHEET_TO_FILTER}.xlsx`, spreadsheetBuffer);
  fs.writeFileSync(`../data/snapshots/filtered_submissions/json/${SHEET_TO_FILTER}.json`, JSON.stringify(addresses, null, 2), { encoding: "utf8" });
}

filterSubmissions();
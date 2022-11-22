const fs = require("fs");
const { toBech32, fromBech32 } = require("cosmwasm");
const xlsx = require("xlsx");
const nodeXlsx = require("node-xlsx");
const {getDelegatedStarsBalance, getStarsBalance} = require("./checkBalances");

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

const filterSubmissions = async (minBalance, sheetName, allAddresses) => {
  // Convert xlsx to json
  const workbook = xlsx.readFile(`./data/${sheetName}.xlsx`);
  const submissions = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

  // Grab addreses from the json data and check if real address
  let addresses = submissions.map((element) => {
    const address = toStars(element['Your $STARS address']);
    if(address !== null && !allAddresses.includes(address)) {
      allAddresses.push(address);
      return address;
    }
  }).filter((address) => address !== undefined);

  if(minBalance > 0) {
    let qualifiedAddresses = [];
    for(const address of addresses) {
      // Check balance
      const starsBalance = await getStarsBalance(address);
      const delegatedStarsBalance = await getDelegatedStarsBalance(address);
      if(starsBalance > minBalance || delegatedStarsBalance > minBalance) {
        qualifiedAddresses.push({
          address: address,
          starsBalance: starsBalance,
          delegatedStarsBalance: delegatedStarsBalance
        });
      }
    }
    addresses = qualifiedAddresses;
  }

  // Create the spreadsheet data
  let spreadsheetData;
  if(minBalance > 0) {
    spreadsheetData = [["Address", "Stars Balance", "Delegated Stars Balance"]];
  } else {
    spreadsheetData = [["Address"]];
  }
  addresses.forEach((addressDetails) => {
      if(minBalance > 0) {
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
  fs.writeFileSync(`./data/snapshots/filtered_submissions/xlsx/${sheetName}.xlsx`, spreadsheetBuffer);
  fs.writeFileSync(`./data/snapshots/filtered_submissions/json/${sheetName}.json`, JSON.stringify(addresses, null, 2), { encoding: "utf8" });
}

module.exports = { filterSubmissions }
const fs = require("fs");

const snapshots = [
    {
        height: "3252783",
        types: ["creators", "stakers"]
    },
    {
        height: "4908610",
        types: ["creators", "ecosystem_devs", "stakers", "voters"]
    }
]

const removeDuplicates = () => {
    let allAddresses = [];
    let oldSnapshots = {
        "4908610": {},
        "3252783": {}
    }
    let newSnapshots = {
        "4908610": {},
        "3252783": {}
    };
    console.log("### OLD SNAPSHOTS ###");
    for(const snapshot of snapshots) {
        for(const snapshotType of snapshot.types) {
            const data = JSON.parse(fs.readFileSync(
                `../data/snapshots/${snapshot.height}/${snapshotType}.json`,
                { encoding: "utf8"}
            ));
            console.log(`${snapshot.height} - ${snapshotType} - total: ${data.length}`);
            allAddresses = [...allAddresses, ...data];
            oldSnapshots[snapshot.height][snapshotType] = data;
            newSnapshots[snapshot.height][snapshotType] = [];
        }
    }
    const uniqueAddresses = [...new Set(allAddresses)];
    for(const address of uniqueAddresses) {
    loop2:
        for(const [height, snapshotTypes] of Object.entries(oldSnapshots)) {
            for(const [snapshotType, snapshot] of Object.entries(snapshotTypes)) {
                if(snapshot.includes(address)) {
                    newSnapshots[height][snapshotType].push(address);
                    break loop2;
                }
            }
        }
    }
    console.log("\n### NEW SNAPSHOTS ###");
    for(const [height, snapshotTypes] of Object.entries(newSnapshots)) {
        for(const [snapshotType, snapshot] of Object.entries(snapshotTypes)) {
            fs.writeFileSync(
                `../data/snapshots/${height}/${snapshotType}.json`,
                JSON.stringify(snapshot),
                { encoding: "utf8" }
            );
            console.log(`${height} - ${snapshotType} - total: ${snapshot.length}`);
        }
    }
    console.log(`Successfully removed ${allAddresses.length - uniqueAddresses.length} duplicates!`);
}
removeDuplicates();
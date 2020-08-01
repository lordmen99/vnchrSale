usePlugin("@nomiclabs/buidler-waffle");

// This is a sample Buidler task. To learn how to create your own go to
// https://buidler.dev/guides/create-task.html
task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(await account.getAddress());
  }
});

// You have to export an object to set up your config
// This object can have the following optional entries:
// defaultNetwork, networks, solc, and paths.
// Go to https://buidler.dev/config/ to learn more
module.exports = {
  solc: {
    version: "0.6.6"
  },
  paths: {
    sources: "./contracts/6",
  },
  networks: {
    buidlerevm: {
      gas: "auto",
      gasMultiplier: 2,
      allowUnlimitedContractSize: true
    }
  }
};

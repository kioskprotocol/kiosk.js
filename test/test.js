const kiosk = require("../index.js");
// const registryABI = require("./registry.js")
const testrpc = require("ethereumjs-testrpc");
const Web3 = require("web3");
const assert = require("assert");
const async = require("async");
const fs = require("fs");
const solc = require("solc");
const Promise = require("bluebird");
const chai = require("chai"),
    expect = chai.expect,
    should = chai.should();

describe("kiosk", function() {
    this.timeout(15000);

    let web3;
    let registry;
    const genesisDIN = 1000000000;

    before(async function() {
        const provider = testrpc.provider();
        web3 = new Web3();
        web3.setProvider(provider);
        const getAccountsAsync = Promise.promisify(web3.eth.getAccounts);
        const accounts = await getAccountsAsync();

        const alice = accounts[0];
        const source = fs.readFileSync("test/DINRegistry.sol").toString();
        const compiled = solc.compile(source, 1);
        const deployer = compiled.contracts[":DINRegistry"];
        const registryContract = await web3.eth.contract(
            JSON.parse(deployer.interface)
        );
        const result = await registryContract.new(
            genesisDIN,
            {
                from: alice,
                data: deployer.bytecode,
                gas: 4700000
            },
            (err, result) => {
                console.log(result);
                done();
            }
        );
        console.log(result)
    });

    it("should test", () => {
        console.log("YES!");
    });
});
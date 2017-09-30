const kiosk = require("../index.js");
const testrpc = require("ethereumjs-testrpc");
const Web3 = require("web3");
const assert = require("assert");
const async = require('async');
const fs = require("fs");
const solc = require("solc");
const Promise = require("bluebird");
const chai = require("chai"),
    expect = chai.expect,
    should = chai.should();
const registryABI = [{"constant":true,"inputs":[{"name":"DIN","type":"uint256"}],"name":"resolver","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"registrar","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"DIN","type":"uint256"},{"name":"owner","type":"address"}],"name":"setOwner","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"DIN","type":"uint256"}],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"genesis","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"DIN","type":"uint256"}],"name":"updated","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"DIN","type":"uint256"},{"name":"resolver","type":"address"}],"name":"setResolver","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"DIN","type":"uint256"},{"name":"owner","type":"address"}],"name":"register","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_registrar","type":"address"}],"name":"setRegistrar","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_genesis","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"DIN","type":"uint256"},{"indexed":true,"name":"owner","type":"address"}],"name":"NewOwner","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"DIN","type":"uint256"},{"indexed":true,"name":"resolver","type":"address"}],"name":"NewResolver","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"DIN","type":"uint256"},{"indexed":true,"name":"owner","type":"address"}],"name":"NewRegistration","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"registrar","type":"address"}],"name":"NewRegistrar","type":"event"}]

describe("kiosk", () => {
    let web3;
    let registry;
    const genesisDIN = 1000000000;

    before(async () => {
        const provider = testrpc.provider();
        web3 = new Web3();
        web3.setProvider(provider);
        await web3.eth.getAccounts((err, accounts) => {
            const alice = accounts[0];
            const source = fs.readFileSync("test/DINRegistry.sol").toString();
            const compiled = solc.compile(source, 1);
            const deployer = compiled.contracts[":DINRegistry"];
            const registryContract = web3.eth.contract(
                JSON.parse(deployer.interface)
            );
            console.log(registryContract);
            // await registryContract.new(
            //     genesisDIN,
            //     {
            //         from: alice,
            //         data: deployer.bytecode,
            //         gas: 4700000
            //     },
            //     (err, result) => {
            //         console.log(result);
            //         done();
            //     }
            // );
            // console.log(result)
        });
    });

    it("should test", () => {
        console.log("YES!");
    });
});
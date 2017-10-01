const kiosk = require("../index.js");
const testrpc = require("ethereumjs-testrpc");
const Web3 = require("web3");
const assert = require("assert");
const async = require("async");
const fs = require("fs");
var solc = require("solc");
var Promise = require("bluebird");
var chai = require("chai"),
    expect = chai.expect,
    should = chai.should();

describe("Kiosk", function() {
    var web3;
    var kioskClient;
    var alice;
    var bob;
    var genesisDIN = 1000000000;

    before(function(done) {
        this.timeout(20000);
        web3 = new Web3();
        web3.setProvider(testrpc.provider());

        web3.eth.getAccounts(function(err, accounts) {
            alice = accounts[0];
            bob = accounts[1];
            var source = fs.readFileSync("test/DINRegistry.sol").toString();
            var compiled = solc.compile(source, 1);
            var deployer = compiled.contracts[":DINRegistry"];
            var registryContract = web3.eth.contract(
                JSON.parse(deployer.interface)
            );

            // Deploy the contract
            registryContract.new(
                genesisDIN,
                {
                    from: accounts[0],
                    data: deployer.bytecode,
                    gas: 4700000
                },
                function(err, registry) {
                    if (registry.address != undefined) {
                        kioskClient = new kiosk(web3, registry);
                        done();
                    }
                }
            );
        });
    });

    describe("#owner()", function() {
        it("should return the correct owner of a DIN", function(done) {
            kioskClient
                .owner(genesisDIN)
                .then(function(result) {
                    assert.equal(result, alice);
                })
                .catch(assert.isError)
                .finally(done);
        });
    });

    describe("#resolver()", function() {
        it("should return the correct resolver of a DIN", function(done) {
            kioskClient
                .resolver(genesisDIN)
                .then(function(result) {
                    assert.equal(
                        result,
                        "0x0000000000000000000000000000000000000000"
                    );
                })
                .catch(assert.isError)
                .finally(done);
        });
    });

    describe("#setOwner()", function() {
        it("should set the owner of a DIN", function(done) {
            kioskClient
                .setOwner(genesisDIN, bob, { from: alice })
                .then(function(result) {
                    kioskClient
                        .owner(genesisDIN)
                        .then(function(result) {
                            assert.equal(result, bob);
                        })
                        .catch(assert.isError)
                        .finally(done);
                });
        });
    });

    describe("#setResolver()", function() {
        it("should set the resolver of a DIN", function(done) {
            kioskClient
                .setResolver(
                    genesisDIN,
                    "0x1111111111111111111111111111111111111111",
                    { from: bob }
                )
                .then(function(result) {
                    kioskClient
                        .resolver(genesisDIN)
                        .then(function(result) {
                            assert.equal(
                                result,
                                "0x1111111111111111111111111111111111111111"
                            );
                        })
                        .catch(assert.isError)
                        .finally(done);
                });
        });
    });

});
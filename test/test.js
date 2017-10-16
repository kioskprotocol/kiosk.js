var kiosk = require("../index.js");
var Web3 = require("web3");
var testrpc = require("ethereumjs-testrpc");
var util = require("ethereumjs-util");
var ABI = require("ethereumjs-abi");
var assert = require("assert");
var BN = require("bn.js");
var fs = require("fs");
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
    var resolverAddress;
    var signature = {};

    before(function(done) {
        this.timeout(20000);

        web3 = new Web3();
        web3.setProvider(testrpc.provider());

        function resolverCallback() {
            done();
        }

        web3.eth.getAccounts(function(err, accounts) {
            alice = accounts[0];
            bob = accounts[1];
            var source = fs.readFileSync("test/DINRegistry.sol").toString();
            var compiled = solc.compile(source, 1);
            var registryDeployer = compiled.contracts[":DINRegistry"];
            var registryContract = web3.eth.contract(
                JSON.parse(registryDeployer.interface)
            );

            // Deploy the contract
            registryContract.new(
                genesisDIN,
                {
                    from: alice,
                    data: registryDeployer.bytecode,
                    gas: 4700000
                },
                function(err, registry) {
                    if (registry.address != undefined) {
                        kioskClient = new kiosk(web3, registry);
                        sign(web3);
                        // deployResolver(web3, resolverCallback);
                    }
                }
            );
        });
    });

    function deployResolver(web3, callback) {
        var resolverSource = fs
            .readFileSync("test/TestResolver.sol")
            .toString();
        var resolverCompiled = solc.compile(resolverSource, 1);
        var resolverDeployer = resolverCompiled.contracts[":TestResolver"];
        var resolverContract = web3.eth.contract(
            JSON.parse(resolverDeployer.interface)
        );
        resolverContract.new(
            {
                from: alice,
                data: resolverDeployer.bytecode,
                gas: 4700000
            },
            function(error, resolver) {
                if (resolver.address != undefined) {
                    resolverAddress = resolver.address;
                    kioskClient.setResolver(genesisDIN, resolver.address, {
                        from: alice
                    });
                    callback();
                }
            }
        );
    }

    function sign(web3) {
        var DIN = genesisDIN;
        var priceInMarks = 5 * Math.pow(10, 18); // 5 MARKs
        var price = new BN(priceInMarks.toString(), 16); // BigNumber
        var priceValidUntil = new Date().getTime() + 100000;

        var args = [
            genesisDIN,
            price,
            priceValidUntil
        ];

        var argTypes = [
            "uint256",
            "uint256",
            "uint256"
        ];

        var msg = ABI.soliditySHA3(argTypes, args);

        web3.eth.sign(alice, util.bufferToHex(msg), function(err, result) {
            signature = util.fromRpcSig(result);
        });

    }

    describe("#owner()", function() {
        it("should return the correct owner of a DIN", function(done) {
            kioskClient
                .owner(genesisDIN)
                .then(function(result) {
                    console.log(result);
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
                    console.log(result);
                    assert.equal(result, resolverAddress);
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

    // describe("#setResolver()", function() {
    //     it("should set the resolver of a DIN", function(done) {
    //         kioskClient
    //             .setResolver(
    //                 genesisDIN,
    //                 "0x1111111111111111111111111111111111111111",
    //                 { from: bob }
    //             )
    //             .then(function(result) {
    //                 kioskClient
    //                     .resolver(genesisDIN)
    //                     .then(function(result) {
    //                         assert.equal(
    //                             result,
    //                             "0x1111111111111111111111111111111111111111"
    //                         );
    //                     })
    //                     .catch(assert.isError)
    //                     .finally(done);
    //             });
    //     });
    // });

    describe("#productURL()", function() {
        it("should get the product URL for a given DIN", function(done) {
            kioskClient
                .productURL(1000000000)
                .then(function(result) {
                    console.log(result);
                    assert.equal(result, "https://www.google.com/");
                })
                .catch(assert.isError)
                .finally(done);
        });
    });

    // describe("#buy()", function() {
    //     it("should buy a product", function(done) {
    //         kioskClient.buy(1000000000, 1, ...)
    //     }
    // }
});
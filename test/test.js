const DINRegistrar = artifacts.require("DINRegistrar.sol");
const DINRegistry = artifacts.require("DINRegistry.sol");
const Buy = artifacts.require("Buy.sol");
const MarketToken = artifacts.require("marketToken.sol");
const TestResolver = artifacts.require("TestResolver.sol");

var Kiosk = require("../index.js");
var util = require("ethereumjs-util");
var ABI = require("ethereumjs-abi");
var assert = require("assert");
var BN = require("bn.js");
var Promise = require("bluebird");
var chai = require("chai"),
    expect = chai.expect,
    should = chai.should();

// Use "testrpc -s kiosk" in the terminal. 
// "kiosk" is the seed word that generates the hardcoded private key in the test.
contract("testrpc", accounts => {
    let kiosk;

    // Contracts
    let registry;
    let registrar;
    let resolver;
    let buy;
    let marketToken;

    // Accounts
    const alice = accounts[0];
    const bob = accounts[1];

    // Product
    const DIN = 1000000001;
    const price = 8000000;
    const priceValidUntil = new Date().getTime() + 100000;
    let signature = {};

    before(async () => {
        registry = await DINRegistry.deployed();
        registrar = await DINRegistrar.deployed();
        resolver = await TestResolver.deployed();
        buy = await Buy.deployed();
        marketToken = await MarketToken.deployed();

        web3.setProvider(new web3.providers.HttpProvider("http://localhost:8545"));
        kiosk = new Kiosk(web3, registry, buy);

        // Register a new DIN and set its resolver
        await registrar.registerDIN({ from: alice });
        await registry.setResolver(DIN, resolver.address); 

        // Alice signs message to sell product for 5 MARKs
        const args = [DIN, price, priceValidUntil];
        const argTypes = ["uint256", "uint256", "uint256"];
        const msg = ABI.soliditySHA3(argTypes, args);
        const result = await web3.eth.sign(alice, util.bufferToHex(msg));
        signature = util.fromRpcSig(result);
    });

    it("should return the correct owner of a DIN", async () => {
        const owner = await kiosk.owner(DIN);
        expect(owner).to.equal(alice);
    });

    it("should return the correct resolver of a DIN", async () => {
        const resolverAddr = await kiosk.resolver(DIN);
        expect(resolverAddr).to.equal(resolver.address);
    });

    it("should set the owner of a DIN", async () => {
        await kiosk.setOwner(DIN, bob, { from: alice });
        const owner = await kiosk.owner(DIN);
        expect(owner).to.equal(bob);
        await kiosk.setOwner(DIN, alice, { from: bob }); // Reset
    });

    it("should set the resolver of a DIN", async () => {
        await kiosk.setResolver(
            DIN,
            "0x1111111111111111111111111111111111111111",
            { from: alice }
        );
        const resolverAddr = await kiosk.resolver(DIN);
        expect(resolverAddr).to.equal(
            "0x1111111111111111111111111111111111111111"
        );
        await kiosk.setResolver(DIN, resolver.address); // Reset
    });

    it("should get the product URL for a given DIN", async () => {
        const url = await kiosk.productURL(DIN);
        expect(url).to.equal("https://www.google.com/");
    });

    it("should buy a product", async () => {
        // Send 5 MARKs to Bob
        await marketToken.transfer(bob, price, { from: alice });

        const balance = await marketToken.balanceOf(bob);
        expect(balance.toNumber()).to.equal(price);

        var { v, r, s } = signature;
        const result = await kiosk.buyProduct(
            DIN,
            1,
            price,
            priceValidUntil,
            v,
            util.bufferToHex(r),
            util.bufferToHex(s),
            { from: bob }
        );
        const newBalance = await marketToken.balanceOf(bob);
        expect(newBalance.toNumber()).to.equal(0);
    });

    it("should sign a raw buy transaction", async () => {
        // Send 5 MARKs to Bob
        await marketToken.transfer(bob, price, { from: alice });

        const balance = await marketToken.balanceOf(bob);
        expect(balance.toNumber()).to.equal(price);

        var { v, r, s } = signature;
        const rawTx = await kiosk.signRawTransactionBuy(
            DIN,
            1,
            price,
            priceValidUntil,
            v,
            util.bufferToHex(r),
            util.bufferToHex(s),
            bob,
            "7cf64495013211b2b3e75ea027741a312bc674d52ff5de03e6a426b46cf7647c" // Bob's private key
        );
        const result = await web3.eth.sendRawTransaction(rawTx);

        const newBalance = await marketToken.balanceOf(bob);
        expect(newBalance.toNumber()).to.equal(0);
    });

});
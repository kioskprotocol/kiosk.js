var Web3 = require("web3");
var StandardResolverJSON = require("../contracts/build/contracts/StandardResolver.json");
var Kiosk = require("../src/index.js");
var assert = require("assert");
var chai = require("chai"),
    expect = chai.expect,
    should = chai.should();
require("dotenv").config();

describe("Registry", () => {
    let web3;
    let kiosk;
    let buyer;
    let merchant;
    let resolver;
    const url = "https://api.examplestore.com/products/";
    const DIN = 1000000001;

    before(async () => {
        web3 = new Web3(
            new Web3.providers.HttpProvider("http://localhost:9545") // Ganache
        );
        const accounts = await web3.eth.getAccounts();
        merchant = accounts[0];
        buyer = accounts[1];
        kiosk = new Kiosk(web3, "4447", merchant);
        await kiosk.initialize();

        resolver = StandardResolverJSON["networks"]["4447"]["address"];
        // Register a DIN and set the resolver
        const result = await kiosk.registry.registerDINWithResolver(resolver);
    });

    it("should return the correct owner of a DIN", async () => {
        const owner = await kiosk.registry.getOwner(DIN);
        expect(owner).to.equal(merchant);
    });

    it("should return the correct resolver of a DIN", async () => {
        const resolverAddr = await kiosk.registry.getResolver(DIN);
        expect(resolverAddr.toLowerCase()).to.equal(resolver);
    });

    it("should get the product URL for a given DIN", async () => {
        const productURL = await kiosk.registry.getProductURL(DIN);
        expect(productURL).to.equal(url + DIN);
    });
});
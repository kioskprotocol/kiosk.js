var Web3 = require("web3");
var StandardResolverJSON = require("../contracts/build/contracts/StandardResolver.json");
var Kiosk = require("../src/index.js");
var assert = require("assert");
var chai = require("chai"),
    expect = chai.expect,
    should = chai.should();
require("dotenv").config();

describe("test", () => {
    let web3; // web3.js
    let kiosk; // kiosk.js
    let buyer;
    let merchant;
    const merchantPrivateKey =
        "0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3";

    const url = "https://api.examplestore.com/products/";

    var resolver;

    // Product
    let product;
    const DIN = 1000000001;

    // Order
    let order;
    let txHash;
    const nonce = "blah";

    // Signature
    let signature;

    before(async () => {
        web3 = new Web3(
            new Web3.providers.HttpProvider("http://localhost:9545") // Ganache
        );
        const accounts = await web3.eth.getAccounts();
        merchant = accounts[0];
        buyer = accounts[1];
        kiosk = new Kiosk(web3, "4447", merchant);

        resolver = StandardResolverJSON["networks"]["4447"]["address"];

        // Register a DIN and set the resolver
        await kiosk.registry.registerDINWithResolver(resolver);
    });

    it("should return the correct owner of a DIN", async () => {
        const owner = await kiosk.registry.owner(DIN);
        expect(owner).to.equal(merchant);
    });

    it("should return the correct resolver of a DIN", async () => {
        const resolverAddr = await kiosk.registry.resolver(DIN);
        expect(resolverAddr.toLowerCase()).to.equal(resolver);
    });

    it("should get the product URL for a given DIN", async () => {
        const productURL = await kiosk.registry.productURL(DIN);
        expect(productURL).to.equal(url + DIN);
    });

    it("should sign a price message", async () => {
        product = {
            DIN: 1000000001,
            quantity: 1,
            price: 8000000,
            priceValidUntil: 1514160000,
            merchant: merchant
        };
        signature = await kiosk.signPriceMessage(product, merchantPrivateKey);
        expect(signature).to.exist;
    });

    // it("should validate a signature", async () => {
    //     const hash = web3.utils.soliditySha3(
    //         DIN,
    //         price,
    //         priceValidUntil,
    //         merchant,
    //         affiliateReward,
    //         loyaltyReward,
    //         loyaltyToken
    //     );
    //     const valid = await kiosk.isValidSignature(
    //         merchant,
    //         hash,
    //         signature.v,
    //         signature.r,
    //         signature.s
    //     );
    //     expect(valid).to.equal(true);
    // });

    // it("should buy a product", async () => {
    //     const nonceHash = kiosk.hash(nonce);
    //     const result = await kiosk.executeBuy(order, 0, nonceHash, signature, buyer);
    //     txHash = result.transactionHash;
    //     expect(result).to.exist;
    // })

    // it("should get order events", async () => {
    //     const order = await kiosk.getOrder(txHash);
    //     expect(order.DIN).to.equal(DIN.toString());
    // });

    // it("should validate an order", async () => {
    //     const isValid = await kiosk.isValidOrder(txHash, nonce, merchant);
    //     expect(isValid).to.equal(true);
    // });

    // it("should not validate an order with an incorrect nonce", async () => {
    //     const isValid = await kiosk.isValidOrder(txHash, "fake", merchant);
    //     expect(isValid).to.equal(false);
    // });

    // it("should have the correct order index", async () => {
    //     const index = await kiosk.getOrderIndex();
    //     expect(index).to.exist;
    // });
});
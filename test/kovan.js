var Web3 = require("web3");
var Kiosk = require("../src/index.js");
var assert = require("assert");
var chai = require("chai"),
    expect = chai.expect,
    should = chai.should();
require("dotenv").config();

describe("kovan", () => {
    let web3;
    let kiosk;
    let buyer;
    let seller; // Owner of DIN 1000000001 on Kovan

    // Product
    const DIN = 1000000001;
    const quantity = 1;
    const price = 8000000;
    const priceValidUntil = 1514160000;

    // Signature
    let signature;
    let rawTx;

    before(async () => {
        web3 = new Web3(
            new Web3.providers.HttpProvider(process.env.INFURA_KOVAN)
        );
        web3.eth.accounts.wallet.add(process.env.BUYER_PRIVATE_KEY);
        web3.eth.accounts.wallet.add(process.env.SELLER_PRIVATE_KEY);
        buyer = web3.eth.accounts.wallet[0];
        seller = web3.eth.accounts.wallet[1];
        kiosk = new Kiosk(web3);
    });

    it("should return the correct owner of a DIN", async () => {
        const owner = await kiosk.owner(DIN);
        expect(owner).to.equal(seller.address);
    });

    it("should return the correct resolver of a DIN", async () => {
        const resolver = await kiosk.resolver(DIN);
        expect(resolver).to.equal("0xA9b81c7d571717f0817688252EF2C9cCc039B939");
    });

    it("should get the product URL for a given DIN", async () => {
        const url = await kiosk.productURL(DIN);
        expect(url).to.equal("https://kiosk-demo-shop.herokuapp.com/v0/products/");
    });

    it("should sign a price message", async () => {
        signature = await kiosk.signPriceMessage(
            DIN,
            price,
            priceValidUntil,
            seller.privateKey
        );
        console.log(signature);
    });

    it("should validate a signature", async () => {
        const hash = web3.utils.soliditySha3(
            { type: "uint256", value: DIN },
            { type: "uint256", value: price },
            { type: "uint256", value: priceValidUntil }
        );
        const valid = await kiosk.isValidSignature(
            seller.address,
            hash,
            signature.v,
            signature.r,
            signature.s
        );
        expect(valid).to.equal(true);
    });

    it("should sign a buy transaction", async () => {
        const signedTx = await kiosk.signBuyTransaction(
            DIN,
            quantity,
            price,
            priceValidUntil,
            signature.v,
            signature.r,
            signature.s,
            buyer.address,
            buyer.privateKey
        );
        rawTx = signedTx.rawTransaction;
        console.log(rawTx);
        // const result = await web3.eth.sendSignedTransaction(rawTx);
        // console.log("RESULT: " + result);
    });
});
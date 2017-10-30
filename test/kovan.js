var Web3 = require("web3");
var Kiosk = require("../dist/index.js");
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

    let isWeb3Beta = false;

    // Product
    const DIN = 1000000011;
    const quantity = 1;
    const price = 8000000;
    const priceCurrency = "0x0000000000000000000000000000000000000000"; // Ether
    const priceValidUntil = 1514160000;
    const affiliateFee = 0;
    const affiliate = "0x0000000000000000000000000000000000000000"; // No affiliate

    // Order
    const orderID = 1;

    // Signature
    let signature;

    before(async () => {
        kiosk = new Kiosk(process.env.INFURA_KOVAN);
        web3 = kiosk.web3;

        // Version 1.X
        if (typeof web3.version === "string") {
            isWeb3Beta = true;
            web3.eth.accounts.wallet.add(process.env.BUYER_PRIVATE_KEY);
            web3.eth.accounts.wallet.add(process.env.SELLER_PRIVATE_KEY);
            buyer = web3.eth.accounts.wallet[0];
            seller = web3.eth.accounts.wallet[1];
        }
    });

    it("should return the correct owner of a DIN", async () => {
        const owner = await kiosk.owner(DIN);
        expect(owner).to.equal("0x001183d6fe9604fb2a1923d92a35b3fd063c4e05");
    });

    it("should return the correct resolver of a DIN", async () => {
        const resolver = await kiosk.resolver(DIN);
        expect(resolver).to.equal("0xc5e1eaea601b7a64d01b74c747ceab7fcbe429f9");
    });

    it("should get the product URL for a given DIN", async () => {
        const url = await kiosk.productURL(DIN);
        expect(url).to.equal("https://kiosk-shopify.herokuapp.com/");
    });

    it("should get the correct merchant for a given DIN", async () => {
        const merchant = await kiosk.merchant(DIN);
        console.log(merchant);
    });

    it("should get the cart for a given buyer", async () => {
        const cart = await kiosk.getCart(buyer.address);
        // console.log(cart);
    });

    it("should get the details for a given order", async () => {
        const order = await kiosk.getOrder(orderID);
    });

    it("should sign a price message", async () => {
        signature = await kiosk.signPriceMessage(
            DIN,
            price,
            priceCurrency,
            priceValidUntil,
            affiliateFee,
            seller.privateKey
        );
        // console.log(signature);
    });

    it("should validate a signature", async () => {
        const hash = web3.utils.soliditySha3(
            { type: "uint256", value: DIN },
            { type: "uint256", value: price },
            { type: "address", value: priceCurrency },
            { type: "uint256", value: priceValidUntil },
            { type: "uint256", value: affiliateFee }
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

    it("should sign an add to cart transaction", async () => {
        const signedTx = await kiosk.signAddToCartTransaction(
            DIN,
            buyer.address,
            buyer.privateKey
        );
        // const result = await web3.eth.sendSignedTransaction(signedTx);
    });

    it("should sign a buy transaction", async () => {
        const signedTx = await kiosk.signBuyTransaction(
            DIN,
            quantity,
            price,
            priceCurrency,
            priceValidUntil,
            affiliateFee,
            affiliate,
            signature.v,
            signature.r,
            signature.s,
            buyer.address,
            buyer.privateKey
        );
        // console.log(signedTx);
        // const result = await web3.eth.sendSignedTransaction(signedTx);
    });
});
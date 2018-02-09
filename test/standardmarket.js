var Web3 = require("web3");
var StandardResolverJSON = require("../contracts/build/contracts/StandardResolver.json");
var Kiosk = require("../src/index.js");
var assert = require("assert");
var chai = require("chai"),
    expect = chai.expect,
    should = chai.should();
require("dotenv").config();

describe("DINRegistry", () => {
    let web3;
    let kiosk;
    let buyer;
    let merchant;
    let resolver;
    const url = "https://api.examplestore.com/products/";
    const DIN = 1000000001;
    let signature;
    let cartItem;

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

    it("should should sign a price message", async () => {
        // TODO: Price BigNumber
        const product = {
            DIN: DIN,
            quantity: 1,
            price: 100,
            priceValidUntil: 1577836800, 
            merchant: merchant
        };
        signature = await kiosk.utils.sign(product, process.env.MERCHANT_PRIVATE_KEY);
        cartItem = {
            DIN: product.DIN,
            quantity: product.quantity,
            price: product.price,
            priceValidUntil: product.priceValidUntil,
            merchant: product.merchant,
            v: signature.v,
            r: signature.r,
            s: signature.s
        }
        expect(signature).to.exist;
    });

    it("should buy cart items", async () => {
        const result = await kiosk.market.buyCartItems([cartItem]);
        console.log(result._parent.events.LogError());
    });

});

// Order
// let order;
// let txHash;

// Signature
// let signature;

// it("should validate a signature", async () => {
//     const hash = web3.utils.soliditySha3(
//         DIN,
//         price,
//         priceValidUntil,
//         merchant
//     );
//     const valid = await kiosk.utils.isValidSignature(
//         merchant,
//         hash,
//         signature.v,
//         signature.r,
//         signature.s
//     );
//     expect(valid).to.equal(true);
// });

//     const quantity = 1;
// const price = 8000000;
// const priceValidUntil = 1514160000;

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
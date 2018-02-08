// Order
// let order;
// let txHash;
// const nonce = "blah";

// const merchantPrivateKey =
// "0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3";

// Signature
// let signature;

// it("should sign a price message", async () => {
//     const product = {
//         DIN: DIN,
//         quantity: quantity,
//         price: price,
//         priceValidUntil: priceValidUntil,
//         merchant: merchant
//     };
//     signature = await kiosk.utils.sign(product, merchantPrivateKey);
//     expect(signature).to.exist;
// });

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
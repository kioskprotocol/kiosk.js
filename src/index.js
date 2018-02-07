import Registry from "./registry";
import Resolver from "./resolver";
var Account = require("eth-lib/lib/account");

class Kiosk {
    constructor(web3, networkId, account) {
        this.web3 = web3;
        this.registry = new Registry(web3, networkId, account);
        this.resolver = new Resolver(web3, networkId, account);
    }

    // hash(nonce) {
    //     return this.web3.utils.sha3(nonce);
    // }

    signPriceMessage(product, privateKey) {
        const hash = this.web3.utils.soliditySha3(
            { type: "uint256", value: product.DIN },
            { type: "uint256", value: product.price },
            { type: "uint256", value: product.priceValidUntil },
            { type: "address", value: product.merchant }
        );
        var prefix = "\x19Ethereum Signed Message:\n32";
        var messageHash = this.web3.utils.soliditySha3(prefix, hash);
        var signature = Account.sign(messageHash, privateKey);
        var vrs = Account.decodeSignature(signature);
        var v = vrs[0];
        return {
            v: this.web3.utils.toDecimal(v),
            r: vrs[1],
            s: vrs[2]
        };
    }

    // // This is the method to use
    // executeBuy(order, loyaltyAmount, nonceHash, signature, account) {
    //     return new Promise((resolve, reject) => {
    //         this.buy(
    //             order,
    //             loyaltyAmount,
    //             nonceHash,
    //             signature,
    //             account,
    //             false
    //         ).then(result => {
    //             if (result > 0) {
    //                 // Execute the actual buy transaction
    //                 this.buy(
    //                     order,
    //                     loyaltyAmount,
    //                     nonceHash,
    //                     signature,
    //                     account,
    //                     true
    //                 )
    //                     .then(result => {
    //                         resolve(result);
    //                     })
    //                     .catch(error => {
    //                         reject(error);
    //                     });
    //             } else {
    //                 reject("There was an error when calling this transaction");
    //             }
    //         });
    //     });
    // }

    // buy(
    //     order,
    //     loyaltyAmount,
    //     nonceHash,
    //     signature,
    //     account,
    //     isTransaction = false
    // ) {
    //     return new Promise((resolve, reject) => {
    //         const orderValues = [
    //             order.DIN,
    //             order.quantity,
    //             order.totalPrice,
    //             order.priceValidUntil,
    //             order.affiliateReward,
    //             order.loyaltyReward
    //         ];
    //         const orderAddresses = [
    //             order.merchant,
    //             order.affiliate,
    //             order.loyaltyToken
    //         ];
    //         const value = Math.max(order.totalPrice - loyaltyAmount, 0);
    //         const txParams = {
    //             from: account,
    //             value: value,
    //             gas: 200000,
    //             gasPrice: this.web3.utils.toWei("20", "gwei")
    //         };
    //         const buy = this.checkout.methods.buy(
    //             orderValues,
    //             orderAddresses,
    //             nonceHash,
    //             signature.v,
    //             signature.r,
    //             signature.s
    //         );
    //         // Dry run
    //         if (isTransaction === false) {
    //             buy.call(txParams, (error, result) => {
    //                 if (error) {
    //                     reject(error);
    //                 } else {
    //                     resolve(result);
    //                 }
    //             });
    //         } else {
    //             buy
    //                 .send(txParams)
    //                 .on("receipt", receipt => {
    //                     resolve(receipt);
    //                 })
    //                 .on("error", err => {
    //                     reject(err);
    //                 });
    //         }
    //     });
    // }

    // isValidSignature(signer, hash, v, r, s) {
    //     return this.checkout.methods
    //         .isValidSignature(signer, hash, v, r, s)
    //         .call();
    // }

    // isValidLoyaltyToken(tokenAddress) {
    //     return this.loyaltyRegistry.methods.whitelist(tokenAddress).call();
    // }

    // getOrder(txHash) {
    //     return new Promise((resolve, reject) => {
    //         this.web3.eth.getTransactionReceipt(txHash).then(result => {
    //             const data = result.logs[0].data;
    //             const params = this.web3.eth.abi.decodeParameters(
    //                 [
    //                     "bytes32",
    //                     "address",
    //                     "uint256",
    //                     "uint256",
    //                     "uint256",
    //                     "uint256"
    //                 ],
    //                 data
    //             );
    //             const topics = result.logs[0].topics;
    //             const orderID = this.web3.eth.abi.decodeParameter(
    //                 "uint256",
    //                 topics[1]
    //             );
    //             const buyer = this.web3.eth.abi.decodeParameter(
    //                 "address",
    //                 topics[2]
    //             );
    //             const merchant = this.web3.eth.abi.decodeParameter(
    //                 "address",
    //                 topics[3]
    //             );
    //             const order = {
    //                 orderID: orderID,
    //                 nonceHash: params["0"],
    //                 checkout: params["1"],
    //                 buyer: buyer,
    //                 merchant: merchant,
    //                 DIN: params["2"],
    //                 quantity: params["3"],
    //                 totalPrice: params["4"],
    //                 timestamp: params["5"]
    //             };
    //             resolve(order);
    //         });
    //     });
    // }

    // isValidOrder(txHash, nonce, merchant) {
    //     return new Promise(resolve => {
    //         this.getOrder(txHash).then(order => {
    //             const nonceHash = this.hash(nonce);
    //             if (
    //                 order.nonceHash === nonceHash &&
    //                 order.merchant === merchant
    //             ) {
    //                 resolve(true);
    //             } else {
    //                 resolve(false);
    //             }
    //         });
    //     });
    // }

    // getOrderIndex() {
    //     return this.orders.methods.orderIndex().call();
    // }
}

module.exports = Kiosk;
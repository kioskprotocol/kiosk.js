import ContractWrapper from "./ContractWrapper";
var StandardMarketJSON = require("../../contracts/build/contracts/StandardMarket.json");

export default class StandardMarket extends ContractWrapper {
    constructor(web3) {
        super(web3);
    }

    async initialize() {
        await super.initialize(StandardMarketJSON);
    }

    async buyCartItems(cartItems) {
        const nonceHash = this.web3.utils.sha3("123");
        let orderValuesArray = [];
        let orderAddressesArray = [];
        let v = [];
        let r = [];
        let s = [];
        let totalPrice = 0;
        for (let i = 0; i < cartItems.length; i++) {
            const cartItem = cartItems[i];
            const orderValues = [
                cartItem.DIN,
                cartItem.quantity,
                cartItem.price,
                cartItem.priceValidUntil
            ];
            totalPrice += cartItem.price;
            orderValuesArray.push(orderValues);
            const orderAddresses = [cartItem.merchant];
            orderAddressesArray.push(orderAddresses);
            v.push(cartItem.v);
            r.push(cartItem.r);
            s.push(cartItem.s);
        }
        return await this.contract.methods
            .buyProducts(
                orderValuesArray,
                orderAddressesArray,
                nonceHash,
                v,
                r,
                s
            )
            .send({
                from: this.account,
                gas: 1000000,
                value: totalPrice
            });
    }

    async isValidSignature(signer, hash, v, r, s) {
        return await this.contract.methods
            .isValidSignature(signer, hash, v, r, s)
            .call();
    }

    // This is the method to use
    executeBuy(order, loyaltyAmount, nonceHash, signature, account) {
        return new Promise((resolve, reject) => {
            this.buy(
                order,
                loyaltyAmount,
                nonceHash,
                signature,
                account,
                false
            ).then(result => {
                if (result > 0) {
                    // Execute the actual buy transaction
                    this.buy(
                        order,
                        loyaltyAmount,
                        nonceHash,
                        signature,
                        account,
                        true
                    )
                        .then(result => {
                            resolve(result);
                        })
                        .catch(error => {
                            reject(error);
                        });
                } else {
                    reject("There was an error when calling this transaction");
                }
            });
        });
    }

    buy(
        order,
        loyaltyAmount,
        nonceHash,
        signature,
        account,
        isTransaction = false
    ) {
        return new Promise((resolve, reject) => {
            const orderValues = [
                order.DIN,
                order.quantity,
                order.totalPrice,
                order.priceValidUntil,
                order.affiliateReward,
                order.loyaltyReward
            ];
            const orderAddresses = [
                order.merchant,
                order.affiliate,
                order.loyaltyToken
            ];
            const value = Math.max(order.totalPrice - loyaltyAmount, 0);
            const txParams = {
                from: account,
                value: value,
                gas: 200000,
                gasPrice: this.web3.utils.toWei("20", "gwei")
            };
            const buy = this.checkout.methods.buy(
                orderValues,
                orderAddresses,
                nonceHash,
                signature.v,
                signature.r,
                signature.s
            );
            // Dry run
            if (isTransaction === false) {
                buy.call(txParams, (error, result) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(result);
                    }
                });
            } else {
                buy
                    .send(txParams)
                    .on("receipt", receipt => {
                        resolve(receipt);
                    })
                    .on("error", err => {
                        reject(err);
                    });
            }
        });
    }
}

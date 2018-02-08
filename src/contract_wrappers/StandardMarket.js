export default class StandardMarket {
    
    async isValidSignature(signer, hash, v, r, s) {
        return await this.checkout.methods
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
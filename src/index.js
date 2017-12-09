var DINRegistryContract = require("../contracts/build/contracts/DINRegistry.json");
var ResolverContract = require("../contracts/build/contracts/StandardResolver.json");
var CheckoutContract = require("../contracts/build/contracts/Checkout.json");
var OrdersContract = require("../contracts/build/contracts/Orders.json");
var ERC20Contract = require("../contracts/build/contracts/ERC20.json");
var LoyaltyTokenRegistryContract = require("../contracts/build/contracts/LoyaltyTokenRegistry.json");
var MarketTokenContract = require("../contracts/build/contracts/MarketToken.json");
var Account = require("eth-lib/lib/account");

class Kiosk {
    constructor(web3, networkId) {
        // Ganache (local) and Kovan
        const supportedNetworkIds = ["5777", "42"];

        if (supportedNetworkIds.includes(networkId.toString()) === false) {
            return null;
        }

        this.web3 = web3;

        // Initialize contracts
        var registryAddress =
            DINRegistryContract["networks"][networkId]["address"];
        this.registry = new this.web3.eth.Contract(
            DINRegistryContract.abi,
            registryAddress
        );
        var checkoutAddress =
            CheckoutContract["networks"][networkId]["address"];
        this.checkout = new this.web3.eth.Contract(
            CheckoutContract.abi,
            checkoutAddress
        );
        var ordersAddress = OrdersContract["networks"][networkId]["address"];
        this.orders = new this.web3.eth.Contract(
            OrdersContract.abi,
            ordersAddress
        );
        var loyaltyRegistryAddress =
            LoyaltyTokenRegistryContract["networks"][networkId]["address"];
        this.loyaltyRegistry = new this.web3.eth.Contract(
            LoyaltyTokenRegistryContract.abi,
            loyaltyRegistryAddress
        );
        var marketTokenAddress =
            MarketTokenContract["networks"][networkId]["address"];
        this.marketToken = new this.web3.eth.Contract(
            MarketTokenContract.abi,
            marketTokenAddress
        );
    }

    owner(DIN) {
        return this.registry.methods.owner(DIN).call();
    }

    resolver(DIN) {
        return this.registry.methods.resolver(DIN).call();
    }

    productURL(DIN) {
        return this.resolver(DIN).then(resolverAddr => {
            const resolver = new this.web3.eth.Contract(
                ResolverContract.abi,
                resolverAddr
            );
            return resolver.methods.productURL(DIN).call();
        });
    }

    merchant(DIN) {
        return this.resolver(DIN).then(resolverAddr => {
            const resolver = new this.web3.eth.Contract(
                ResolverContract.abi,
                resolverAddr
            );
            return resolver.methods.merchant(DIN).call();
        });
    }

    hash(nonce) {
        return this.web3.utils.sha3(nonce);
    }

    getETHBalance(account) {
        return this.web3.eth.getBalance(account);
    }

    getMARKBalance(account) {
        return this.marketToken.methods.balanceOf(account).call();
    }

    getERC20Balance(account, tokenAddress) {
        const tokenContract = new this.web3.eth.Contract(
            ERC20Contract.abi,
            tokenAddress
        );
        return tokenContract.methods.balanceOf(account).call();
    }

    // Returns the last token deployed by a given merchant via the Loyalty Token Registry
    getLoyaltyToken(merchant) {
        return this.loyaltyRegistry
            .getPastEvents("NewToken", {
                filter: { merchant: merchant },
                fromBlock: 0,
                toBlock: "latest"
            })
            .then(events => {
                if (events.length > 0) {
                    return events[events.length - 1].returnValues.token;
                }
                return null;
            });
    }

    signPriceMessage(product, privateKey) {
        const hash = this.web3.utils.soliditySha3(
            { type: "uint256", value: product.DIN },
            { type: "uint256", value: product.price },
            { type: "uint256", value: product.priceValidUntil },
            { type: "address", value: product.merchant },
            { type: "uint256", value: product.affiliateReward },
            { type: "uint256", value: product.loyaltyReward },
            { type: "address", value: product.loyaltyToken }
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

    isValidSignature(signer, hash, v, r, s) {
        return this.checkout.methods
            .isValidSignature(signer, hash, v, r, s)
            .call();
    }

    isValidLoyaltyToken(tokenAddress) {
        return this.loyaltyRegistry.methods.whitelist(tokenAddress).call();
    }

    getOrder(txHash) {
        return new Promise((resolve, reject) => {
            this.web3.eth.getTransactionReceipt(txHash).then(result => {
                const data = result.logs[0].data;
                const params = this.web3.eth.abi.decodeParameters(
                    [
                        "bytes32",
                        "address",
                        "uint256",
                        "uint256",
                        "uint256",
                        "uint256"
                    ],
                    data
                );
                const topics = result.logs[0].topics;
                const orderID = this.web3.eth.abi.decodeParameter(
                    "uint256",
                    topics[1]
                );
                const buyer = this.web3.eth.abi.decodeParameter(
                    "address",
                    topics[2]
                );
                const merchant = this.web3.eth.abi.decodeParameter(
                    "address",
                    topics[3]
                );
                const order = {
                    orderID: orderID,
                    nonceHash: params["0"],
                    checkout: params["1"],
                    buyer: buyer,
                    merchant: merchant,
                    DIN: params["2"],
                    quantity: params["3"],
                    totalPrice: params["4"],
                    timestamp: params["5"]
                };
                resolve(order);
            });
        });
    }

    isValidOrder(txHash, nonce, merchant) {
        return new Promise(resolve => {
            this.getOrder(txHash).then(order => {
                const nonceHash = this.hash(nonce);
                if (
                    order.nonceHash === nonceHash &&
                    order.merchant === merchant
                ) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            });
        });
    }

    getOrderIndex() {
        return this.orders.methods.orderIndex().call();
    }
}

module.exports = Kiosk;
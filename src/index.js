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
                return events[events.length - 1].returnValues.token;
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

    buy(order, nonceHash, signature, account) {
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
        return this.checkout.methods
            .buy(
                orderValues,
                orderAddresses,
                nonceHash,
                signature.v,
                signature.r,
                signature.s
            )
            .send({
                from: account,
                value: order.totalPrice
            });
    }

    isValidSignature(signer, hash, v, r, s) {
        return this.checkout.methods
            .isValidSignature(signer, hash, v, r, s)
            .call();
    }

    isValidOrder(orderID, nonce, merchant) {
        return this.orders
            .getPastEvents("NewOrder", {
                filter: { orderID: orderID },
                fromBlock: 0,
                toBlock: "latest"
            })
            .then(events => {
                if (events.length === 1) {
                    const log = events[0].returnValues;
                    if (
                        this.hash(nonce) === log.nonceHash &&
                        merchant.toUpperCase() === log.merchant.toUpperCase() // Case insensitive compare
                    ) {
                        return true;
                    }
                    return false;
                } else {
                    return false;
                }
            })
            .catch(error => {
                return false;
            });
    }

    isValidLoyaltyToken(tokenAddress) {
        return this.loyaltyRegistry.methods.whitelist(tokenAddress).call();
    }

    getOrder(orderID) {
        return this.orders
            .getPastEvents("NewOrder", {
                filter: { orderID: orderID },
                fromBlock: 0,
                toBlock: "latest"
            })
            .then(events => {
                if (events.length === 1) {
                    return events[0].returnValues;
                }
            });
    }
}

module.exports = Kiosk;
var DINRegistryContract = require("../contracts/build/contracts/DINRegistry.json");
var ResolverContract = require("../contracts/build/contracts/StandardResolver.json");
var CheckoutContract = require("../contracts/build/contracts/Checkout.json");
var OrdersContract = require("../contracts/build/contracts/Orders.json");
var Account = require("eth-lib/lib/account");

class Kiosk {
    constructor(web3, networkId) {
        this.web3 = web3;
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

    signPriceMessage(
        DIN,
        price,
        priceValidUntil,
        affiliateReward,
        loyaltyReward,
        loyaltyToken,
        privateKey
    ) {
        const hash = this.web3.utils.soliditySha3(
            { type: "uint256", value: DIN },
            { type: "uint256", value: price },
            { type: "uint256", value: priceValidUntil },
            { type: "uint256", value: affiliateReward },
            { type: "uint256", value: loyaltyReward },
            { type: "address", value: loyaltyToken }
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

    buy(
        DIN,
        quantity,
        totalPrice,
        priceValidUntil,
        affiliateReward,
        loyaltyReward,
        affiliate,
        loyaltyToken,
        nonceHash,
        v,
        r,
        s,
        account
    ) {
        const orderValues = [
            DIN,
            quantity,
            totalPrice,
            priceValidUntil,
            affiliateReward,
            loyaltyReward
        ];
        const orderAddresses = [affiliate, loyaltyToken];
        return this.checkout.methods
            .buy(orderValues, orderAddresses, nonceHash, v, r, s)
            .send({
                from: account,
                value: totalPrice
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
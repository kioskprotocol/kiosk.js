var DINRegistryContract = require("../contracts/build/contracts/DINRegistry.json");
var ResolverContract = require("../contracts/build/contracts/StandardResolver.json");
var CheckoutContract = require("../contracts/build/contracts/Checkout.json");
var OrdersContract = require("../contracts/build/contracts/Orders.json");

class Kiosk {
    constructor(web3) {
        this.web3 = web3;

        const networkId = "4447";

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
        account
    ) {
        const hash = this.web3.utils.soliditySha3(
            DIN,
            price,
            priceValidUntil,
            affiliateReward,
            loyaltyReward,
            loyaltyToken
        );
        return this.web3.eth.sign(hash, account).then(signedMessage => {
            // https://ethereum.stackexchange.com/questions/1777/workflow-on-signing-a-string-with-private-key-followed-by-signature-verificatio/1794#1794
            const v = "0x" + signedMessage.slice(130, 132);
            const r = signedMessage.slice(0, 66);
            const s = "0x" + signedMessage.slice(66, 130);

            const signature = {
                v: this.web3.utils.toDecimal(v) + 27,
                r: r,
                s: s
            };

            return signature;
        });
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
                if (events.length > 0) {
                    const log = events[0].returnValues;
                    const nonceHash = log.nonceHash;
                    if (nonceHash === this.hash(nonce) && merchant === log.merchant) {
                        return true;
                    }
                    return false;
                } else {
                    return false;
                }
            });
    }
}

module.exports = Kiosk;
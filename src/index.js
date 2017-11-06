var contract = require("truffle-contract");
var DINRegistryContract = require("../contracts/build/contracts/DINRegistry.json");
var ResolverContract = require("../contracts/build/contracts/StandardResolver.json");
var CheckoutContract = require("../contracts/build/contracts/Checkout.json");
var CartContract = require("../contracts/build/contracts/Cart.json");

class Kiosk {
    constructor(web3) {
        this.web3 = web3;

        this.registry = contract(DINRegistryContract);
        this.registry.setProvider(this.web3.currentProvider);

        this.checkout = contract(CheckoutContract);
        this.checkout.setProvider(this.web3.currentProvider);

        this.cart = contract(CartContract);
        this.cart.setProvider(this.web3.currentProvider);
    }

    owner(DIN) {
        return this.registry.deployed().then(instance => {
            return instance.owner(DIN);
        });
    }

    resolver(DIN) {
        return this.registry.deployed().then(instance => {
            return instance.resolver(DIN);
        });
    }

    productURL(DIN) {
        return this.resolver(DIN).then(resolverAddr => {
            const resolver = contract(ResolverContract);
            resolver.setProvider(this.web3.currentProvider);
            return resolver.at(resolverAddr).then(instance => {
                return instance.productURL(DIN);
            });
        });
    }

    merchant(DIN) {
        return this.resolver(DIN).then(resolverAddr => {
            const resolver = contract(ResolverContract);
            resolver.setProvider(this.web3.currentProvider);
            return resolver.at(resolverAddr).then(instance => {
                return instance.merchant(DIN);
            });
        });
    }

    getCart(buyer) {
        var DINs = [];
        var address = CartContract["networks"]["42"]["address"];
        var cart = new this.web3.eth.Contract(CartContract.abi, address);
        return cart
            .getPastEvents("AddToCart", {
                filter: { buyer: buyer },
                fromBlock: 0,
                toBlock: "latest"
            })
            .then(results => {
                for (let i = 0; i < results.length; i++) {
                    var result = results[i];
                    var DIN = result.returnValues.DIN;
                    if (DINs.includes(DIN) === false) {
                        DINs.push(DIN);
                    }
                }
                return DINs;
            });
    }

    getOrders(buyer) {
        var orders = [];
        var address = CheckoutContract["networks"]["42"]["address"];
        var checkout = new this.web3.eth.Contract(
            CheckoutContract.abi,
            address
        );
        return checkout
            .getPastEvents("NewOrder", {
                filter: { buyer: buyer },
                fromBlock: 0,
                toBlock: "latest"
            })
            .then(results => {
                for (let i = 0; i < results.length; i++) {
                    var result = results[i].returnValues;
                    var order = {
                        orderID: result.orderID,
                        buyer: result.buyer,
                        merchant: result.merchant,
                        DIN: result.DIN,
                        quantity: result.quantity,
                        totalPrice: result.totalPrice,
                        priceCurrency: result.priceCurrency,
                        timestamp: result.timestamp
                    };
                    orders.unshift(order);
                }
                return orders;
            });
    }

    formattedPrice(price, priceCurrency) {
        let decimals;
        let symbol;
        switch (priceCurrency) {
            case "0x0000000000000000000000000000000000000000":
                decimals = 18;
                symbol = "ETH";
                break;
            default:
                decimals = 18;
                symbol = "MARK";
            // TODO: Add ERC20 support
        }

        let tokenPrice = parseInt(price) / Math.pow(10, decimals);
        let formattedPrice = tokenPrice.toFixed(3);
        return formattedPrice.toString() + " " + symbol;
    }

    buy(
        DIN,
        quantity,
        totalPrice,
        priceCurrency,
        priceValidUntil,
        affiliateFee,
        affiliate,
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
            affiliateFee
        ];
        const orderAddresses = [priceCurrency, affiliate];
        let value = 0;
        if (priceCurrency === "0x0000000000000000000000000000000000000000") {
            // If paying in Ether, we need to set the value
            value = totalPrice;
        }
        return this.checkout.deployed().then(instance => {
            return instance.buy(orderValues, orderAddresses, v, r, s, {
                from: account,
                value: value,
                gasPrice: this.web3.utils.toWei(20, "gwei")
            });
        });
    }

    // getOrder(orderID) {
    //     return this.checkout
    //         .getPastEvents("NewOrder", {
    //             filter: { orderId: orderID },
    //             fromBlock: 0,
    //             toBlock: "latest"
    //         })
    //         .then(events => {
    //             console.log(events);
    //         });
    // }

    // isValidSignature(signer, hash, v, r, s) {
    //     return this.checkout.methods
    //         .isValidSignature(signer, hash, v, r, s)
    //         .call();
    // }
}

module.exports = Kiosk;
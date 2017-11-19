var DINRegistryContract = require("../contracts/build/contracts/DINRegistry.json");
var ResolverContract = require("../contracts/build/contracts/StandardResolver.json");
var CheckoutContract = require("../contracts/build/contracts/Checkout.json");
var CartContract = require("../contracts/build/contracts/Cart.json");

class Kiosk {
    constructor(web3) {
        this.web3 = web3;

        var registryAddress = DINRegistryContract["networks"]["42"]["address"];
        this.registry = new this.web3.eth.Contract(
            DINRegistryContract.abi,
            registryAddress
        );

        var checkoutAddress = CheckoutContract["networks"]["42"]["address"];
        this.checkout = new this.web3.eth.Contract(
            CheckoutContract.abi,
            checkoutAddress
        );

        var cartAddress = CartContract["networks"]["42"]["address"];
        this.cart = new this.web3.eth.Contract(CartContract.abi, cartAddress);
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
        return this.checkout.methods.buy(orderValues, orderAddresses, v, r, s).send({
            from: account,
            value: value
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
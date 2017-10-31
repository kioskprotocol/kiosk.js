var contract = require("truffle-contract");
var DINRegistryContract = require("../contracts/build/contracts/DINRegistry.json");
var ResolverContract = require("../contracts/build/contracts/StandardResolver.json");
var CheckoutContract = require("../contracts/build/contracts/Checkout.json");
var CartContract = require("../contracts/build/contracts/Cart.json");
var Promise = require("bluebird");

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
        let DINs = [];

        // const asyncEvent = Promise.promisifyAll(event);
        // const logs = await asyncEvent.getAsync();

        return this.cart.deployed().then(instance => {
            const event = Promise.promisifyAll(
                instance.AddToCart(
                    { buyer: buyer },
                    { fromBlock: 0, toBlock: "latest" }
                )
            );
            return event.getAsync().then(results => {
                for (let i = 0; i < results.length; i++) {
                    const DIN = results[i]["args"]["DIN"]["c"][0];
                    DINs.push(DIN);
                }
                return DINs;
            });
        });
    }

    getOrder(orderID) {
        return this.checkout
            .getPastEvents("NewOrder", {
                filter: { orderId: orderID },
                fromBlock: 0,
                toBlock: "latest"
            })
            .then(events => {
                console.log(events);
            });
    }

    isValidSignature(signer, hash, v, r, s) {
        return this.checkout.methods
            .isValidSignature(signer, hash, v, r, s)
            .call();
    }

    // signPriceMessage(
    //     DIN,
    //     price,
    //     priceCurrency,
    //     priceValidUntil,
    //     affiliateFee,
    //     privateKey
    // ) {
    //     const hash = this.web3.utils.soliditySha3(
    //         { type: "uint256", value: DIN },
    //         { type: "uint256", value: price },
    //         { type: "address", value: priceCurrency },
    //         { type: "uint256", value: priceValidUntil },
    //         { type: "uint256", value: affiliateFee }
    //     );
    //     var prefix = "\x19Ethereum Signed Message:\n32";
    //     var messageHash = utils.soliditySha3(prefix, hash);
    //     var signature = Account.sign(messageHash, privateKey);
    //     var vrs = Account.decodeSignature(signature);
    //     var v = vrs[0];
    //     return {
    //         messageHash: messageHash,
    //         v: this.web3.utils.toDecimal(v),
    //         r: vrs[1],
    //         s: vrs[2],
    //         signature: signature
    //     };
    // }

    // signAddToCartTransaction(DIN, account, privateKey) {
    //     const inputs = [{ type: "uint256", name: "DIN" }];
    //     const args = [DIN];
    //     return this.signTransaction(
    //         "addToCart",
    //         inputs,
    //         args,
    //         this.cart._address,
    //         0,
    //         account,
    //         privateKey
    //     );
    // }

    // signBuyTransaction(
    //     DIN,
    //     quantity,
    //     totalPrice,
    //     priceCurrency,
    //     priceValidUntil,
    //     affiliateFee,
    //     affiliate,
    //     v,
    //     r,
    //     s,
    //     account,
    //     privateKey
    // ) {
    //     const inputs = [
    //         { type: "uint256[5]", name: "orderValues" },
    //         { type: "address[2]", name: "orderAddresses" },
    //         { type: "uint8", name: "v" },
    //         { type: "bytes32", name: "r" },
    //         { type: "bytes32", name: "s" }
    //     ];
    //     const orderValues = [
    //         DIN,
    //         quantity,
    //         totalPrice,
    //         priceValidUntil,
    //         affiliateFee
    //     ];
    //     const orderAddresses = [priceCurrency, affiliate];
    //     const args = [orderValues, orderAddresses, v, r, s];

    //     let value = 0;

    //     if (priceCurrency === "0x0000000000000000000000000000000000000000") {
    //         // If paying in Ether, we need to set the value
    //         value = totalPrice;
    //     }

    //     return this.signTransaction(
    //         "buy",
    //         inputs,
    //         args,
    //         this.checkout._address,
    //         value,
    //         account,
    //         privateKey
    //     );
    // }

    // signTransaction(
    //     functionName,
    //     inputs,
    //     args,
    //     contractAddr,
    //     value,
    //     account,
    //     privateKey
    // ) {
    //     const data = this.web3.eth.abi.encodeFunctionCall(
    //         {
    //             name: functionName,
    //             type: "function",
    //             inputs: inputs
    //         },
    //         args
    //     );
    //     const transaction = {
    //         from: account,
    //         to: contractAddr,
    //         data: data,
    //         value: value,
    //         gas: "200000",
    //         gasPrice: "20000000000"
    //     };
    //     return this.web3.eth.accounts
    //         .signTransaction(transaction, privateKey)
    //         .then(signedTx => {
    //             return signedTx.rawTransaction;
    //         });
    // }
}

module.exports = Kiosk;
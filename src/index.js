var Web3 = require("web3");
var contracts = new (require("./contracts.js"))();
var Account = require("eth-lib/lib/account");
var utils = require("web3-utils");

class Kiosk {
    constructor(web3) {
        if (typeof web3 === "string") {
            this.web3 = new Web3(new Web3.providers.HttpProvider(web3));
        } else {
            this.web3 = web3;
        }

        this.registry = new this.web3.eth.Contract(
            contracts.registryABI,
            contracts.registryAddressKovan
        );
        this.checkout = new this.web3.eth.Contract(
            contracts.checkoutABI,
            contracts.checkoutAddressKovan
        );
        this.cart = new this.web3.eth.Contract(
            contracts.cartABI,
            contracts.cartAddressKovan
        );
    }

    owner(DIN) {
        console.log(DIN);
        return this.registry.methods.owner(DIN).call();
    }

    resolver(DIN) {
        return this.registry.methods.resolver(DIN).call();
    }

    productURL(DIN) {
        return this.resolver(DIN).then(resolverAddr => {
            const resolver = new this.web3.eth.Contract(
                contracts.resolverABI,
                resolverAddr
            );
            return resolver.methods.productURL(DIN).call();
        });
    }

    merchant(DIN) {
        return this.resolver(DIN).then(resolverAddr => {
            const resolver = new this.web3.eth.Contract(
                contracts.resolverABI,
                resolverAddr
            );
            return resolver.methods.merchant(DIN).call();
        });
    }

    getCart(buyer) {
        return this.cart
            .getPastEvents("AddToCart", {
                filter: { buyer: buyer },
                fromBlock: 0,
                toBlock: "latest"
            })
            .then(events => {
                return events.map(event => {
                    return event.returnValues.DIN;
                });
            });
    }

    getOrder(orderID) {
        return this.checkout
        .getPastEvents("NewOrder", { 
            filter: { orderId: orderID },
            fromBlock: 0, 
            toBlock: "latest"
        }).then(events => {
            console.log(events);
        });
    }

    isValidSignature(signer, hash, v, r, s) {
        return this.checkout.methods
            .isValidSignature(signer, hash, v, r, s)
            .call();
    }

    signPriceMessage(
        DIN,
        price,
        priceCurrency,
        priceValidUntil,
        affiliateFee,
        privateKey
    ) {
        const hash = this.web3.utils.soliditySha3(
            { type: "uint256", value: DIN },
            { type: "uint256", value: price },
            { type: "address", value: priceCurrency },
            { type: "uint256", value: priceValidUntil },
            { type: "uint256", value: affiliateFee }
        );
        var prefix = "\x19Ethereum Signed Message:\n32";
        var messageHash = utils.soliditySha3(prefix, hash);
        var signature = Account.sign(messageHash, privateKey);
        var vrs = Account.decodeSignature(signature);
        var v = vrs[0];
        return {
            messageHash: messageHash,
            v: this.web3.utils.toDecimal(v),
            r: vrs[1],
            s: vrs[2],
            signature: signature
        };
    }

    signAddToCartTransaction(DIN, account, privateKey) {
        const inputs = [{ type: "uint256", name: "DIN" }];
        const args = [DIN];
        return this.signTransaction(
            "addToCart",
            inputs,
            args,
            this.cart._address,
            0,
            account,
            privateKey
        );
    }

    signBuyTransaction(
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
        account,
        privateKey
    ) {
        const inputs = [
            { type: "uint256[5]", name: "orderValues" },
            { type: "address[2]", name: "orderAddresses" },
            { type: "uint8", name: "v" },
            { type: "bytes32", name: "r" },
            { type: "bytes32", name: "s" }
        ];
        const orderValues = [
            DIN,
            quantity,
            totalPrice,
            priceValidUntil,
            affiliateFee
        ];
        const orderAddresses = [priceCurrency, affiliate];
        const args = [orderValues, orderAddresses, v, r, s];

        let value = 0;

        if (priceCurrency === "0x0000000000000000000000000000000000000000") {
            // If paying in Ether, we need to set the value
            value = totalPrice;
        }

        return this.signTransaction(
            "buy",
            inputs,
            args,
            this.checkout._address,
            value,
            account,
            privateKey
        );
    }

    signTransaction(
        functionName,
        inputs,
        args,
        contractAddr,
        value,
        account,
        privateKey
    ) {
        const data = this.web3.eth.abi.encodeFunctionCall(
            {
                name: functionName,
                type: "function",
                inputs: inputs
            },
            args
        );
        const transaction = {
            from: account,
            to: contractAddr,
            data: data,
            value: value,
            gas: "200000",
            gasPrice: "20000000000"
        };
        return this.web3.eth.accounts
            .signTransaction(transaction, privateKey)
            .then(signedTx => {
                return signedTx.rawTransaction;
            });
    }
}

module.exports = Kiosk;
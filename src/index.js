var Web3 = require("web3");
var contracts = new (require("./contracts.js"))();
var CryptoJS = require("crypto-js");

class Kiosk {
    constructor(web3) {
        this.web3 = web3;

        this.registry = new web3.eth.Contract(
            contracts.registryABI,
            contracts.registryAddressKovan
        );
        this.buy = new web3.eth.Contract(
            contracts.buyABI,
            contracts.buyAddressKovan
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
                contracts.resolverABI,
                resolverAddr
            );
            return resolver.methods.productURL(DIN).call();
        });
    }

    isValidSignature(signer, hash, v, r, s) {
        return this.buy.methods.isValidSignature(signer, hash, v, r, s).call();
    }

    signPriceMessage(DIN, price, priceValidUntil, privateKey) {
        const hash = this.web3.utils.soliditySha3(
            { type: "uint256", value: DIN },
            { type: "uint256", value: price },
            { type: "uint256", value: priceValidUntil }
        );
        const signature = this.web3.eth.accounts.signHash(hash, privateKey);
        return signature;
    }

    /**
 * Encodes function data
 * Source: https://github.com/ConsenSys/eth-lightwallet/blob/master/lib/txutils.js
 */
    encodeFunctionTxData(functionName, types, args) {
        var fullName = functionName + "(" + types.join() + ")";
        var signature = CryptoJS.SHA3(fullName, {
            outputLength: 256
        })
            .toString(CryptoJS.enc.Hex)
            .slice(0, 8);
        var dataHex = signature + this.web3.eth.abi.encodeParameters(types, args);
        return "0x" + dataHex;
    }

    signBuyTransaction(
        DIN,
        quantity,
        totalValue,
        priceValidUntil,
        v,
        r,
        s,
        account,
        privateKey
    ) {
        const types = [
            "uint256",
            "uint256",
            "uint256",
            "uint256",
            "uint8",
            "bytes32",
            "bytes32"
        ];
        const args = [DIN, quantity, totalValue, priceValidUntil, v, r, s];
        const data = this.web3.eth.abi.encodeParameters(types, args);
        console.log(data);
        const data2 = this.web3.eth.abi.encodeFunctionCall({
            name: "buy",
            type: "function",
            inputs: [
                { type: "uint256", name: "DIN" },
                { type: "uint256", name: "quantity" },
                { type: "uint256", name: "price" },
                { type: "uint256", name: "priceValidUntil" },
                { type: "uint8", name: "v" },
                { type: "bytes32", name: "r" },
                { type: "bytes32", name: "s" }
            ]
        }, args);
        console.log(data2);
        const consensys = this.encodeFunctionTxData("buy", types, args);
        console.log(consensys);
        // return this.web3.eth.getTransactionCount(account).then(nonce => {
        //     const dummyTx = {
        //         from: account,
        //         gasPrice: "20000000000",
        //         gas: "21000",
        //         to: "0x3535353535353535353535353535353535353535",
        //         value: "100000000000000",
        //         data: ""
        //     };
            const transaction = {
                // nonce: nonce,
                from: account,
                to: this.buy._address,
                data: data2,
                value: "0",
                gas: "200000",
                gasPrice: "20000000000"
            };
        //     console.log(dummyTx);
        //     console.log(transaction);
        //     // console.log(dummyTx);
            return this.web3.eth.accounts
                .signTransaction(transaction, privateKey)
                .then(signedTx => {
                    return signedTx;
                });
        // });
    }
}

module.exports = Kiosk;
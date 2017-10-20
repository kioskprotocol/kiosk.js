var Web3 = require("web3");
var contracts = new (require("./contracts.js"))();

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
        this.buy = new this.web3.eth.Contract(
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
        const data = this.web3.eth.abi.encodeFunctionCall(
            {
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
            },
            args
        );
        const transaction = {
            from: account,
            to: this.buy._address,
            data: data,
            value: "0",
            gas: "200000",
            gasPrice: "20000000000"
        };
        return this.web3.eth.accounts
            .signTransaction(transaction, privateKey)
            .then(signedTx => {
                return signedTx;
            });
    }
}

module.exports = Kiosk;
var Account = require("eth-lib/lib/account");

export default class Utils {
    constructor(web3) {
        this.web3 = web3;
    }

    sign(product, privateKey) {
        const hash = this.web3.utils.soliditySha3(
            { type: "uint256", value: product.DIN },
            { type: "uint256", value: product.price },
            { type: "uint256", value: product.priceValidUntil },
            { type: "address", value: product.merchant }
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

    hash(nonce) {
        return this.web3.utils.sha3(nonce);
    }
}
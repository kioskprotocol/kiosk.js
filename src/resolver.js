var ResolverFactoryJSON = require("../contracts/build/contracts/ResolverFactory.json");

class Resolver {
    constructor(web3, networkId, account) {
        this.account = account;
        var factoryAddress =
            ResolverFactoryJSON["networks"][networkId]["address"];
        this.factory = new web3.eth.Contract(
            ResolverFactoryJSON.abi,
            factoryAddress
        );
    }

    newResolver(baseURL) {
        return new Promise((resolve, reject) => {
            this.factory.methods
                .createResolver(baseURL)
                .send({
                    from: this.account,
                    gas: 1000000
                })
                .then(result => {
                    resolve(result);
                });
        });
    }

}

module.exports = Resolver;
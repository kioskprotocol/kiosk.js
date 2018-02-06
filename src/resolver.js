var ResolverFactoryJSON = require("../contracts/build/contracts/ResolverFactory.json");

class Resolver {
    constructor(web3, networkId, account) {
        this.web3 = web3;
        this.account = account;
        var factoryAddress =
            ResolverFactoryJSON["networks"][networkId]["address"];
        this.factory = new web3.eth.Contract(
            ResolverFactoryJSON.abi,
            factoryAddress
        );
    }

    async createResolver(baseURL) {
        const result = await this.factory.methods
            .createResolver(baseURL)
            .send({ from: this.account, gas: 1000000 });
        return result;
    }
}

module.exports = Resolver;
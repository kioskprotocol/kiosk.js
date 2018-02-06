var DINRegistryJSON = require("../contracts/build/contracts/DINRegistry.json");
var StandardResolverJSON = require("../contracts/build/contracts/StandardResolver.json");
const noAccount = "0x0000000000000000000000000000000000000000";

class Registry {
    constructor(web3, networkId, account) {
        this.web3 = web3;
        this.account = account;
        var registryAddress = DINRegistryJSON["networks"][networkId]["address"];
        this.registry = new web3.eth.Contract(
            DINRegistryJSON.abi,
            registryAddress
        );
    }

    async registerDIN() {
        const result = await this.registry.methods
            .registerDIN(this.account)
            .send({ from: this.account });
        return result;
    }

    async registerDINWithResolver(resolver) {
        const result = await this.registry.methods
            .registerDINWithResolver(this.account, resolver)
            .send({ from: this.account, gas: 1000000 });
        return result;
    }

    async setResolver(DIN, resolver) {
        const result = await this.registry.methods
            .setResolver(DIN, resolver)
            .send({ from: this.account });
        return result;
    }

    async owner(DIN) {
        const result = await this.registry.methods.owner(DIN).call();
        return result;
    }

    async resolver(DIN) {
        const result = await this.registry.methods.resolver(DIN).call();
        return result;
    }

    async productURL(DIN) {
        const resolverAddr = await this.resolver(DIN);
        console.log(resolverAddr);
        const resolverContract = await new this.web3.eth.Contract(
            StandardResolverJSON.abi,
            resolverAddr
        );
        const result = await resolverContract.methods.productURL(DIN).call();
        return result;
    }
}

module.exports = Registry;
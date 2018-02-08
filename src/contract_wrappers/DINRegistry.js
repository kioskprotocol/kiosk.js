import ContractWrapper from "./ContractWrapper";
var DINRegistryJSON = require("../../contracts/build/contracts/DINRegistry.json");
var StandardResolverJSON = require("../../contracts/build/contracts/StandardResolver.json");

export default class DINRegistry extends ContractWrapper {
    constructor(web3) {
        super(web3);
    }

    async initialize() {
        await super.initialize(DINRegistryJSON);
    }

    async registerDIN() {
        return await this.contract.methods
            .registerDIN(this.account)
            .send({ from: this.account });
    }

    async registerDINWithResolver(resolver) {
        return await this.contract.methods
            .registerDINWithResolver(this.account, resolver)
            .send({ from: this.account, gas: 1000000 });
    }

    async setResolver(DIN, resolver) {
        return await this.contract.methods
            .setResolver(DIN, resolver)
            .send({ from: this.account });
    }

    async getOwner(DIN) {
        try {
            return await this.contract.methods.owner(DIN).call();
        } catch (err) {
            return "0x0000000000000000000000000000000000000000";
        }
    }

    async getResolver(DIN) {
        try {
            return await this.contract.methods.resolver(DIN).call();
        } catch (err) {
            return "0x0000000000000000000000000000000000000000";
        }
    }

    async getProductURL(DIN) {
        const resolverAddr = await this.getResolver(DIN);
        const resolverContract = new this.web3.eth.Contract(
            StandardResolverJSON.abi,
            resolverAddr
        );
        const result = await resolverContract.methods.productURL(DIN).call();
        return result.baseURL + result.productId;
    }
}
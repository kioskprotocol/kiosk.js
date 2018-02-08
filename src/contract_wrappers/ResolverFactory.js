import ContractWrapper from "./ContractWrapper";
var ResolverFactoryJSON = require("../../contracts/build/contracts/ResolverFactory.json");

export default class ResolverFactory extends ContractWrapper {
    constructor(web3) {
        super(web3);
    }

    async initialize() {
        await super.initialize(ResolverFactoryJSON);
    }

    async createResolver(baseURL) {
        const result = await this.factory.methods
            .createResolver(baseURL)
            .send({ from: this.account, gas: 1000000 });
        return result;
    }
}
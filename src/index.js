import DINRegistry from "./contract_wrappers/DINRegistry";
import Utils from "./utils";

class Kiosk {
    constructor(web3, networkId, account) {
        this.web3 = web3;
        this.registry = new DINRegistry(web3, networkId, account);
        this.utils = new Utils(web3);
    }

    async initialize() {
        await this.registry.initialize();
    }

    async getOwner(DIN) {
        return await this.registry.getOwner(DIN);
    }

    async getResolver(DIN) {
        return await this.registry.getResolver(DIN);
    }

    async getProductURL(DIN) {
        return await this.registry.getProductURL(DIN);
    }

    async sign(product, privateKey) {
        return this.utils.sign(product, privateKey);
    }

    async buy(product) {}
}

module.exports = Kiosk;
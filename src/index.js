import DINRegistry from "./contract_wrappers/DINRegistry";
import StandardMarket from "./contract_wrappers/StandardMarket";
import Utils from "./utils";

class Kiosk {
    constructor(web3) {
        this.web3 = web3;
        this.registry = new DINRegistry(web3);
        this.market = new StandardMarket(web3);
        this.utils = new Utils(web3);
    }

    async initialize() {
        await this.registry.initialize();
        await this.market.initialize();
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

    sign(product, privateKey) {
        return this.utils.sign(product, privateKey);
    }

    async buyCartItems(cartItems) {
        return await this.market.buyCartItems(cartItems);
    }

}

module.exports = Kiosk;
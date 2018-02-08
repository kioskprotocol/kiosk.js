import Registry from "./contract_wrappers/registry";
import Resolver from "./contract_wrappers/resolver";
import Market from "./contract_wrappers/market";
import Utils from "./utils";

class Kiosk {
    constructor(web3, networkId, account) {
        this.web3 = web3;
        this.registry = new Registry(web3, networkId, account);
        this.resolver = new Resolver(web3, networkId, account);
        this.utils = new Utils(web3);
        this.market = new Market(web3, networkId, account);
    }
}

module.exports = Kiosk;
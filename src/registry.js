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

    registerDIN() {
        return new Promise((resolve, reject) => {
            this.registry.methods
                .registerDIN(this.account)
                .send({
                    from: this.account
                })
                .then(result => {
                    resolve(result);
                });
        });
    }

    registerDINWithResolver(resolver) {
        return new Promise((resolve, reject) => {
            this.registry.methods
                .registerDINWithResolver(this.account, resolver)
                .send({
                    from: this.account,
                    gas: 1000000
                })
                .then(result => {
                    resolve(result);
                });
        });
    }

    setResolver(DIN, resolver) {
        return new Promise((resolve, reject) => {
            this.registry.methods
                .setResolver(DIN, resolver)
                .send({ from: this.account })
                .then(result => {
                    resolve(result);
                });
        });
    }

    owner(DIN) {
        return new Promise((resolve, reject) => {
            this.registry.methods
                .owner(DIN)
                .call()
                .then(result => {
                    resolve(result);
                })
                .catch(err => {
                    resolve(noAccount);
                });
        });
    }

    resolver(DIN) {
        return new Promise((resolve, reject) => {
            this.registry.methods
                .resolver(DIN)
                .call()
                .then(result => {
                    resolve(result);
                })
                .catch(err => {
                    resolve(noAccount);
                });
        });
    }

    url(DIN) {
        return new Promise((resolve, reject) => {
            this.resolver(DIN).then(resolverAddr => {
                var resolverContract = new this.web3.eth.Contract(
                    StandardResolverJSON.abi,
                    resolverAddr
                );
                resolverContract.methods
                    .productURL(DIN)
                    .call()
                    .then(result => {
                        resolve(result);
                    });
            });
        });
    }
}

module.exports = Registry;
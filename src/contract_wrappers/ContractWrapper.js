export default class ContractWrapper {
    constructor(web3) {
        this.web3 = web3;
    }

    async initialize(artifacts) {
        const accounts = await this.web3.eth.getAccounts();
        this.account = accounts[0];
        const networkId = await this.web3.eth.net.getId();
        if (artifacts["networks"][networkId] !== undefined) {
            var contractAddress = artifacts["networks"][networkId]["address"];
            this.contract = new this.web3.eth.Contract(
                artifacts.abi,
                contractAddress
            );
        }
    }
}
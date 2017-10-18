var ABI = require("ethereumjs-abi");
var util = require("ethereumjs-util");

/**
  * ========================================
  *               INSTRUCTIONS
  * ========================================
  *
  * 1. testrpc --account="0x<private key>,<balance>"
  * 2. truffle exec "./sign.js" <DIN> <price> <priceValidUntil>
  *
  */

module.exports = async callback => {
    const account = web3.eth.accounts[0];

    const DIN = process.argv[4];
    const price = process.argv[5];
    const priceValidUntil = process.argv[6];

    const args = [DIN, price, priceValidUntil];
    const argTypes = ["uint256", "uint256", "uint256"];
    const msg = ABI.soliditySHA3(argTypes, args);
    const result = await web3.eth.sign(account, util.bufferToHex(msg));
    let signature = util.fromRpcSig(result);

    const { v, r, s } = signature;
    signature.r = util.bufferToHex(r);
    signature.s = util.bufferToHex(s);

    console.log(signature);

    callback();
}


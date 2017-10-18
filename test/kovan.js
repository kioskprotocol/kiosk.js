const DINRegistrar = artifacts.require("DINRegistrar.sol");
const DINRegistry = artifacts.require("DINRegistry.sol");
const Buy = artifacts.require("Buy.sol");
const MarketToken = artifacts.require("marketToken.sol");
const TestResolver = artifacts.require("TestResolver.sol");

var Kiosk = require("../index.js");
var util = require("ethereumjs-util");
var ABI = require("ethereumjs-abi");
var assert = require("assert");
var BN = require("bn.js");
var Promise = require("bluebird");
var chai = require("chai"),
    expect = chai.expect,
    should = chai.should();
require("dotenv").config();

contract("kovan", accounts => {
    let kiosk;

    // Product
    const DIN = 1000000001;

    before(async () => {
        web3.setProvider(new web3.providers.HttpProvider(process.env.INFURA_KOVAN));

        kiosk = new Kiosk(web3);
    });

    it("should return the correct owner of a DIN", async () => {
        const owner = await kiosk.owner(DIN);
        console.log(owner);
        // expect(owner).to.equal(alice);
    });

    it("should return the correct resolver of a DIN", async () => {
        const resolver = await kiosk.resolver(DIN);
        console.log(resolver);
        // expect(resolverAddr).to.equal(resolver.address);
    });

    it("should get the product URL for a given DIN", async () => {
        const url = await kiosk.productURL(DIN);
        console.log(url);
        // expect(url).to.equal("https://www.google.com/");
    });

    it("should validate a signature", async () => {
        const signer = "0xabad46016a62b94c98febe31176835df3d0ac83c";
        const DIN = 1000000001;
        const price = 8000000;
        const priceValidUntil = 1514160000;
        const msg = ABI.soliditySHA3(DIN, price, priceValidUntil);
        const hash = util.bufferToHex(msg);
        const signature = {
            v: 27,
            r: "0x003be33a198f20a5c5efbe94e3908684d4c1d40d3661687bd96ac176857bfbac",
            s: "0x117ecb27373e797743837b38d58cbc1ef1c19312c88ad3e6f12b96f90361ba77" 
        }
        const valid = await kiosk.isValidSignature(signer, hash, signature.v, signature.r, signature.s);
        console.log(valid);
    });

});
var Web3 = require("web3");
var Kiosk = require("../dist/index.js");
var assert = require("assert");
var chai = require("chai"),
    expect = chai.expect,
    should = chai.should();
require("dotenv").config();

describe("kovan", () => {

    let web3;
    let kiosk;
    
    before(async () => {
        web3 = new Web3(
            new Web3.providers.HttpProvider("http://localhost:8545/")
            // new Web3.providers.HttpProvider(process.env.INFURA_KOVAN)
        );
        kiosk = new Kiosk(web3, "42");
        console.log(kiosk);
    });

    it("should get order events", async () => {
        const order = await kiosk.getOrder(1);
        console.log(order);
    });

    it("should have the correct order index", async () => {
        const index = await kiosk.getOrderIndex();
        console.log(index);
    })

});
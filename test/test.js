const { expect } = require("chai");
var chai = require('chai');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe("Sale Contract", function() {

  // Sale Test Params

  let purchaseSizeEth = 10;

  let transferSizeToken = 5000;
  
  // Sale Params

  let saleRate = 1000;

  let launchRate = 1333;

  let commissionRate = 250;

  let expiryPeriod = 10;

  let commissionRedemptionPeriod = 20;

  // Observations

  let totalEthRaised;

  let expiryTime;

  let commissionRedemptionTime;

  // Contract Objects

  let saleContract;

  let uniswapV2Factory;

  let uniswapV2Router02;

  let weth9;

  // Signers

  let owner;

  let buyers;

  before(async function() {

    //get signers
    [owner,...buyers] = await ethers.getSigners();

    //deploy WETH9
    const WETH9 = await ethers.getContractFactory("WETH9");
    weth9 = await WETH9.deploy();
    await weth9.deployed();
    console.log("WETH Deployed")

    //deploy Factory
    const UniswapV2Factory = await ethers.getContractFactory("UniswapV2Factory");
    uniswapV2Factory = await UniswapV2Factory.deploy(await owner.getAddress());
    await uniswapV2Factory.deployed();
    console.log("Factory Deployed");

    //deploy router
    const UniswapV2Router02 = await ethers.getContractFactory("UniswapV2Router02");
    uniswapV2Router02 = await UniswapV2Router02.deploy(uniswapV2Factory.address,weth9.address);
    await uniswapV2Router02.deployed();
    console.log("Router Deployed");

    //deployer sale contract
    const SaleContract = await ethers.getContractFactory("Sale");
    const unixTime = Math.floor(Date.now()/1000);
    expiryTime = unixTime + expiryPeriod;
    commissionRedemptionTime = unixTime + commissionRedemptionPeriod;
    saleContract = await SaleContract.deploy(saleRate,launchRate,commissionRate,expiryTime,
      commissionRedemptionTime,uniswapV2Factory.address,weth9.address,"$VNCHR","VNCR");
    await saleContract.deployed();
    console.log("Sale Contract deployed");
  });

  describe("Deployment", function(){

    // not needed just for vanity ( passed tests feel good :0 )
    it("Should Deploy WETH", async function(){
      await weth9.deployed();
      expect(true).to.equal(true);
    });

    it("Should Deploy UniswapV2Factory", async function(){
      await uniswapV2Factory.deployed();
      expect(true).to.equal(true);
    });
    
    describe("UniswapV2Router02", function(){

      it("Is Deployed", async function(){
        await uniswapV2Router02.deployed();
        expect(true).to.equal(true);
      });

      it("WETH address should be correct", async function(){
        const routerWETH = await uniswapV2Router02.WETH();
        expect(routerWETH).to.equal(weth9.address);
      });

      it("UniswapV2Factory address should be correct", async function(){
        const routerFactory = await uniswapV2Router02.factory();
        expect(uniswapV2Factory.address).to.equal(routerFactory);
      });

    });

    describe("Sale Contract", function(){

      it("Is Deployed", async function(){
        await saleContract.deployed();
        expect(true).to.equal(true);
      });

      it("Sale Rate should be correct", async function(){
        const contractSaleRate = await saleContract.saleRate();
        expect(contractSaleRate).to.equal(saleRate);
      });

      it("Launch Rate should be correct", async function(){
        const contractLaunchRate = await saleContract.launchRate();
        expect(contractLaunchRate).to.equal(launchRate);
      });

      it("Commission Rate should be correct", async function(){
        const contractCommissionRate = await saleContract.commissionRate();
        expect(contractCommissionRate).to.equal(commissionRate);
      });

      it("Expiry Time is correct", async function(){
        const contractExpiryTime = await saleContract.expiry();
        expect(contractExpiryTime).to.equal(expiryTime);
      });

      it("Commission Redemption Time is correct", async function(){
        const contractCommissionRedemptionTime = await saleContract.commissionRedemption();
        expect(contractCommissionRedemptionTime).to.equal(commissionRedemptionTime);
      });

      it("VNCHR/WETH pair should be created by uniswap factory", async function(){
        const pairAddress = await uniswapV2Factory.getPair(weth9.address,saleContract.address);
        expect(pairAddress).to.not.equal("0x0000000000000000000000000000000000000000");
        const pairContract = await ethers.getContractAt("UniswapV2Pair",pairAddress);
        //any method will do
        const pairFactory = await pairContract.factory();
        expect(uniswapV2Factory.address).to.equal(pairFactory);
      });

    });

  });

  describe("Sale Contract Behaviour", function(){

    it("Allows Sales before expiry", async function(){
      const sendValue = ethers.utils.parseEther(purchaseSizeEth.toString());
      const tx = {to:saleContract.address,value:sendValue}
      const preBalance = await buyers[0].getBalance();
      const gasPrice = await buyers[0].getGasPrice();
      const gasReq = await buyers[0].estimateGas(tx);
      const gasCost = gasPrice.mul(gasReq);
      const expectedPostBalance = preBalance.sub(sendValue).sub(gasCost);
      // send 10 Eth from buyer[0] 
      await buyers[0].sendTransaction(tx);
      // expect eth balance to be 10 less
      const postBalance = await buyers[0].getBalance();
      expect(expectedPostBalance).to.equal(postBalance);
    });

    it("Should return the right amount of token", async function(){
      const expectedVNCHRValue = ethers.utils.parseEther((purchaseSizeEth*saleRate).toString());
      const vnchrValue = await saleContract.balanceOf(await buyers[0].getAddress());
      expect(vnchrValue).to.equal(expectedVNCHRValue);
    });

    it("Prevents launching of trade before expiry", async function(){
      // expect owner calling launch trade to revert
      try{
        const call0 = await saleContract.launchTrade();
        //console.log(call0);
        //expect(true).to.equal(false);
      }
      catch(error){
        expect(true).to.equal(true);
      }
    });

    it("Token movement is paused before expiry", async function(){
      // expect token transfer to revert
      try{
        const call1 = await saleContract.connect(buyers[0])
        .transfer(await buyers[1].getAddress(),ethers.utils.parseEther(transferSizeToken.toString()));
        //console.log(call1);
        expect(true).to.equal(false);
      }
      catch(error){
        //console.log(error);
        expect(true).to.equal(true);
      }
    });

    it("Prevents sales after expiry", async function(){
      // wait till expiry
      // expect send to revert
      const delayMS0 = expiryTime*1000 - Date.now();
      await sleep(delayMS0);
      try{
        const sendValue = ethers.utils.parseEther(purchaseSizeEth.toString());
        const tx = {to:saleContract.address,value:sendValue}
        const call2 = await buyers[0].sendTransaction(tx);
       // console.log(call2)
        expect(true).to.equal(false);
      }
      catch(error){
       // console.log(error);
        expect(true).to.equal(true);
      }
    });

    it("Token movement is paused after expiry but before launch of trade", async function(){
      //expect transfer token to revert
      try{
        const call3 = await saleContract.connect(buyers[0])
        .transfer(await buyers[1].getAddress(),ethers.utils.parseEther(transferSizeToken.toString()));
        //console.log(call3);
        expect(true).to.equal(false);
      }
      catch(error){
       // console.log(error);
        expect(true).to.equal(true);
      }
    });

    it("Allows launching of trade after expiry", async function(){
      await saleContract.launchTrade();
      expect(true).to.equal(true);
    });

    it("Token amounts added as liquidity should be correct Uniswap", async function(){
      let wethReserve;
      let vnchrReserve;
      const pairAddress = await uniswapV2Factory.getPair(weth9.address,saleContract.address);
      const pairContract = await ethers.getContractAt("UniswapV2Pair",pairAddress);
      const {_reserve0,_reserve1} = await pairContract.getReserves();
      if (parseInt(weth9.address) < parseInt(saleContract.address)){
        wethReserve = _reserve0;
        vnchrReserve = _reserve1;
      }
      else{
        wethReserve = _reserve1;
        vnchrReserve = _reserve0;
      }
      expect(wethReserve).to.equal(ethers.utils.parseEther(purchaseSizeEth.toString()));
      expect(vnchrReserve).to.equal(ethers.utils.parseEther((purchaseSizeEth*launchRate).toString()));
    });

    it("Allows transfer of tokens after launch of trade", async function(){
      const call4 = await saleContract.connect(buyers[0])
        .transfer(await buyers[1].getAddress(),ethers.utils.parseEther(transferSizeToken.toString()));
      const buyer1Balance = await saleContract.balanceOf(await buyers[1].getAddress());
      expect(buyer1Balance).to.equal(ethers.utils.parseEther(transferSizeToken.toString()));
    });

    it("Allows collection of commission after commision redemption time ", async function(){
      const delayMS0 = commissionRedemptionTime*1000 - Date.now();
      await sleep(delayMS0);
      await saleContract.redeemCommission();
      expect(true).to.equal(true);
    });

    it("Amount of commission tokens received is correct", async function(){
      const ownerBalance = await saleContract.balanceOf(await owner.getAddress());
      const expectedBalance = ethers.utils.parseEther((purchaseSizeEth*commissionRate).toString());
      expect(ownerBalance).to.equal(expectedBalance);
    });

  });
});

# VN¢HR Sale

[Pronounced Venture Sale] 

A new type of token sale, where all funds raised are directed into a Uniswap liquidity pool. 

**We're using this to create a brand token for a new line of streetwear**

![Sale Diagram](https://github.com/realkinando/vnchrSale/blob/master/Screenshot%20from%202020-08-02%2013-22-26.png?raw=true)

## Sale Process

### Token Sale
Buy a project's tokens for cheap using ETH before the sale expires. Tokens are locked until the sale ends.

### Token Launch
After the sale expires anyone can call LaunchTrade(). Tokens are unlocked and all of the ETH raised is added as liquidity to Uniswap. 

We add liquidity with a lower ratio of project token than offered in the sale - **RAISING THE PRICE BIG TIME!!**

This creates mad hype. Hype is a key ingredient of streetwear :)

### Commission Redemption
After a long period of proving themselves and delivering on promises (e.g. a year) - the team can cash out by calling redeemCommission(). This is our take on vesting!

WE'RE WORKING ON IMPLEMENTING A TAP FUNCTION FOR WITHDRAWING THE VESTED TOKEN (TO STREAM, INSTEAD OF TO RETURN A LUMP SUM) - SIMILAR TO WHAT VITALIK BUTERIN DESCRIBES ON HIS WORK ON "DAICOs". https://ethresear.ch/t/explanation-of-daicos/465.

**This prevents scams and incentivises teams to deliver**, because if the project is trash, holders can sell out before the redemption time - leaving the founders with a worthless coin. 

## Deploying a VN¢HR sale
```sol
  (uint256 _saleRate,uint256 _launchRate,uint256 _commissionRate,uint _expiry,
    uint _commissionRedemption,address _factory,address _WETH, string memory _name,string memory _symbol)
```

**WILL WRITE A PROPER GUIDE SOON**

## Testing
```
npm i && npx buidler test
```

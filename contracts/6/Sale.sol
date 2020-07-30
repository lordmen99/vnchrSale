//SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.6.6;

//IMPORT OPENZEPELLIN LIBS
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts//utils/Pausable.sol";
//IMPORT TOKENRECOVER
import "eth-token-recover/contracts/TokenRecover.sol";
//IMPORT UNISWAP ROUTER
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
//IMPORT SAFEMATH
import "@openzeppelin/contracts/math/SafeMath.sol";

contract Sale is ERC20,Pausable,TokenRecover {

    using SafeMath for uint256;
    uint256 public saleRate;
    uint256 public launchRate;
    uint256 public commissionRate;
    uint public expiry;
    uint public commissionRedemption;
    uint256 public commission;
    address public WETH;
    IUniswapV2Router02 router;

    constructor (uint256 _saleRate,uint256 _launchRate,uint256 _commissionRate,uint _expiry,
    uint _commissionRedemption,address _WETH,address _router,string memory _name,string memory _symbol)
    ERC20(_name,_symbol) public {
        saleRate = _saleRate;
        launchRate = _launchRate;
        commissionRate = _commissionRate;
        expiry = _expiry;
        commissionRedemption = _commissionRedemption;
        commission = 0;
        WETH = _WETH;
        router = IUniswapV2Router02(_router);
        _pause();
    }

    receive() external payable{
        require(block.timestamp<expiry,"ERROR: TOO LATE... Sale Ended");
        _mint(msg.sender,saleRate.mul(msg.value));
    }

    function launchTrade() public{
        require(block.timestamp>expiry,"ERROR: TOO EARLY... Expiry time yet to be reached");
        commission = commissionRate.mul(address(this).balance);
        uint totalToken = uint(launchRate.mul(address(this).balance));
        _mint(address(this),totalToken);
        uint deadline = block.timestamp+1000;
        _unpause();
        router.addLiquidity(address(this),WETH,totalToken,address(this).balance,totalToken,address(this).balance,address(0),deadline);
    }

    function redeemCommission() public onlyOwner{
        require(block.timestamp>commissionRedemption,"ERROR: TOO EARLY... Commission Redemption time yet to be reached");
        uint256 mintAmount = commission;
        commission = 0;
        _mint(msg.sender,mintAmount);
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual override{
        super._beforeTokenTransfer(from,to,amount);
        if (from == address(0)){
            return;
        }
        else{
            require(!paused(), "ERC20Pausable: token transfer while paused");
        }
    }
}
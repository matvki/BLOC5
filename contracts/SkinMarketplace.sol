// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SkinMarketplace is ERC721URIStorage, Ownable(msg.sender) {
    uint256 private _tokenIdCounter;  
    

    IERC20 public gameToken;
    uint256 public cooldownPeriod = 5 minutes;
    uint256 public lockPeriod = 10 minutes;
    uint256 public maxSkinsPerUser = 4;
    
    mapping(address => uint256) public lastTransaction;
    mapping(address => uint256) public lockedUntil;
    mapping(uint256 => uint256) public skinPrices;
    mapping(uint256 => string) public skinCategories;
    mapping(uint256 => string) public ipfsHashes;
    mapping(address => uint256[]) private userSkins;

    event SkinBought(address indexed buyer, uint256 indexed tokenId, uint256 price);
    event SkinListed(address indexed seller, uint256 indexed tokenId, uint256 price);
    event SkinExchanged(address indexed from, address indexed to, uint256 indexed tokenId);

    constructor(address _gameToken) ERC721("SkinMarketplace", "SKIN") {
        require(_gameToken != address(0), "Invalid token address");
        gameToken = IERC20(_gameToken);
        transferOwnership(msg.sender);
    }

    function mintSkin(
        address to, 
        string memory tokenURI, 
        uint256 price, 
        string memory category, 
        string memory ipfsHash
    ) external onlyOwner {
        require(userSkins[to].length < maxSkinsPerUser, "User already owns maximum skins");
        
        uint256 tokenId = _tokenIdCounter;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        
        skinPrices[tokenId] = price;
        skinCategories[tokenId] = category;
        ipfsHashes[tokenId] = ipfsHash;
        
        userSkins[to].push(tokenId);
        _tokenIdCounter++;

        emit SkinListed(to, tokenId, price);
    }

    function buySkin(uint256 tokenId) external {
        require(lastTransaction[msg.sender] + cooldownPeriod <= block.timestamp, "Cooldown period active");
        require(lockedUntil[msg.sender] <= block.timestamp, "User is locked");
        require(userSkins[msg.sender].length < maxSkinsPerUser, "Max skins owned");

        address seller = ownerOf(tokenId);
        require(seller != msg.sender, "Cannot buy your own skin");

        uint256 price = skinPrices[tokenId];
        require(gameToken.transferFrom(msg.sender, seller, price), "Token transfer failed");

        _transfer(seller, msg.sender, tokenId);
        _removeSkinFromUser(seller, tokenId);
        userSkins[msg.sender].push(tokenId);

        lastTransaction[msg.sender] = block.timestamp;
        lockedUntil[msg.sender] = block.timestamp + lockPeriod;

        emit SkinBought(msg.sender, tokenId, price);
    }

    function exchangeSkin(uint256 tokenId, address to) external {
        require(ownerOf(tokenId) == msg.sender, "Not the skin owner");
        require(userSkins[to].length < maxSkinsPerUser, "Recipient cannot hold more skins");

        _transfer(msg.sender, to, tokenId);
        _removeSkinFromUser(msg.sender, tokenId);
        userSkins[to].push(tokenId);

        emit SkinExchanged(msg.sender, to, tokenId);
    }

    function _removeSkinFromUser(address user, uint256 tokenId) private {
        uint256[] storage skins = userSkins[user];
        for (uint256 i = 0; i < skins.length; i++) {
            if (skins[i] == tokenId) {
                skins[i] = skins[skins.length - 1];
                skins.pop();
                break;
            }
        }
    }
}

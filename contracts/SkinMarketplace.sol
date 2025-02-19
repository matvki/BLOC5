// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SkinMarketplace is ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;  // Remplacé Counters.Counter par uint256

    IERC20 public gameToken;
    uint256 public cooldownPeriod = 5 minutes;
    uint256 public lockPeriod = 10 minutes;
    uint256 public maxSkinsPerUser = 4;
    
    mapping(address => uint256) public lastTransaction;
    mapping(address => uint256) public lockedUntil;
    mapping(uint256 => uint256) public skinPrices;
    mapping(uint256 => string) public skinCategories;
    mapping(uint256 => string) public ipfsHashes;
    mapping(address => uint256[]) public userSkins;

    event SkinBought(address buyer, uint256 tokenId, uint256 price);
    event SkinListed(address seller, uint256 tokenId, uint256 price);
    event SkinExchanged(address from, address to, uint256 tokenId);

    constructor(address _gameToken) ERC721("SkinMarketplace", "SKIN") {
        gameToken = IERC20(_gameToken);
        transferOwnership(msg.sender);  // Ajout du transfert de la propriété au déployeur
    }

    function _mintSkin(address to, string memory tokenURI, uint256 price, string memory category, string memory ipfsHash) public onlyOwner {
        require(userSkins[to].length < maxSkinsPerUser, "User already owns maximum number of skins");
        
        uint256 tokenId = _tokenIdCounter;  // Utilisation de _tokenIdCounter directement
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        skinPrices[tokenId] = price;
        skinCategories[tokenId] = category;
        ipfsHashes[tokenId] = ipfsHash;
        
        _tokenIdCounter += 1;  // Incrémentation manuelle de _tokenIdCounter
        userSkins[to].push(tokenId);
        emit SkinListed(to, tokenId, price);
    }

    function buySkin(uint256 tokenId) public {
        require(lastTransaction[msg.sender] + cooldownPeriod <= block.timestamp, "Cooldown period not over.");
        require(lockedUntil[msg.sender] <= block.timestamp, "User is locked.");
        require(userSkins[msg.sender].length < maxSkinsPerUser, "Cannot own more than allowed skins");

        address owner = ownerOf(tokenId);
        uint256 price = skinPrices[tokenId];

        require(gameToken.transferFrom(msg.sender, owner, price), "Token transfer failed");
        _safeTransfer(owner, msg.sender, tokenId, "");

        lastTransaction[msg.sender] = block.timestamp;
        lockedUntil[msg.sender] = block.timestamp + lockPeriod;

        userSkins[msg.sender].push(tokenId);
        
        emit SkinBought(msg.sender, tokenId, price);
    }

    function exchangeSkin(uint256 tokenId, address to) public {
        require(ownerOf(tokenId) == msg.sender, "You do not own this skin");
        require(userSkins[to].length < maxSkinsPerUser, "Recipient cannot hold more skins");
        
        _safeTransfer(msg.sender, to, tokenId, "");
        
        for (uint256 i = 0; i < userSkins[msg.sender].length; i++) {
            if (userSkins[msg.sender][i] == tokenId) {
                userSkins[msg.sender][i] = userSkins[msg.sender][userSkins[msg.sender].length - 1];
                userSkins[msg.sender].pop();
                break;
            }
        }
        
        userSkins[to].push(tokenId);
        emit SkinExchanged(msg.sender, to, tokenId);
    }
}

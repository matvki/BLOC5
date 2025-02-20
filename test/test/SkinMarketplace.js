const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SkinMarketplace", function () {
  let SkinMarketplace;
  let skinMarketplace;
  let GameToken;
  let gameToken;
  let owner;
  let addr1;

  beforeEach(async () => {
    [owner, addr1] = await ethers.getSigners();

    // Déploiement d'un token ERC-20 factice
    GameToken = await ethers.getContractFactory("GameToken");
    gameToken = await GameToken.deploy();
    await gameToken.deployed();

    // Déploiement du marketplace avec l'adresse du token ERC-20
    SkinMarketplace = await ethers.getContractFactory("SkinMarketplace");
    skinMarketplace = await SkinMarketplace.deploy(gameToken.address);
    await skinMarketplace.deployed();
  });

  it("Devrait permettre au propriétaire de lister un skin", async function () {
    const tokenURI = "https://ipfs.io/ipfs/EXAMPLE_HASH";
    const price = ethers.parseEther("0.1");

    await skinMarketplace._mintSkin(owner.address, tokenURI, price, "Rare", "EXAMPLE_HASH");

    const listedPrice = await skinMarketplace.skinPrices(0);
    expect(listedPrice).to.equal(price);
  });

  it("Devrait permettre d'acheter un skin", async function () {
    const tokenURI = "https://ipfs.io/ipfs/EXAMPLE_HASH";
    const price = ethers.parseEther("0.1");

    await skinMarketplace._mintSkin(owner.address, tokenURI, price, "Rare", "EXAMPLE_HASH");

    // Addr1 approuve le transfert de tokens
    await gameToken.mint(addr1.address, price);
    await gameToken.connect(addr1).approve(skinMarketplace.address, price);

    await skinMarketplace.connect(addr1).buySkin(0);

    const ownerOfSkin = await skinMarketplace.ownerOf(0);
    expect(ownerOfSkin).to.equal(addr1.address);
  });
});

// Contrat ERC-20 factice pour simuler la monnaie du jeu
describe("GameToken", function () {
  let GameToken;
  let gameToken;
  let owner;
  let addr1;

  beforeEach(async () => {
    [owner, addr1] = await ethers.getSigners();
    GameToken = await ethers.getContractFactory("GameToken");
    gameToken = await GameToken.deploy();
    await gameToken.deployed();
  });

  it("Devrait permettre de minter des tokens", async function () {
    const amount = ethers.parseEther("10");
    await gameToken.mint(addr1.address, amount);

    const balance = await gameToken.balanceOf(addr1.address);
    expect(balance).to.equal(amount);
  });
});

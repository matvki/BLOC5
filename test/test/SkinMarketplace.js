const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SkinMarketplace", function () {
  let SkinMarketplace;
  let skinMarketplace;
  let owner;
  let addr1;

  beforeEach(async () => {
    SkinMarketplace = await ethers.getContractFactory("SkinMarketplace");
    [owner, addr1] = await ethers.getSigners();

    skinMarketplace = await SkinMarketplace.deploy();
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

    await skinMarketplace.connect(addr1).buySkin(0, { value: price });

    const ownerOfSkin = await skinMarketplace.ownerOf(0);
    expect(ownerOfSkin).to.equal(addr1.address);
  });
});

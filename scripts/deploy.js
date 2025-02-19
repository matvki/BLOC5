const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);

    // Déployer le token ERC-20
    const GameToken = await hre.ethers.getContractFactory("GameToken");
    const gameToken = await GameToken.deploy();
    await gameToken.deployed();

    console.log("GameToken deployed to:", gameToken.address);

    // Déployer le contrat SkinMarketplace avec gameToken.address et deployer.address (comme propriétaire)
    const SkinMarketplace = await hre.ethers.getContractFactory("SkinMarketplace");
    const skinMarketplace = await SkinMarketplace.deploy(gameToken.address, deployer.address); // Passer l'adresse du propriétaire
    await skinMarketplace.deployed();

    console.log("SkinMarketplace deployed to:", skinMarketplace.address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

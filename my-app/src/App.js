import React, { useEffect, useState } from "react";
import { JsonRpcProvider, Contract, formatEther } from "ethers";

import "./App.css";

// Exemple de skins disponibles
const mockSkins = [
    { id: 1, name: "Skin Guerrier", price: 100, category: "Epic" },
    { id: 2, name: "Skin Mage", price: 150, category: "Legendary" },
    { id: 3, name: "Skin Assassin", price: 200, category: "Mythic" },
    { id: 4, name: "Skin Archer", price: 120, category: "Rare" },
];

const App = () => {
    const [ownedSkins, setOwnedSkins] = useState([]);
    const [balance, setBalance] = useState(500); // Solde en tokens local
    const [contract, setContract] = useState(null); // Smart contract
    const [account, setAccount] = useState(null); // Compte connecté
    const [provider, setProvider] = useState(null); // Fournisseur Ethereum local

    useEffect(() => {
        const connectToContract = async () => {
            try {
                // Connexion à Hardhat (local)
                const localProvider = new JsonRpcProvider("http://localhost:8545");
                setProvider(localProvider);

                // Récupérer l'adresse du premier compte disponible
                const accounts = await localProvider.send("eth_accounts", []);
                if (accounts.length === 0) {
                    console.error("Aucun compte disponible.");
                    return;
                }
                setAccount(accounts[0]);

                // Adresse et ABI du contrat
                const contractAddress = "0x..."; // Remplace par l'adresse du contrat déployé
                const contractABI = [
                    "function buySkin(uint256 skinId) public",
                    "function balanceOf(address owner) view returns (uint256)",
                ];

                // Création de l'instance du contrat
                const contractInstance = new Contract(contractAddress, contractABI, localProvider);
                setContract(contractInstance);

                // Récupérer le solde initial en tokens
                const initialBalance = await contractInstance.balanceOf(accounts[0]);
                setBalance(formatEther(initialBalance)); // Convertir en ethers
            } catch (error) {
                console.error("Erreur lors de la connexion au contrat :", error);
            }
        };

        connectToContract();
    }, []);

    const buySkin = async (skin) => {
        if (!contract || !account || !provider) return;
        
        if (balance >= skin.price) {
            try {
                // Obtenir le signer pour envoyer une transaction
                const signer = await provider.getSigner();
                const contractWithSigner = contract.connect(signer);

                // Exécution de la transaction
                const tx = await contractWithSigner.buySkin(skin.id);
                await tx.wait(); // Attendre la confirmation

                // Mise à jour de l'état local
                setOwnedSkins([...ownedSkins, skin]);
                setBalance(balance - skin.price);
                alert("Skin acheté avec succès!");
            } catch (error) {
                alert("Erreur lors de l'achat du skin");
                console.error(error);
            }
        } else {
            alert("Fonds insuffisants");
        }
    };

    return (
        <div className="app-container">
            <h1>Marketplace de Skins</h1>
            <p>Balance: {balance} Tokens</p>
            
            <h2>Skins disponibles</h2>
            <div className="skins-container">
                {mockSkins.map((skin) => (
                    <div key={skin.id} className="skin-card">
                        <h3>{skin.name}</h3>
                        <p>Catégorie: {skin.category}</p>
                        <p>Prix: {skin.price} Tokens</p>
                        <button onClick={() => buySkin(skin)}>Acheter</button>
                    </div>
                ))}
            </div>

            <h2>Vos skins</h2>
            <div className="skins-container">
                {ownedSkins.length > 0 ? (
                    ownedSkins.map((skin) => (
                        <div key={skin.id} className="skin-card owned">
                            <h3>{skin.name}</h3>
                            <p>Catégorie: {skin.category}</p>
                        </div>
                    ))
                ) : (
                    <p>Vous ne possédez aucun skin.</p>
                )}
            </div>
        </div>
    );
};

export default App;

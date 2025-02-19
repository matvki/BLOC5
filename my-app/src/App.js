import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
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
            // Connexion à Hardhat (local)
            const localProvider = new ethers.JsonRpcProvider("http://localhost:8545"); // Assure-toi que le nœud Hardhat est lancé
            setProvider(localProvider);

            // Récupérer l'adresse du compte
            const [userAccount] = await localProvider.listAccounts();
            setAccount(userAccount);

            // ABI et adresse du smart contract déployé
            const contractAddress = "0x..."; // Remplace par l'adresse du contrat déployé
            const contractABI = [
                // Exemple de ABI d'un contrat ERC-20
                "function buySkin(uint256 skinId) public",
                "function balanceOf(address owner) view returns (uint256)",
            ];

            // Créer une instance du contrat
            const contractInstance = new ethers.Contract(contractAddress, contractABI, localProvider);
            setContract(contractInstance);

            // Récupérer le solde initial en tokens (optionnel)
            const initialBalance = await contractInstance.balanceOf(userAccount);
            setBalance(ethers.utils.formatEther(initialBalance)); // Convertir en ethers
        };

        connectToContract();
    }, []);

    const buySkin = async (skin) => {
        if (!contract || !account) return;
        
        if (balance >= skin.price) {
            try {
                // Acheter un skin (exécution d'une transaction)
                const tx = await contract.buySkin(skin.id, { from: account });
                await tx.wait(); // Attendre que la transaction soit confirmée

                // Mettre à jour l'état (ici, on ajoute le skin acheté)
                setOwnedSkins([...ownedSkins, skin]);
                setBalance(balance - skin.price); // Déduire le prix du skin du solde

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

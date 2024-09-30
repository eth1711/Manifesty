import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import SecretMessagesABI from './SecretMessagesABI.json'; // Import ABI
// import { JsonRpcProvider } from 'ethers';
import { Alchemy, Network } from "alchemy-sdk";
import BN from 'bn.js';

// Connect to the Scroll Sepolia network
// const provider = new JsonRpcProvider("https://scroll-sepolia.g.alchemy.com/v2/2T8Htx5cla3sOOMs1lp2Du3fzm7w3Sh_");

const settings = {
  apiKey: "2T8Htx5cla3sOOMs1lp2Du3fzm7w3Sh_",
  network: Network.SCROLL_SEPOLIA,
};

const alchemy = new Alchemy(settings);

function App() {
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [gasFee, setGasFee] = useState('');

  useEffect(() => {
    const loadBlockchainData = async () => {
      if (window.ethereum) {
        const web3 = new Web3(window.ethereum);
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const accounts = await web3.eth.getAccounts();
        setAccount(accounts[0]);

        const contractAddress = '0x81312f88cbdb60b9ce5a118e917282d39ac24d65';
        const contract = new web3.eth.Contract(SecretMessagesABI, contractAddress);
        setContract(contract);

        // Fetch stored messages on load
        const storedMessages = await contract.methods.getMessages().call();
        setMessages(storedMessages);
      } else {
        console.error("Please install MetaMask!");
      }
    };

    loadBlockchainData();
  }, []);

  const estimateGasFee = async () => {
    if (contract && message) {
      try {
        const estimatedGas = await contract.methods.sendMessage(message).estimateGas({ from: account });
  
        // Fetch the current fee data from Alchemy (supports EIP-1559)
        const feeData = await alchemy.core.getFeeData(); // This returns baseFeePerGas, maxFeePerGas, and maxPriorityFeePerGas
  
        // Use the maxFeePerGas (to align with MetaMask's typical gas estimates)
        const maxFeePerGas = feeData.maxFeePerGas; // This is the maximum gas price in Wei
  
        // Calculate total gas fee in Wei (estimatedGas * maxFeePerGas)
        const totalFeeWei = new BN(estimatedGas.toString()).mul(new BN(maxFeePerGas.toString()));
  
        // Convert total fee from Wei to Ether
        const totalFeeEther = Web3.utils.fromWei(totalFeeWei.toString(), 'ether');
  
        // Set the gas fee in Ether
        setGasFee(totalFeeEther);
      } catch (error) {
        console.error("Error estimating gas fee:", error);
        setGasFee('Error'); // Show error message
      }
    } else {
      setGasFee(''); // Reset gas fee if contract or message is not set
    }
  };
  
  

  const sendMessage = async () => {
    if (contract && message) {
      try {
        await contract.methods.sendMessage(message).send({ from: account });
        setMessages([...messages, { sender: account, content: message }]);
        setMessage('');
        setGasFee('');
      } catch (error) {
        console.error("Error sending message:", error); // Add error handling for sendMessage
      }
    } else {
      console.warn("Please enter a message to send.");
    }
  };

  return (
    <div className="flex flex-col items-center p-6 bg-gray-50 rounded-lg shadow-md max-w-5xl mx-auto mt-32">
      <h1 className="text-3xl font-bold text-blue-600 mb-4">Secret Messaging DApp</h1>
      <p className="text-gray-700 mb-4">Connected account: <strong>{account}</strong></p>

      <ul className="w-full space-y-2 mb-4">
        {messages.map((msg, index) => (
          <li key={index} className="p-2 bg-white border border-gray-200 rounded-md shadow-sm">
            <span className="font-medium">{msg.content}</span>
            <span className="text-gray-600"> - from {msg.sender}</span>
          </li>
        ))}
      </ul>

      <div className="flex w-full space-x-2">
        <input
          type="text"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            estimateGasFee(); // Estimate gas fee whenever the message changes
          }}
          className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type your secret message..."
        />
        <input
          type="text"
          value={gasFee}
          readOnly
          className="flex-none p-2 border border-gray-300 rounded-lg bg-gray-200 text-gray-600 w-1/6"
          placeholder="Est. GasFee(ETH)"
        />
        <button
          onClick={sendMessage}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200 flex-none w-1/6"
        >
          Send Message
        </button>
      </div>
    </div>
  );
}

export default App;

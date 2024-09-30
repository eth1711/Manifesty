import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import SecretMessagesABI from './SecretMessagesABI.json'; // Import ABI

function App() {
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const loadBlockchainData = async () => {
      if (window.ethereum) {
        const web3 = new Web3(window.ethereum);
        await window.ethereum.enable();  // Enable MetaMask
        const accounts = await web3.eth.getAccounts();
        setAccount(accounts[0]);

        const contractAddress = '0x81312f88cbdb60b9ce5a118e917282d39ac24d65';
        const contract = new web3.eth.Contract(SecretMessagesABI, contractAddress);
        setContract(contract);

        const storedMessages = await contract.methods.getMessages().call();
        setMessages(storedMessages);
      }
    };
    loadBlockchainData();
  }, []);

  const sendMessage = async () => {
    await contract.methods.sendMessage(message).send({ from: account });
    setMessages([...messages, { sender: account, content: message }]);
  };

  return (
    <div>
      <h1>Secret Messaging DApp</h1>
      <p>Connected account: {account}</p>
      <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} />
      <button onClick={sendMessage}>Send Message</button>
      <ul>
        {messages.map((msg, index) => (
          <li key={index}>{msg.content} - from {msg.sender}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;

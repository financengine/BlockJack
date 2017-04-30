import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/App.js';
import Web3 from 'web3';
import BlockJack from '../contracts/BlockJack.sol';

import truffleConfig from '../truffle.js';

var web3Location = `http://${truffleConfig.networks.development.host}:${truffleConfig.networks.development.port}`;


window.addEventListener('load', function() {                    
  var web3Provided;
  // Supports Metamask and Mist, and other wallets that provide 'web3'.
  if (typeof web3 !== 'undefined') {                            
    // Use the Mist/wallet provider.     
    // eslint-disable-next-line                       
    //web3Provided = new Web3(new Web3.providers.HttpProvider(web3Location))
    web3Provided = web3.currentProvider;               
  } else {                                                      
    web3Provided = new Web3.providers.HttpProvider(web3Location)
  }

  //var BlockJack = contract(BlockJackContract);
  BlockJack.setProvider(web3Provided);

  var web3Instance = new Web3(web3Provided);
  web3Instance.eth.defaultAccount = web3Instance.eth.accounts[0];
  
  ReactDOM.render(
    <App web3={web3Instance} BlockJack={BlockJack} />,
    document.getElementById('app')
  )                                                                                                                    
});
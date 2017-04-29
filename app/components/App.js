var React = require('react');
var ReactDOM = require('react-dom');
var Blackjackbutton = require('./Blackjackbutton');
var Pokerbutton = require('./Pokerbutton');
var NameForm = require('./form');
var Board = require('./Board');
import Web3 from 'web3';
const ETHEREUM_CLIENT = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"))

var smartContractABI = [{"constant":false,"inputs":[],"name":"getBalance","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"time","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"cardsDrawn","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"determineWinner","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"getPot","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"pot","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"buyIn","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"getNumPlayers","outputs":[{"name":"res","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"getStageStart","outputs":[{"name":"","type":"uint8"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"getFirstCard","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"randSeed","type":"uint256"}],"name":"ante","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"getNumPasses","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"removePlayer","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"numPlayers","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"addFunds","outputs":[],"payable":true,"type":"function"},{"constant":false,"inputs":[],"name":"getAddr","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"getScore","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"surrender","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"isFull","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"stage","outputs":[{"name":"","type":"uint8"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"getAllCards","outputs":[{"name":"","type":"uint256[]"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"randSeed","type":"uint256"}],"name":"pass","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"dealCards","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"randSeed","type":"uint256"}],"name":"hit","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"randSeed","type":"uint256"}],"name":"addPlayer","outputs":[],"payable":true,"type":"function"},{"constant":false,"inputs":[{"name":"addr","type":"address"}],"name":"getCards","outputs":[{"name":"","type":"uint256[]"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"getBuyIn","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"getStage","outputs":[{"name":"","type":"uint8"}],"payable":false,"type":"function"},{"inputs":[{"name":"randSeed","type":"uint256"},{"name":"playerCap","type":"uint256"},{"name":"bet","type":"uint256"}],"payable":false,"type":"constructor"}]


var smartContractAddress = '0x8b48d034186effd973b96fe01e3f900f45f6c261';
const smartContract = ETHEREUM_CLIENT.eth.contract(smartContractABI).at(smartContractAddress);


var Home = React.createClass({
  render: function () {
    return (
      <div>
        <h1 style = {{textAlign: 'center', color: 'white'}}>Welcome!</h1>
        <Blackjackbutton />
        <Pokerbutton />
        <NameForm />
      </div>
    );
  }
});

var App = React.createClass({

  getInitialState: function () {
    return {
      title: "Welcome To Our Casino!"
    }
  },

  render: function () {
    return (
        <Board style = {{color: 'white', border: "1px solid red"}}/>
      )
    }
});

ReactDOM.render(<App />,
               document.getElementById('app'));
module.exports = App;

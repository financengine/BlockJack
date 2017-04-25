var React = require('react');
var ReactDOM = require('react-dom');
var Blackjackbutton = require('./Blackjackbutton');
var Pokerbutton = require('./Pokerbutton');
var NameForm = require('./form');
import Web3 from 'web3';
const ETHEREUM_CLIENT = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"))

var smartContractABI = [{"constant":false,"inputs":[],"name":"getBalance","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"time","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"cardsDrawn","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"determineWinner","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"getPot","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"pot","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"buyIn","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"getNumPlayers","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"getFirstCard","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"randSeed","type":"uint256"}],"name":"ante","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"numPlayers","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"addFunds","outputs":[],"payable":true,"type":"function"},{"constant":false,"inputs":[],"name":"getScore","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"stage","outputs":[{"name":"","type":"uint8"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"getAllCards","outputs":[{"name":"","type":"uint256[]"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"dealCards","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"addr","type":"address"}],"name":"cashOut","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"hit","type":"bool"},{"name":"randSeed","type":"uint256"}],"name":"play","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"randSeed","type":"uint256"}],"name":"addPlayer","outputs":[],"payable":true,"type":"function"},{"constant":false,"inputs":[{"name":"addr","type":"address"}],"name":"getCards","outputs":[{"name":"","type":"uint256[]"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"test","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"getBuyIn","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"inputs":[{"name":"randSeed","type":"uint256"},{"name":"playerCap","type":"uint256"},{"name":"bet","type":"uint256"}],"payable":false,"type":"constructor"}]

var smartContractAddress = '0xd330cfa12bfa23beca474cac6ad948fad368abc3';
const smartContract = ETHEREUM_CLIENT.eth.contract(smartContractABI).at(smartContractAddress);

var NavBar = React.createClass({
  render: function () {
    var pages = ['Home ', 'Get Started ', 'About ', 'Contact '];
    var navLinks = pages.map(function(page){
      return (
        <a href={'/' + page} style = {{color: 'white', fontSize: '16px'}}>
          {page}
        </a>
      );
    });
    return <nav>{navLinks}</nav>;
  }
});

var App = React.createClass({
  getInitialState: function() {
    return {
      title: "Welcome To Our Casino!",
      x: ""
    }
  },

  render: function () {
    return (
      <div>

        <NavBar /> 
        <h1 style = {{textAlign: 'center', color: 'white'}}>{this.state.title}</h1>
        <Blackjackbutton />
        <Pokerbutton />
        <NameForm />
      </div>
    );
  }
});
ReactDOM.render(<App />,
               document.getElementById('app'));
module.exports = App;

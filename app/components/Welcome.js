var React = require('react');
var ReactDOM = require('react-dom');

var Router = require('react-router').Router;
var Router = require('react-router').Route;

var Grid = require('react-bootstrap').Grid;
var Row = require('react-bootstrap').Row;
var Col = require('react-bootstrap').Col;


var Board = require('./Board');
import Web3 from 'web3';
const ETHEREUM_CLIENT = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"))

export default class Header extends React.Component{

  getInitialState() {
    return {
      title: "Welcome To The BlockJack Casino!",
      blockjack: "",
      randSeed: 0,
      playerCap: 5,
      minBet: 5
    }
  }

  startGame() {
    //var compiled = ETHEREUM_CLIENT.eth.compile.solidity(stringContract);
    this.setState({blockjack: blockjackContract.new(
     this.state.randSeed,
     this.state.playerCap,
     this.state.minBet,
     {
     from: ETHEREUM_CLIENT.eth.accounts[0],
     data: compiledContractData,
     gas: '4700000'
       }, function (e, contract){
        console.log(e, contract);
        if (typeof contract.address !== 'undefined') {
             console.log('Contract mined! address: ' + contract.address + ' transactionHash: ' + contract.transactionHash);
        }
     })
   });
  }

  render() {

    return (
      <div>
        <Grid>
          <Row>
            <Col>
              <h1>Welcome to BlockJack Casino!</h1>
            </Col>
          </Row>
          <Row>
            <Col>
              <h2>Please either create a new game or join an existing one!</h2>
            </Col>
          </Row>
        </Grid>
        //<button>Start Game</button>
      </div>
      )
    }
};

//module.exports = Welcome;

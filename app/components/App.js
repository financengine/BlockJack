import React from 'react';
import {Router, Route, browserHistory} from 'react-router';
import {Navbar, Nav, NavItem} from 'react-bootstrap';
import * as _ from 'underscore';

import Welcome from './Welcome.js';

export default class App extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
    	games: []
    	//games:[{getAddr: () => { return "asdf"}}]
    }

    if(localStorage.games) {
      this.state.games = _.map(JSON.parse(localStorage.games), (address) => {
        return this.props.BlockJack.at(address);
      });
    }
    this.addGame = this.addGame.bind(this);
  }

  componentDidUpdate(prevProps, prevState) {
    console.log("hi")
    localStorage.games = JSON.stringify(_.map(this.state.games, (game) => {
      return game.address;
    }));
  }

  randomSeed() {
  	return _.random(0, 1000000);
  }

  addGame(address) {
  	var instance = this.props.BlockJack.at(address)
    console.log(instance);
    this.state.games.unshift(instance);
    this.forceUpdate();
  }

  joinGame(address, deposit) {
    console.log(this.props.BlockJack.at(address))
    this.props.BlockJack.at(address).addPlayer.sendTransaction(this.randomSeed(), {value:deposit, gas:4700000}).then((instance) => {
      this.forceUpdate();
    });
  }

  createGame(maxPlayers, buyIn, deposit) {
  	console.log(maxPlayers);
  	this.props.BlockJack.new(this.randomSeed(), maxPlayers, buyIn, {gas:4700000}).then((instance) => {
      console.log(instance);
      this.state.games.unshift(instance);
      this.forceUpdate();
    });
  }

  ante(address) {
    this.props.BlockJack.at(address).ante.sendTransaction(this.randomSeed(), {gas:4700000}).then((instance) => {
      this.forceUpdate();
    });
  }

  hit(address) {
    this.props.BlockJack.at(address).hit.sendTransaction(this.randomSeed(), {gas:4700000}).then((instance) => {
      this.forceUpdate();
    });
  }

  pass(address) {
    this.props.BlockJack.at(address).pass.sendTransaction(this.randomSeed(), {gas:4700000}).then((instance) => {
      this.forceUpdate();
    });
  }

  split(address) {
    this.props.BlockJack.at(address).split.sendTransaction(this.randomSeed(), {gas:4700000}).then((instance) => {
      this.forceUpdate();
    });
  }

  surrender(address) {
    this.props.BlockJack.at(address).surrender.sendTransaction(this.randomSeed(), {gas:4700000}).then((instance) => {
      this.forceUpdate();
    });
  }

  render() {
    return (
    	<div>
    		<Navbar>
          <Navbar.Header>
            <Navbar.Brand>
                <a href="#">BlockJack</a>
            </Navbar.Brand>
          </Navbar.Header>
          <Nav>
            <NavItem>
              Home
            </NavItem>
            <NavItem>
              Create Game
            </NavItem>
          </Nav>
    		</Navbar>

	      <Router history={browserHistory}>
	        <Route path='/' component={Welcome} ante={this.ante.bind(this)} hit={this.hit.bind(this)} pass={this.pass.bind(this)} split={this.split.bind(this)} surrender={this.surrender.bind(this)} addGame={this.addGame.bind(this)} joinGame={this.joinGame.bind(this)} web3={this.props.web3} createGame={this.createGame.bind(this)} games={this.state.games} BlockJack={this.props.BlockJack} />
	      </Router>
      </div>
      )
    }
};

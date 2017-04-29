var React = require('react');
var ReactDOM = require('react-dom');
var Hand = require('./Hand');

var Board = React.createClass({

  getInitialState: function() {
    return {
      yourhand: [0, 0, 0, 0],
      playeronescore: 0,
      twohand: [0, 0, 0, 0],
      threehand: [0,0,0,0],
      fourhand: [0,0,0,0],
      fivehand:[0, 0, 0, 0],
      yourbalance: 100,
      twobalance: 100,
      threebalance: 100,
      fourbalance: 100,
      fivebalance: 100
    }
  },

  randomNumber: function() {
    var number = Math.floor(Math.random() * (416 - 2)) + 2;;
    return number;
  },

  getNumber: function() {
    var suite = this.randomNumber();
    var card = suite % 12;
    suite = suite % 4;
    return [card, suite];
  },

  helperDeal: function() {
    var pairone = this.getNumber();
    var pairtwo = this.getNumber();
    var cardone = pairone[0];
    var suiteone = pairone[1];
    var cardtwo = pairtwo[0];
    var suitetwo = pairtwo[1];
    return [cardone, suiteone, cardtwo, suitetwo];
  },

  handleDeal: function() {
    this.setState({yourhand: this.helperDeal()});
    this.setState({twohand: this.helperDeal()});
    this.setState({threehand: this.helperDeal()});
    this.setState({fourhand: this.helperDeal()});
    this.setState({fivehand: this.helperDeal()});
  },

  render: function() {
          return (
              <div style = {{color: 'white'}}>
              <Hand info = {this.state.twohand} player = "Player two" />
              <Hand info = {this.state.threehand} player = "Player three" />
              <Hand info = {this.state.fourhand} player = "Player four" />
              <Hand info = {this.state.fivehand} player = "Player five" />

              <Hand info = {this.state.yourhand} player = "Your Hand"/>
                <h3>Your score: {this.state.yourhand[0] + this.state.yourhand[2]}</h3>
                <button onClick={this.handleDeal}>Deal</button>
                <h4>Your Balance: {this.state.yourbalance}</h4>
              </div>
          );
      }
  });











module.exports = Board;

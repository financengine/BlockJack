var React = require('react');
var ReactDOM = require('react-dom');


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
              <h1>Player Two: Card One - {this.state.twohand[0]}, Suite - {this.state.twohand[1]} | Card Two - {this.state.twohand[2]}, Suite Two - {this.state.twohand[3]}</h1>
              <h1>Player Three: Card One - {this.state.threehand[0]}, Suite - {this.state.threehand[1]} | Card Two - {this.state.threehand[2]}, Suite Two - {this.state.threehand[3]}</h1>
              <h1>Player Four: Card One - {this.state.fourhand[0]}, Suite - {this.state.fourhand[1]} | Card Two - {this.state.fourhand[2]}, Suite Two - {this.state.fourhand[3]}</h1>
              <h1>Player Five: Card One - {this.state.fivehand[0]}, Suite - {this.state.fivehand[1]} | Card Two - {this.state.fivehand[2]}, Suite Two - {this.state.fivehand[3]}</h1>
                <h1>
                  Your Hand: Card One - {this.state.yourhand[0]}, Suite - {this.state.yourhand[1]} | Card Two - {this.state.yourhand[2]}, Suite Two - {this.state.yourhand[3]}
                </h1>
                <h3>Your score: {this.state.yourhand[0] + this.state.yourhand[2]}</h3>
                <button onClick={this.handleDeal}>Deal</button>
                <h4>Your Balance: {this.state.yourbalance}</h4>
              </div>
          );
      }
  });











module.exports = Board;

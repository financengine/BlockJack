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
      fivebalance: 100,
      yourscore: 0,
      twoscore: 0,
      threescore: 0,
      fourscore: 0,
      fivescore: 0,
      highestscore: ""
    }
  },

  randomNumber: function() {
    var number = Math.floor(Math.random() * (416 - 2)) + 2;;
    return number;
  },

  getNumber: function() {
    var card = this.randomNumber();
    var deckCard = card % 52;
    var suite = Math.floor(deckCard / 13); // 0, 1, 2, 3      
    var rank = Math.floor(deckCard / 4) + 2;  // (0 - 12) + 2 J: 11, Q: 12, K: 13, A: 14
    if (rank == 11) {
      rank = "J";
    } else if (rank == 12) {
      rank = "Q";
    } else if (rank == 13) {
      rank = "K";
    } else if (rank == 14) {
      rank = "A";
    }
    if (suite == 0) {
      suite = "C";
    } else if (suite == 1) {
      suite = "D";
    } else if (suite == 2) {
      suite = "H";
    } else if (suite == 3) {
      suite = "S";
    }
    return [rank, suite];
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
    this.setState({highestscore: this.highestScore()});
    // this.setState({winner: this.});
  },

  getScore: function() {
    var card1 = this.state.yourhand[0];
    if (card1 == "J" || card1 == "Q" || card1 == "K") {
      card1 = 10;
    }
    if (card1 == "A") {
      card1 = 11;
    }
    var card2 = this.state.yourhand[2];
    if (card2 == "J" || card2 == "Q" || card2 == "K") {
      card2 = 10;
    }
    if (card2 == "A") {
      card2 = 11;
    }
    this.setState({yourscore: card1 + card2});
    return card1 + card2;
  },

  getTwoScore: function() {
    var card1 = this.state.twohand[0];
    if (card1 == "J" || card1 == "Q" || card1 == "K") {
      card1 = 10;
    }
    if (card1 == "A") {
      card1 = 11;
    }
    var card2 = this.state.twohand[2];
    if (card2 == "J" || card2 == "Q" || card2 == "K") {
      card2 = 10;
    }
    if (card2 == "A") {
      card2 = 11;
    }
    this.setState({twoscore: card1 + card2});
    return card1 + card2;
  },

  getThreeScore: function() {
    var card1 = this.state.threehand[0];
    if (card1 == "J" || card1 == "Q" || card1 == "K") {
      card1 = 10;
    }
    if (card1 == "A") {
      card1 = 11;
    }
    var card2 = this.state.threehand[2];
    if (card2 == "J" || card2 == "Q" || card2 == "K") {
      card2 = 10;
    }
    if (card2 == "A") {
      card2 = 11;
    }
    this.setState({threescore: card1 + card2});
    return card1 + card2;
  },

  getFourScore: function() {
    var card1 = this.state.fourhand[0];
    if (card1 == "J" || card1 == "Q" || card1 == "K") {
      card1 = 10;
    }
    if (card1 == "A") {
      card1 = 11;
    }
    var card2 = this.state.fourhand[2];
    if (card2 == "J" || card2 == "Q" || card2 == "K") {
      card2 = 10;
    }
    if (card2 == "A") {
      card2 = 11;
    }
    this.setState({fourscore: card1 + card2});
    return card1 + card2;
  },

  getFiveScore: function() {
    var card1 = this.state.fivehand[0];
    if (card1 == "J" || card1 == "Q" || card1 == "K") {
      card1 = 10;
    }
    if (card1 == "A") {
      card1 = 11;
    }
    var card2 = this.state.fivehand[2];
    if (card2 == "J" || card2 == "Q" || card2 == "K") {
      card2 = 10;
    }
    if (card2 == "A") {
      card2 = 11;
    }
    this.setState({fivescore: card1 + card2});
    return card1 + card2;
  },

  highestScore: function() {
    var maxScore = Math.max(this.state.yourscore, this.state.twoscore, this.state.threescore, this.state.fourscore, this.state.fivescore);
    var toShow = "";
    if (maxScore == this.state.yourscore) {
      toShow = toShow + "You" + " ";
    }
    if (maxScore == this.state.twoscore) {
      toShow = toShow + "P2" + " ";
    }
    if (maxScore == this.state.threescore) {
      toShow = toShow + "P3" + " ";
    }
    if (maxScore == this.state.fourscore) {
      toShow = toShow + "P4" + " ";
    }
    if (maxScore == this.state.fivescore) {
      toShow = toShow + "P5" + " ";
    }
    return toShow;
  },

  render: function() {
          return (
              <div style = {{color: 'white'}}>
              <Hand info = {this.state.twohand} player = "Player two" />
              <Hand info = {this.state.threehand} player = "Player three" />
              <Hand info = {this.state.fourhand} player = "Player four" />
              <Hand info = {this.state.fivehand} player = "Player five" />

              <Hand info = {this.state.yourhand} player = "Your Hand"/>
                <h3>Your total: {this.getScore()}</h3>
                <button onClick={this.handleDeal}>Deal</button>
                <h4>Your Balance: {this.state.yourbalance}</h4>
                <h1>The Winner(s): {this.state.highestscore}</h1>
              </div>
          );
      }
  });











module.exports = Board;

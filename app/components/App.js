var React = require('react');
var ReactDOM = require('react-dom');
var Blackjackbutton = require('./Blackjackbutton');
var Pokerbutton = require('./Pokerbutton');
var NameForm = require('./form');


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


/*<NavBar />
<h1 style = {{textAlign: 'center', color: 'white'}}>{this.state.title}</h1>
<Blackjackbutton />
<Pokerbutton />
<NameForm />*/
// --------------------------------
var Table = React.createClass({
  getInitialState: function() {
      return {
        highestnumber: '0',
        playerscore: '0',
        playerone: '0',
        playertwo: '0',
        playerthree: '0',
        amount: 100
      };
   },

  randomNumber: function() {
    number = Math.floor(Math.random() * (21 - 2)) + 2;
    return number;
  },
  handleClick(event) {
    am = this.state.amount - 5;
    this.setState({amount: am});
    var player = this.randomNumber();
    this.setState({playerscore: player});

    var one = this.randomNumber();
    this.setState({playerone: one});

    var two = this.randomNumber();
    this.setState({playertwo: two});

    var three = this.randomNumber();
    this.setState({playerthree: three});
    var highest = Math.max(player, one, two, three);
    this.setState({highestnumber: highest});
    if (Math.max(player, one, two, three) == player) {
      alert('Congrats! You won the pot: 20$');
      am = this.state.amount + 10;
      this.setState({amount: am})
    }
  },
  render: function () {
    return (
      <div style = {{color: 'white'}}>
        <h1>Play BlackJack!</h1>
        <h2>Buy In: 5$</h2>
        <h2>Balance: {this.state.amount}$</h2>
        <div style = {{color: 'white'}}>
          <h3>Highest Score : {this.state.highestnumber}</h3>
          <h3>Player Score: {this.state.playerscore}</h3>
        </div>
        <button onClick={this.handleClick.bind(this)}>Bet</button>
        <h3>Player 1 Score: {this.state.playerone}</h3>
        <h3>Player 2 Score: {this.state.playertwo}</h3>
        <h3>Player 3 Score: {this.state.playerthree}</h3>
      </div>
    );
  }
});
// ------------------------------------------------------
var App = React.createClass({
  getInitialState: function() {
    return {
      title: "Welcome To Our Casino!"
    }
  },
  render: function () {
    return (
      <div>

        <Table />
      </div>
    );
  }
});
ReactDOM.render(<App />,
               document.getElementById('app'));
module.exports = App;

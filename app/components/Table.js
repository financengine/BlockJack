var React = require('react');
var ReactDOM = require('react-dom');


var highestnumber = 0;
var playerscore = 0;
var Table = React.createClass({
  randomNumber: function() {
    var number = Math.floor(Math.random() * (21 - 2)) + 2;
    return number;
  },
  handleClick(event) {
    var number = this.randomNumber();
    playerscore = number;
    if (number > highestnumber) {
      highestnumber = this.number;
    }
    alert('Your score is ' + number);
  },
  render: function () {
    return (
      <div>
        <h1 style = {{color: 'white'}}>Hello World!</h1>
        <div style = {{color: 'white'}}>
          <h3>Highest Score : {highestnumber}</h3>
          <h3>Player Score : {playerscore}</h3>
        </div>
        <button onClick={this.handleClick.bind(this)}>Bet</button>
        <button >Raise Stakes</button>
      </div>
    );
  }
});

module.exports = Table;

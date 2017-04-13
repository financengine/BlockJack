var React = require('react');
var ReactDOM = require('react-dom');

var blackjackbuttonstyle = {
  backgroundColor: 'green',
  position: 'fixed',
  height:'150px',
  width:'150px',
  fontSize: '20px',
  color: 'white',
  top: '200px',
  left: '37%',
  borderRadius: '25px'
}

var Blackjackbutton = React.createClass({
  getDefaultProps: function () {
    return { text: 'Play BlackJack!' };
  },
  handleClick: function() {
      window.location = '/BlackJack';
    },
  render: function () {
    return (
      <button style = {blackjackbuttonstyle} >
        {this.props.text}
      </button>
    );
  }
});

module.exports = Blackjackbutton;

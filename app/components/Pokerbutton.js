var React = require('react');
var ReactDOM = require('react-dom');

var pokerbuttonstyle = {
  backgroundColor: 'green',
  position:'fixed',
  height:'150px',
  width:'150px',
  fontSize: '20px',
  color: 'white',
  top: '200px',
  right: '37%',
  borderRadius: '25px'
}

var Pokerbutton = React.createClass({
  getDefaultProps: function () {
    return { text: 'Play Poker!' };
  },
  render: function () {
    return (
      <button style = {pokerbuttonstyle}>
        {this.props.text}
      </button>
    );
  }
});

module.exports = Pokerbutton;

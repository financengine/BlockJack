var React = require('react');
var ReactDOM = require('react-dom');

var Hand = React.createClass({

  getInitialState: function () {
    return {
      title: "Welcome To Our Casino!"
    }
  },

  render: function () {
    return (
      <div style = {{color: 'white'}}>
        <h1>{this.props.player}: Card One - {this.props.info[0]}, Suite - {this.props.info[1]} | Card Two - {this.props.info[2]}, Suite Two - {this.props.info[3]}</h1>
      </div>
      )
    }
});

module.exports = Hand;

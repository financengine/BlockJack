var React = require('react');
var ReactDOM = require('react-dom');

var NavBar = React.createClass({
  render: function () {
    var pages = ['home ', 'blog ', 'pics ', 'bio ', 'art ', 'shop ', 'about ', 'contact '];
    var navLinks = pages.map(function(page){
      return (
        <a href={'/' + page}>
          {page}
        </a>
      );
    });

    return <nav>{navLinks}</nav>;
  }
});

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

var Blackjackbutton = React.createClass({
  getDefaultProps: function () {
    return { text: 'Play BlackJack!' };
  },
  handleClick: function() {
      window.location = '/BlackJack';
    },
  render: function () {
    return (
      <button style = {blackjackbuttonstyle} onClick={this.handleClick()}>
        {this.props.text}
      </button>
    );
  }
});

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

var App = React.createClass({
  getInitialState: function() {
    return {
      title: "Welcome To Our Casino!"
    }
  },
  render: function () {
    return (
      <div>
        <NavBar />
        <h1 style = {{textAlign: 'center', color: 'white'}}>{this.state.title}</h1>
        <Blackjackbutton />
        <Pokerbutton />
      </div>
    );
  }
});

ReactDOM.render(<App />,
               document.getElementById('app'));
module.exports = App;

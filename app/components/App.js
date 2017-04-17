var React = require('react');
var ReactDOM = require('react-dom');
var Blackjackbutton = require('./Blackjackbutton');
var Pokerbutton = require('./Pokerbutton');
var NameForm = require('./form');
var Link = require('react-router').Link;
var ReactRouter = require('react-router');


var NavBar = React.createClass({
  render: function () {
    var pages = ['Home ', 'Get Started ', 'About ', 'Contact '];ls
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


var App = React.createClass({
  getInitialState: function() {
    return {
      title: "Welcome To Our Casino!"
    }
  },
  render: function () {
    return (
      <div>
        // <NavBar />
        <h1 style = {{textAlign: 'center', color: 'white'}}>{this.state.title}</h1>
        // <Blackjackbutton />
        // <Pokerbutton />
        // <NameForm />

      </div>
    );
  }
});


// React.render(<App/>,
//   document.getElementById('app'));
ReactDOM.render(<App />,
               document.getElementById('app'));
module.exports = App;

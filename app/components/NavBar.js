var react = require('react');
var ReactDOM = require('react-dom');

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

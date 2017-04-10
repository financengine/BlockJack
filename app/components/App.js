var React = require('react');
var ReactDOM = require('react-dom');



var App = React.createClass({

  render: function () {
    return (
      <div>
        <h1 style = {{textAlign: 'center', color: 'white'}}>Welcome To Our Casino!</h1>
      </div>
    );
  }
});

ReactDOM.render(<App />,
               document.getElementById('app'));
module.exports = App;

var React = require('react');
var ReactDOM = require('react-dom');

class NameForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {name: ''};
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    this.setState({name: event.target.value});
  }

  handleSubmit(event) {
    alert('Thank you for signing up with us! Your username is ' );
    event.preventDefault();
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit} style = {{color: 'white'}}>
        <h1>Get Started!</h1>
        <label>
          Name:
          <input
                    value = {this.state.userInput}
                    type="text"
                    onChange={this.handleUserInput} />
        </label>
        <input type="submit" value="Submit" />
      </form>
    );
  }
}
module.exports = NameForm;

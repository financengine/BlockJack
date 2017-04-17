var React = require('react');
var ReactDOM = require('react-dom');

var style = {
  position: 'fixed',
  color: 'white',
  top: '50%',
  left: '37%'
}

class NameForm extends React.Component {
    constructor(props) {
      super(props);
      this.state = {address: '',
                    amount: ''
                  };
      // this.handleChange = this.handleChange.bind(this);
      // this.handleSubmit = this.handleSubmit.bind(this);
    }


  handleSubmit(event) {

    event.preventDefault();
    // console.log(event.target.walletAddress.value);
    // console.log(event.target.depositAmount.value);
    this.state.address = event.target.walletAddress.value;
    this.state.amount = event.target.depositAmount.value;

    alert('Thank you for signing up with us! Your wallet address is: ' + this.state.address
          + '. Your account balance is ' + this.state.amount
        );
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit.bind(this)} style = {style}>
        <h1>Get Started!</h1>
        <label>
          Wallet Address:
              <input name = "walletAddress"
                      type = "text"/>
        </label>
        <br/>
        <label>
          Deposit Amount:
          <input name ="depositAmount"
                 type = "text"/>
        </label>
        <br/>
        <input type = "submit" value = "Submit" />
      </form>
    );
  }
}
module.exports = NameForm;

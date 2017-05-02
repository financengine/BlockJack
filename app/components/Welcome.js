var React = require('react');
var ReactDOM = require('react-dom');

var Router = require('react-router').Router;
var Route = require('react-router').Route;

import * as _ from 'underscore';

import {Grid, Row, Col, PageHeader, Panel, PanelGroup, Form, FormGroup, FormControl, ControlLabel, Button, Modal, ListGroup, ListGroupItem} from 'react-bootstrap';

import Hand from './Hand';

import Web3 from 'web3';
const ETEHREUM_CLIENT = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

const stages = ["Joining", "Ante Up", "Deal", "Play"];

export default class Welcome extends React.Component{

  constructor(props) {
    super(props);
    this.state = {
      addGameAddress:"",
      joinModalGame:"",
      showNewGameModal: false,
      showJoinGameModal: false,
      randSeed: 0,
      playerCap: 2,
      minBet: 1000,
      deposit: 20000,
    };
    this.getData();
    this.onChange = this.onChange.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    this.getData();
  }

  onChange(state) {
    this.setState(state);
    this.getData();
  }

  close() {
    this.setState({ showNewGameModal: false });
  }

  open() {
    this.setState({ showNewGameModal: true });
  }

  closeJoin() {
    this.setState({ showJoinGameModal: false });
  }

  openJoin() {
    this.setState({ showJoinGameModal: true });
  }

  startGame() {
    //var compiled = ETHEREUM_CLIENT.eth.compile.solidity(stringContract);
    this.setState({blockjack: blockjackContract.new(
     this.state.randSeed,
     this.state.playerCap,
     this.state.minBet,
     this.state.deposit,
     {
     from: ETHEREUM_CLIENT.eth.accounts[0],
     data: compiledContractData,
     gas: '4700000'
       }, function (e, contract){
        console.log(e, contract);
        if (typeof contract.address !== 'undefined') {
          console.log('Contract mined! address: ' + contract.address + ' transactionHash: ' + contract.transactionHash);
        }
     })
   });
  }

  handleChange(e) {
    this.setState({ addGameAddress: e.target.value });
  }

  handleChangeNumPlayers(e) {
    this.setState({ playerCap: e.target.value });
  }

  handleChangeMinBet(e) {
    this.setState({ minBet: e.target.value });
  }

  handleChangeDeposit(e) {
    this.setState({ deposit: e.target.value });
  }

  addGame(event) {
    event.preventDefault();
    this.props.route.addGame(this.state.addGameAddress);
  }

  leaveGame(event) {
    event.preventDefault();
    this.props.route.leaveGame(event.target.value);
  }

  createGame(event) {
    event.preventDefault();
    this.props.route.createGame(this.state.playerCap, this.state.minBet, this.state.deposit);
    this.close();
  }

  joinGameButton(event) {
    event.preventDefault();
    this.state.joinModalGame = event.target.value;
    this.openJoin();
    //this.props.route.joinGame(this.state.addGameAddress));
  }

  joinGame() {
    this.closeJoin();
    this.props.route.joinGame(this.state.joinModalGame, this.state.deposit);   
  }

  ante(event) {
    event.preventDefault();
    this.props.route.ante(event.target.value);
  }

  numberToCard(num) {
    var deckCard = num % 52;
    var suite = num % 4; // 0, 1, 2, 3
    var rank = num % 13;  // (0 - 12) + 2 J: 11, Q: 12, K: 13, A: 14
    if (rank == 10) {
      rank = "jack";
    } else if (rank == 11) {
      rank = "queen";
    } else if (rank == 12) {
      rank = "king";
    } else if (rank == 0) {
      rank = "ace";
    }
    if (suite == 0) {
      suite = "clubs";
    } else if (suite == 1) {
      suite = "diamonds";
    } else if (suite == 2) {
      suite = "hearts";
    } else if (suite == 3) {
      suite = "spades";
    }
    return [rank, suite];
  }

  getData() {
    this.props.route.games.forEach((game) => {
      var address = game.address;

      game.getStage.call().then(stage => {
        stage = stage.toNumber();
        console.log(stage)
        if (stage == 0) {

          var promises=[                        
            game.getBalance.call(),
            game.getBuyIn.call(),
            game.getAllPlayers.call(),
            game.getMaxPlayers.call(),
          ];

          Promise.all(promises).then(results => {
            game.balance = results[0];
            game.buyIn = results[1];
            game.allPlayers = results[2];
            game.maxPlayers = results[3];
            game.body = (
              <div>
              <h3><strong>Adding Players</strong> {game.allPlayers.length.toString()} / {game.maxPlayers.toString()}: </h3>
              <Row>
                <Col md={6}>
                  <ListGroup>
                    {
                      _.map(game.allPlayers, (player) => {
                        return (<ListGroupItem key={player}> {player==this.props.route.web3.eth.defaultAccount ? player + ' [you]' : player} </ListGroupItem>)
                      })
                    }
                  </ListGroup>
                </Col>
                <Col md={game.allPlayers.includes(this.props.route.web3.eth.defaultAccount) ? 2 : 3}>
                  <h4><strong>The Pot:</strong> {0}<br/></h4>
                  <h5><strong>Your Balance:</strong> {game.balance.toString()}<br/></h5>
                  <h5><strong>Ante Amount:</strong> {game.buyIn.toString()}<br/><br/></h5>
                </Col>

                <Col md={game.allPlayers.includes(this.props.route.web3.eth.defaultAccount) ? 4 : 3}>
                  {
                    (!game.allPlayers.includes(this.props.route.web3.eth.defaultAccount)) ?
                    (<div><h3>Join the Game!</h3> <br/> <Button value={address} bsStyle="primary" bsSize="large" onClick={this.joinGameButton.bind(this)}>Join</Button></div>) :
                    (<div><h3>Share the Game Id!</h3> <br/> <Button value={address} type="submit" onClick={this.ante.bind(this)} > Ante </Button></div>)
                  }
                </Col>
              </Row>
              </div>
            )

            if(game.allPlayers.includes(this.props.route.web3.eth.defaultAccount)) {
              game.header = (<span><strong>{address}</strong> <span className="pull-right"> <strong> Finding More Players </strong> [{game.allPlayers.length.toString()} / {game.maxPlayers.toString()}]</span></span>)
            } else {
              game.header = (<span><strong>{address}</strong> <span className="pull-right"> <strong> Open </strong> [{game.allPlayers.length.toString()} / {game.maxPlayers.toString()}] </span> </span>)
            }
            game.footer = null;

            this.forceUpdate();
          })
          
        } else if (stage == 1) {

          var promises=[                        
            game.getBalance.call(),
            game.getBuyIn.call(),
            game.getAllPlayers.call(),
            game.getMaxPlayers.call(),
            game.getRoundPlayers.call(),
            game.getPot.call(),
          ];

          Promise.all(promises).then(results => {
            game.balance = results[0];
            game.buyIn = results[1];
            game.allPlayers = results[2];
            game.maxPlayers = results[3];
            game.roundPlayers = results[4];
            game.pot = results[5];
            game.body = (
              <div>
              <h3><strong>Antes</strong> {game.roundPlayers.length.toString()} / {game.allPlayers.length.toString()}: </h3>
              <Row>
                <Col md={6}>
                  <ListGroup>
                    {
                      _.map(game.allPlayers, (player) => {
                        if(game.roundPlayers.includes(player)) {
                          return (<ListGroupItem key={player} bsStyle="success"> {player==this.props.route.web3.eth.defaultAccount ? player + ' [you]' : player} </ListGroupItem>)
                        } else {
                          return (<ListGroupItem key={player} bsStyle="danger"> {player==this.props.route.web3.eth.defaultAccount ? player + ' [you]' : player} </ListGroupItem>)
                        }
                      })
                    }
                  </ListGroup>
                </Col>

                <Col md={2}>
                  <h4><strong>The Pot:</strong> {game.pot.toString()}<br/></h4>
                  <h5><strong>Your Balance:</strong> {game.balance.toString()}<br/></h5>
                  <h5><strong>Ante Amount:</strong> {game.buyIn.toString()}<br/><br/></h5>
                </Col>

                <Col md={4}>
                  {
                    (game.allPlayers.includes(this.props.route.web3.eth.defaultAccount) && !game.roundPlayers.includes(this.props.route.web3.eth.defaultAccount)) ?
                    (<Button value={address} type="submit" onClick={this.ante.bind(this)} > Ante </Button>) :
                    (<span></span>)
                  }
                </Col>
              </Row>
              </div>
            )

            console.log(! game.allPlayers.includes(this.props.route.web3.eth.defaultAccount))

            if(! game.allPlayers.includes(this.props.route.web3.eth.defaultAccount)) {
              game.header = (<span><strong>{address}</strong> <span className="pull-right"> <strong>Closed</strong></span></span>)
            } else if (game.roundPlayers.includes(this.props.route.web3.eth.defaultAccount)) {
              game.header = (<span><strong>{address}</strong> <span className="pull-right"> <strong> Anted.</strong> [{game.roundPlayers.length.toString()} / {game.allPlayers.length.toString()}]</span></span>)
            } else {
              game.header = (<span><strong>{address}</strong> <span className="pull-right"> <strong> Ante Up </strong> [{game.buyIn.toString()} Wei] </span> </span>)
            }

            this.forceUpdate();
          })
          
        } else if (stage == 3) {

          var promises=[                        
            game.getBalance.call(),
            game.getBuyIn.call(),
            game.getAllPlayers.call(),
            game.getMaxPlayers.call(),
            game.getRoundPlayers.call(),
            game.getPot.call(),
            game.getTurn.call(),
            game.getCards.call(this.props.route.web3.eth.defaultAccount),
            game.getOrder.call(this.props.route.web3.eth.defaultAccount)
            
          ];

          Promise.all(promises).then(results => {
            game.balance = results[0];
            game.buyIn = results[1];
            game.allPlayers = results[2];
            game.maxPlayers = results[3];
            game.roundPlayers = results[4];
            game.pot = results[5];
            game.turn = results[6].toNumber();
            game.cards = [results[7][0].toNumber(), results[7][1].toNumber()];
            console.log(game.cards);
            game.order = results[8].toNumber();

            game.body = (
              <div>
              <h3><strong>Turns</strong></h3>
              <Row>
                <Col md={6}>
                  <ListGroup>
                    {
                      _.map(game.roundPlayers, (player) => {
                        if(game.roundPlayers[game.turn.toNumber()] == player) {
                          return (<ListGroupItem key={player} active> {player==this.props.route.web3.eth.defaultAccount ? player + ' [you]' : player} </ListGroupItem>)
                        } else {
                          return (<ListGroupItem key={player}> {player==this.props.route.web3.eth.defaultAccount ? player + ' [you]' : player} </ListGroupItem>)
                        }
                      })
                    }
                  </ListGroup>
                </Col>

                <Col md={2}>
                  <h4><strong>The Pot:</strong> {game.pot.toString()}<br/></h4>
                  <h5><strong>Your Balance:</strong> {game.balance.toString()}<br/></h5>
                  <h5><strong>Ante Amount:</strong> {game.buyIn.toString()}<br/><br/></h5>
                </Col>

                <Col md={4}>
                    <h1>Your Cards:</h1> <br/>
                    {
                      _.map(game.cards, (cardNum) => {
                        var card = this.numberToCard(cardNum);
                        return <img key={cardNum} src={'./../../cards/'+ card[0] +'_of_'+ card[1] +'.png'} style={{width: 100, height: 150}} />
                      })
                    }
                </Col>
              </Row>
              </div>
            )

            if(! game.allPlayers.includes(this.props.route.web3.eth.defaultAccount)) {
              game.header = (<span><strong>{address}</strong> <span className="pull-right"> <strong>Closed</strong></span></span>)
            } else if (game.turn != game.order) {
              game.header = (<span><strong>{address}</strong> <span className="pull-right"> <strong> Game in progress.</strong></span></span>)
            } else {
              game.header = (<span><strong>{address}</strong> <span className="pull-right"> <strong> Make your move </strong></span> </span>)
            }

            this.forceUpdate();
          })
            
           
        }
      });
    })
  }

  render() {

    var header = (
      <span>
        <Button bsStyle="primary" type="submit" onClick={this.open.bind(this)} >
          Create Game
        </Button>
        
        <Form inline className="pull-right" onSubmit={this.addGame.bind(this)}>
          <FormGroup controlId="formInlineName">
            <FormControl type="text" style={{width:"400px"}} value={this.state.addGameAddress} placeholder="Insert Game Contract Address" onChange={this.handleChange.bind(this)} />
          </FormGroup>
          {' '}
          <Button type="submit" onSubmit={this.addGame.bind(this)}>
            Add Game
          </Button>
        </Form>
      </span>
    );

    return (
      <div>
        <Grid>
          <Row>
            <Col>
              <PageHeader>Welcome to BlockJack Casino! <small> Create or join a game</small></PageHeader>
            </Col>
          </Row>
          <Row>
            <Col sm={12}>
              <Panel header={header}>
                {
                  this.props.route.games.length ? 
                  (
                    <PanelGroup accordion>
                      {
                        this.props.route.games.map((game) => {
                          var address = game.address;
                          return (<Panel header={game.header} footer={game.footer} key={address} eventKey={address} >
                            {game.body}
                          </Panel>);
                        })
                      }
                      
                    </PanelGroup>
                  )
                  :
                  (<h3 className="text-center">No Active Games</h3>)
                }
              </Panel>
            </Col>
          </Row>
        </Grid>

        <Modal show={this.state.showNewGameModal} onHide={this.close.bind(this)} >
          <Modal.Header closeButton>
            <Modal.Title>Create New Game</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Col>
              <Form onSubmit={this.createGame.bind(this)}>
                <FormGroup controlId="formControlsSelect">
                  <ControlLabel>Max Number of Players:</ControlLabel>
                  <FormControl componentClass="select" placeholder="5" onChange={this.handleChangeNumPlayers.bind(this)} >
                    <option value={2} >2</option>
                    <option value={3} >3</option>
                    <option value={4} >4</option>
                    <option value={5} >5</option>
                    <option value={6} >6</option>
                    <option value={7} >7</option>
                    <option value={8} >8</option>
                    <option value={9} >9</option>
                    <option value={10} >10</option>
                  </FormControl>
                </FormGroup>
                <FormGroup controlId="formControlsSelect">
                  <ControlLabel>Minimum Bet (in Wei):</ControlLabel>
                  <FormControl placeholder="1000" min="0" type="number" value={this.state.minBet} onChange={this.handleChangeMinBet.bind(this)} />
                </FormGroup>
                <FormGroup controlId="formControlsSelect">
                  <ControlLabel>Amount to Put In (in Wei):</ControlLabel>
                  <FormControl placeholder="20000" min="0" type="number" value={this.state.deposit} onChange={this.handleChangeDeposit.bind(this)} />
                </FormGroup>
                <Button type="submit" >Create Game</Button>
              </Form>
            </Col>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.close.bind(this)}>Close</Button>
          </Modal.Footer>
        </Modal>

        <Modal show={this.state.showJoinGameModal} onHide={this.closeJoin.bind(this)} >
          <Modal.Header closeButton>
            <Modal.Title>Join Game <small>{this.state.joinModalGame}</small></Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Col>
              <Form onSubmit={this.createGame.bind(this)}>
                <FormGroup controlId="formControlsSelect">
                  <ControlLabel>Amount to Put In (in Wei):</ControlLabel>
                  <FormControl placeholder="20000" min="0" type="number" value={this.state.deposit} onChange={this.handleChangeDeposit.bind(this)} />
                </FormGroup>
              </Form>
            </Col>
          </Modal.Body>
          <Modal.Footer>
            <Button bsStyle="success" onClick={this.joinGame.bind(this)}>Join</Button>
            <Button bsStyle="danger" onClick={this.closeJoin.bind(this)}>Never Mind</Button>
          </Modal.Footer>
        </Modal>
      </div>
      )
    }
};

import alt from 'alt';

class NewGameActions {

    constructor() {
        this.generateActions(

        )
    }

    createNewGame(payload, web3, source) {
        var _betAmount = payload.betAmount; //Must be in wei.
        var _randNum = payload.randNum;
        var _maxPlayers = payload.maxPlayers;
        var _deposit = payload.deposit;
        var compiled = web3.eth.compile.solidity(source);
        console.log(compiled);
        var code = compiled.code;
        var abi = compiled.info.abiDefinition;

        var BlockJackContract = web3.eth.contract(abi);
        var BlockJack = BlockJackContract.new(
            _randNum,
            _maxPlayers,
            _betAmount,
            {
                from: web3.eth.accounts[0],
                data: code,
                gas: 3000000,
                value: web3.toWei(parseInt(donationAmount), 'ether');
            }, function(e, contract){
                  console.log(e, contract);
                  if (typeof contract.address != 'undefined') {
                      console.log('Contract mined! address: ' + contract.address + ' transactionHash: ' + contract.transactionHash);
                  }
            }
        )
    }
}

var Web3 = require("web3");
var SolidityEvent = require("web3/lib/web3/event.js");

(function() {
  // Planned for future features, logging, etc.
  function Provider(provider) {
    this.provider = provider;
  }

  Provider.prototype.send = function() {
    this.provider.send.apply(this.provider, arguments);
  };

  Provider.prototype.sendAsync = function() {
    this.provider.sendAsync.apply(this.provider, arguments);
  };

  var BigNumber = (new Web3()).toBigNumber(0).constructor;

  var Utils = {
    is_object: function(val) {
      return typeof val == "object" && !Array.isArray(val);
    },
    is_big_number: function(val) {
      if (typeof val != "object") return false;

      // Instanceof won't work because we have multiple versions of Web3.
      try {
        new BigNumber(val);
        return true;
      } catch (e) {
        return false;
      }
    },
    merge: function() {
      var merged = {};
      var args = Array.prototype.slice.call(arguments);

      for (var i = 0; i < args.length; i++) {
        var object = args[i];
        var keys = Object.keys(object);
        for (var j = 0; j < keys.length; j++) {
          var key = keys[j];
          var value = object[key];
          merged[key] = value;
        }
      }

      return merged;
    },
    promisifyFunction: function(fn, C) {
      var self = this;
      return function() {
        var instance = this;

        var args = Array.prototype.slice.call(arguments);
        var tx_params = {};
        var last_arg = args[args.length - 1];

        // It's only tx_params if it's an object and not a BigNumber.
        if (Utils.is_object(last_arg) && !Utils.is_big_number(last_arg)) {
          tx_params = args.pop();
        }

        tx_params = Utils.merge(C.class_defaults, tx_params);

        return new Promise(function(accept, reject) {
          var callback = function(error, result) {
            if (error != null) {
              reject(error);
            } else {
              accept(result);
            }
          };
          args.push(tx_params, callback);
          fn.apply(instance.contract, args);
        });
      };
    },
    synchronizeFunction: function(fn, instance, C) {
      var self = this;
      return function() {
        var args = Array.prototype.slice.call(arguments);
        var tx_params = {};
        var last_arg = args[args.length - 1];

        // It's only tx_params if it's an object and not a BigNumber.
        if (Utils.is_object(last_arg) && !Utils.is_big_number(last_arg)) {
          tx_params = args.pop();
        }

        tx_params = Utils.merge(C.class_defaults, tx_params);

        return new Promise(function(accept, reject) {

          var decodeLogs = function(logs) {
            return logs.map(function(log) {
              var logABI = C.events[log.topics[0]];

              if (logABI == null) {
                return null;
              }

              var decoder = new SolidityEvent(null, logABI, instance.address);
              return decoder.decode(log);
            }).filter(function(log) {
              return log != null;
            });
          };

          var callback = function(error, tx) {
            if (error != null) {
              reject(error);
              return;
            }

            var timeout = C.synchronization_timeout || 240000;
            var start = new Date().getTime();

            var make_attempt = function() {
              C.web3.eth.getTransactionReceipt(tx, function(err, receipt) {
                if (err) return reject(err);

                if (receipt != null) {
                  // If they've opted into next gen, return more information.
                  if (C.next_gen == true) {
                    return accept({
                      tx: tx,
                      receipt: receipt,
                      logs: decodeLogs(receipt.logs)
                    });
                  } else {
                    return accept(tx);
                  }
                }

                if (timeout > 0 && new Date().getTime() - start > timeout) {
                  return reject(new Error("Transaction " + tx + " wasn't processed in " + (timeout / 1000) + " seconds!"));
                }

                setTimeout(make_attempt, 1000);
              });
            };

            make_attempt();
          };

          args.push(tx_params, callback);
          fn.apply(self, args);
        });
      };
    }
  };

  function instantiate(instance, contract) {
    instance.contract = contract;
    var constructor = instance.constructor;

    // Provision our functions.
    for (var i = 0; i < instance.abi.length; i++) {
      var item = instance.abi[i];
      if (item.type == "function") {
        if (item.constant == true) {
          instance[item.name] = Utils.promisifyFunction(contract[item.name], constructor);
        } else {
          instance[item.name] = Utils.synchronizeFunction(contract[item.name], instance, constructor);
        }

        instance[item.name].call = Utils.promisifyFunction(contract[item.name].call, constructor);
        instance[item.name].sendTransaction = Utils.promisifyFunction(contract[item.name].sendTransaction, constructor);
        instance[item.name].request = contract[item.name].request;
        instance[item.name].estimateGas = Utils.promisifyFunction(contract[item.name].estimateGas, constructor);
      }

      if (item.type == "event") {
        instance[item.name] = contract[item.name];
      }
    }

    instance.allEvents = contract.allEvents;
    instance.address = contract.address;
    instance.transactionHash = contract.transactionHash;
  };

  // Use inheritance to create a clone of this contract,
  // and copy over contract's static functions.
  function mutate(fn) {
    var temp = function Clone() { return fn.apply(this, arguments); };

    Object.keys(fn).forEach(function(key) {
      temp[key] = fn[key];
    });

    temp.prototype = Object.create(fn.prototype);
    bootstrap(temp);
    return temp;
  };

  function bootstrap(fn) {
    fn.web3 = new Web3();
    fn.class_defaults  = fn.prototype.defaults || {};

    // Set the network iniitally to make default data available and re-use code.
    // Then remove the saved network id so the network will be auto-detected on first use.
    fn.setNetwork("default");
    fn.network_id = null;
    return fn;
  };

  // Accepts a contract object created with web3.eth.contract.
  // Optionally, if called without `new`, accepts a network_id and will
  // create a new version of the contract abstraction with that network_id set.
  function Contract() {
    if (this instanceof Contract) {
      instantiate(this, arguments[0]);
    } else {
      var C = mutate(Contract);
      var network_id = arguments.length > 0 ? arguments[0] : "default";
      C.setNetwork(network_id);
      return C;
    }
  };

  Contract.currentProvider = null;

  Contract.setProvider = function(provider) {
    var wrapped = new Provider(provider);
    this.web3.setProvider(wrapped);
    this.currentProvider = provider;
  };

  Contract.new = function() {
    if (this.currentProvider == null) {
      throw new Error("BlockJack error: Please call setProvider() first before calling new().");
    }

    var args = Array.prototype.slice.call(arguments);

    if (!this.unlinked_binary) {
      throw new Error("BlockJack error: contract binary not set. Can't deploy new instance.");
    }

    var regex = /__[^_]+_+/g;
    var unlinked_libraries = this.binary.match(regex);

    if (unlinked_libraries != null) {
      unlinked_libraries = unlinked_libraries.map(function(name) {
        // Remove underscores
        return name.replace(/_/g, "");
      }).sort().filter(function(name, index, arr) {
        // Remove duplicates
        if (index + 1 >= arr.length) {
          return true;
        }

        return name != arr[index + 1];
      }).join(", ");

      throw new Error("BlockJack contains unresolved libraries. You must deploy and link the following libraries before you can deploy a new version of BlockJack: " + unlinked_libraries);
    }

    var self = this;

    return new Promise(function(accept, reject) {
      var contract_class = self.web3.eth.contract(self.abi);
      var tx_params = {};
      var last_arg = args[args.length - 1];

      // It's only tx_params if it's an object and not a BigNumber.
      if (Utils.is_object(last_arg) && !Utils.is_big_number(last_arg)) {
        tx_params = args.pop();
      }

      tx_params = Utils.merge(self.class_defaults, tx_params);

      if (tx_params.data == null) {
        tx_params.data = self.binary;
      }

      // web3 0.9.0 and above calls new twice this callback twice.
      // Why, I have no idea...
      var intermediary = function(err, web3_instance) {
        if (err != null) {
          reject(err);
          return;
        }

        if (err == null && web3_instance != null && web3_instance.address != null) {
          accept(new self(web3_instance));
        }
      };

      args.push(tx_params, intermediary);
      contract_class.new.apply(contract_class, args);
    });
  };

  Contract.at = function(address) {
    if (address == null || typeof address != "string" || address.length != 42) {
      throw new Error("Invalid address passed to BlockJack.at(): " + address);
    }

    var contract_class = this.web3.eth.contract(this.abi);
    var contract = contract_class.at(address);

    return new this(contract);
  };

  Contract.deployed = function() {
    if (!this.address) {
      throw new Error("Cannot find deployed address: BlockJack not deployed or address not set.");
    }

    return this.at(this.address);
  };

  Contract.defaults = function(class_defaults) {
    if (this.class_defaults == null) {
      this.class_defaults = {};
    }

    if (class_defaults == null) {
      class_defaults = {};
    }

    var self = this;
    Object.keys(class_defaults).forEach(function(key) {
      var value = class_defaults[key];
      self.class_defaults[key] = value;
    });

    return this.class_defaults;
  };

  Contract.extend = function() {
    var args = Array.prototype.slice.call(arguments);

    for (var i = 0; i < arguments.length; i++) {
      var object = arguments[i];
      var keys = Object.keys(object);
      for (var j = 0; j < keys.length; j++) {
        var key = keys[j];
        var value = object[key];
        this.prototype[key] = value;
      }
    }
  };

  Contract.all_networks = {
  "default": {
    "abi": [
      {
        "constant": false,
        "inputs": [],
        "name": "getBalance",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "time",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "name": "cardsDrawn",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "getTurn",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "determineWinner",
        "outputs": [],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "getPot",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "pot",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "buyIn",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "getNumPlayers",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "getStageStart",
        "outputs": [
          {
            "name": "",
            "type": "uint8"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "getFirstCard",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "addr",
            "type": "address"
          }
        ],
        "name": "getOrder",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "randSeed",
            "type": "uint256"
          }
        ],
        "name": "ante",
        "outputs": [],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "getRoundPlayers",
        "outputs": [
          {
            "name": "",
            "type": "address[]"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "getNumPasses",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "getMaxPlayers",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "removePlayer",
        "outputs": [],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "numPlayers",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "addFunds",
        "outputs": [],
        "payable": true,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "getAddr",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "getScore",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "surrender",
        "outputs": [],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "isFull",
        "outputs": [
          {
            "name": "",
            "type": "bool"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "stage",
        "outputs": [
          {
            "name": "",
            "type": "uint8"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "getAllCards",
        "outputs": [
          {
            "name": "",
            "type": "uint256[]"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "randSeed",
            "type": "uint256"
          }
        ],
        "name": "pass",
        "outputs": [],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "dealCards",
        "outputs": [],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "randSeed",
            "type": "uint256"
          }
        ],
        "name": "hit",
        "outputs": [],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "randSeed",
            "type": "uint256"
          }
        ],
        "name": "addPlayer",
        "outputs": [],
        "payable": true,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "getAllPlayers",
        "outputs": [
          {
            "name": "",
            "type": "address[]"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "addr",
            "type": "address"
          }
        ],
        "name": "getCards",
        "outputs": [
          {
            "name": "",
            "type": "uint256[]"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "getBuyIn",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "getStage",
        "outputs": [
          {
            "name": "",
            "type": "uint8"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "inputs": [
          {
            "name": "randSeed",
            "type": "uint256"
          },
          {
            "name": "playerCap",
            "type": "uint256"
          },
          {
            "name": "bet",
            "type": "uint256"
          }
        ],
        "payable": false,
        "type": "constructor"
      }
    ],
    "unlinked_binary": "0x60606040526078600355600060048190556005819055600655600f805460ff19169055426010553461000057604051606080611f738339810160409081528151602083015191909201515b600081815542840160075560088390556001555b5050505b611f02806100716000396000f300606060405236156101855763ffffffff60e060020a60003504166312065fe0811461018a57806316ada547146101a95780631e64d148146101c857806328e07244146101ea57806333b16d9314610209578063403c9fa8146102185780634ba2363a1461023757806353aab4341461025657806355c9e926146102755780635b0f3bd8146102945780635f83abe2146102c25780636eba2b13146102e157806373f08a751461030c578063791dd37a1461031e578063871c6ea0146103865780638cbd9eb8146103a55780638d52e1df146103c457806397b2f556146103d3578063a26759cb146103f2578063a74c2bb6146103fc578063afd8206714610425578063b71c47a214610444578063babd3d9a14610453578063c040e6b814610474578063cea13516146104a2578063d67c99611461050a578063d6ffa29a1461051c578063ebf6e91d1461052b578063ec4a8b171461053d578063efa1c4821461054a578063f0194e5a146105b2578063fc72765814610626578063fcaa766414610645575b610000565b3461000057610197610673565b60408051918252519081900360200190f35b3461000057610197610690565b60408051918252519081900360200190f35b3461000057610197600435610696565b60408051918252519081900360200190f35b34610000576101976106b7565b60408051918252519081900360200190f35b34610000576102166106be565b005b3461000057610197610966565b60408051918252519081900360200190f35b346100005761019761096d565b60408051918252519081900360200190f35b3461000057610197610973565b60408051918252519081900360200190f35b3461000057610197610979565b60408051918252519081900360200190f35b34610000576102a1610980565b6040518082600381116100005760ff16815260200191505060405180910390f35b3461000057610197610986565b60408051918252519081900360200190f35b3461000057610197600160a060020a03600435166109ab565b60408051918252519081900360200190f35b34610000576102166004356109cd565b005b346100005761032b610c01565b6040805160208082528351818301528351919283929083019185810191028083838215610373575b80518252602083111561037357601f199092019160209182019101610353565b5050509050019250505060405180910390f35b3461000057610197610c6c565b60408051918252519081900360200190f35b3461000057610197610c73565b60408051918252519081900360200190f35b3461000057610216610c7a565b005b3461000057610197610d43565b60408051918252519081900360200190f35b610216610d49565b005b3461000057610409610d6b565b60408051600160a060020a039092168252519081900360200190f35b3461000057610197610d70565b60408051918252519081900360200190f35b3461000057610216610d90565b005b3461000057610460610efb565b604080519115158252519081900360200190f35b34610000576102a1610f06565b6040518082600381116100005760ff16815260200191505060405180910390f35b346100005761032b610f0f565b6040805160208082528351818301528351919283929083019185810191028083838215610373575b80518252602083111561037357601f199092019160209182019101610353565b5050509050019250505060405180910390f35b3461000057610216600435610f70565b005b3461000057610216611078565b005b34610000576102166004356113d8565b005b610216600435611715565b005b346100005761032b611855565b6040805160208082528351818301528351919283929083019185810191028083838215610373575b80518252602083111561037357601f199092019160209182019101610353565b5050509050019250505060405180910390f35b346100005761032b600160a060020a03600435166118c0565b6040805160208082528351818301528351919283929083019185810191028083838215610373575b80518252602083111561037357601f199092019160209182019101610353565b5050509050019250505060405180910390f35b3461000057610197611938565b60408051918252519081900360200190f35b34610000576102a161193f565b6040518082600381116100005760ff16815260200191505060405180910390f35b600160a060020a0333166000908152600d60205260409020545b90565b60105481565b600281815481101561000057906000526020600020900160005b5054905081565b6004545b90565b600080808080600f5460ff1660038111610000571480156106e5575060105461012c014210155b156106f657426010556106f6611949565b5b6001600f5460ff16600381116100005714801561071a575060105461012c014210155b1561072757610727611949565b5b600380600f5460ff1660038111610000571461074357610000565b600954600654101561075457610000565b60009450600093505b6009548410156107ea57600d6000600986815481101561000057906000526020600020900160005b9054906101000a9004600160a060020a0316600160a060020a0316600160a060020a0316815260200190815260200160002092508483600401541180156107d157506015836004015411155b156107de57826004015494505b5b60018401935061075d565b600091505b6009548210156108f957600d6000600984815481101561000057906000526020600020900160005b9054906101000a9004600160a060020a0316600160a060020a0316600160a060020a03168152602001908152602001600020925084836004015414156108ed57600b8054806001018281815481835581811511610899576000838152602090206108999181019083015b808211156108955760008155600101610881565b5090565b5b505050916000526020600020900160005b600985815481101561000057906000526020600020900160005b9054835461010093840a600160a060020a039390940a90910482168302929091021916179055505b5b6001909101906107ef565b61095c600b80548060200260200160405190810160405280929190818152602001828054801561095257602002820191906000526020600020905b8154600160a060020a03168152600190910190602001808311610934575b50505050506119af565b5b5b505b50505050565b6005545b90565b60055481565b60005481565b6001545b90565b60025b90565b600060026000815481101561000057906000526020600020900160005b505490505b90565b600160a060020a0381166000908152600d60205260409020600301545b919050565b600080600f5460ff1660038111610000571480156109f1575060105461012c014210155b15610a025742601055610a02611949565b5b6001600f5460ff166003811161000057148015610a26575060105461012c014210155b15610a3357610a33611949565b5b600180600f5460ff16600381116100005714610a4f57610000565b600160a060020a0333166000908152600d6020526040812090548154919350901015610a7a57610000565b600080548354038355805460058054909101815560078054860190556009546003808601828155918452600e60209081526040852087548155600180890154908201805460ff191660ff9092161515919091179055600280890154908201559254918301919091556004808701549083015582860180549383018054858255818752929095208795939492810192918215610b365760005260206000209182015b82811115610b36578254825591600101919060010190610b1b565b5b50610b579291505b808211156108955760008155600101610881565b5090565b50506007546002850180549091029055505060098054600181018083558281838015829011610bab57600083815260209020610bab9181019083015b808211156108955760008155600101610881565b5090565b5b505050916000526020600020900160005b8154600160a060020a033381166101009390930a92830292021916179055506001546009541415610bf857610bf0611949565b610bf8611078565b5b5b5b505b5050565b604080516020818101835260008252600980548451818402810184019095528085529293929091830182828015610c6157602002820191906000526020600020905b8154600160a060020a03168152600190910190602001808311610c43575b505050505090505b90565b6006545b90565b6008545b90565b60005b600954811015610cda5733600160a060020a0316600982815481101561000057906000526020600020900160005b9054906101000a9004600160a060020a0316600160a060020a03161415610cd157610000565b5b600101610c7d565b60015460029011610d35575060005b600a54811015610d3057610d27600a82815481101561000057906000526020600020900160005b9054906101000a9004600160a060020a0316611a33565b5b600101610ce9565b610d3e565b610d3e33611a33565b5b5b50565b60015481565b600160a060020a0333166000908152600d602052604090208054340181555b50565b305b90565b600160a060020a0333166000908152600d60205260409020600401545b90565b600080600f5460ff166003811161000057148015610db4575060105461012c014210155b15610dc55742601055610dc5611949565b5b6001600f5460ff166003811161000057148015610de9575060105461012c014210155b15610df657610df6611949565b5b600380600f5460ff16600381116100005714610e1257610000565b600160a060020a0333166000908152600d60205260409020600354600c5491935001421115610e65576004546000908152600e602052604090206001908101805460ff1916909117905542600c55610ed2565b8160030154600454141580610e7e5750600182015460ff165b80610e8c5750600654600954145b15610e9657610000565b6005820154600214156101855760646004830155600080548354600291829004018455905460058054929091049091039055610ed2565b610000565b5b5b6009546004541415610eea576000600455610bfd565b6004805460010190555b5b5b505b50565b600854600154145b90565b600f5460ff1681565b604080516020818101835260008252600280548451818402810184019095528085529293929091830182828015610c6157602002820191906000526020600020905b815481526020019060010190808311610f51575b505050505090505b90565b600080600f5460ff166003811161000057148015610f94575060105461012c014210155b15610fa55742601055610fa5611949565b5b6001600f5460ff166003811161000057148015610fc9575060105461012c014210155b15610fd657610fd6611949565b5b600380600f5460ff16600381116100005714610ff257610000565b600160a060020a0333166000908152600d60205260409020600281018054850190556007805485029055600354600c5491935001421115611057576004546000908152600e602052604090206001908101805460ff1916909117905542600c55610bf8565b6001828101805460ff1916821790556006805490910190555b5b5b505b5050565b600080808080600f5460ff16600381116100005714801561109f575060105461012c014210155b156110b057426010556110b0611949565b5b6001600f5460ff1660038111610000571480156110d4575060105461012c014210155b156110e1576110e1611949565b5b600280600f5460ff166003811161000057146110fd57610000565b611105611949565b600094505b6009546002028510156112cd5760098054600d916000918881156100005706815481101561000057906000526020600020900160005b9054600160a060020a036101009290920a90041681526020808201929092526040908101600020815160c08101835281548152600182015460ff161515818501526002820154818401526003820154606082015260048201546080820152600582018054845181870281018701909552808552929850611203949193899360a08601939192918301828280156111f557602002820191906000526020600020905b8154815260200190600101908083116111e1575b505050505081525050611a9f565b925060028054806001018281815481835581811511611247576000838152602090206112479181019083015b808211156108955760008155600101610881565b5090565b5b505050916000526020600020900160005b50849055506005840180546001810180835582818380158290116112a2576000838152602090206112a29181019083015b808211156108955760008155600101610881565b5090565b5b505050916000526020600020900160005b508490555060078054840290555b60019094019361110a565b600091505b60095482101561095c57600d6000600984815481101561000057906000526020600020900160005b9054600160a060020a036101009290920a90041681526020808201929092526040908101600020815160c08101835281548152600182015460ff1615158185015260028201548184015260038201546060820152600482015460808201526005820180548451818702810187019095528085529298506113bd949193899360a08601939192918301828280156113af57602002820191906000526020600020905b81548152602001906001019080831161139b575b505050505081525050611bb8565b60048501555b6001909101906112d2565b5b5b505b50505050565b60008080600f5460ff1660038111610000571480156113fd575060105461012c014210155b1561140e574260105561140e611949565b5b6001600f5460ff166003811161000057148015611432575060105461012c014210155b1561143f5761143f611949565b5b600380600f5460ff1660038111610000571461145b57610000565b600160a060020a0333166000908152600d60205260409020600354600c54919450014211156114ae576004546000908152600e602052604090206001908101805460ff1916909117905542600c556116ea565b82600301546004541415806114c75750600183015460ff165b806114d55750600654600954145b156114df57610000565b6040805160c08101825284548152600185015460ff161515602080830191909152600286015482840152600386015460608301526004860154608083015260058601805484518184028101840190955280855261157d94889360a08601939192908301828280156111f557602002820191906000526020600020905b8154815260200190600101908083116111e1575b505050505081525050611a9f565b9150600280548060010182818154818355818115116115c1576000838152602090206115c19181019083015b808211156108955760008155600101610881565b5090565b5b505050916000526020600020900160005b508390555060058301805460018101808355828183801582901161161c5760008381526020902061161c9181019083015b808211156108955760008155600101610881565b5090565b5b505050916000526020600020900160005b50839055506040805160c08101825284548152600185015460ff16151560208083019190915260028601548284015260038601546060830152600486015460808301526005860180548451818402810184019095528085526116d194889360a08601939192908301828280156113af57602002820191906000526020600020905b81548152602001906001019080831161139b575b505050505081525050611bb8565b60048401819055601590106116ea576006805460010190555b5b5b6009546004541415611702576000600455610960565b6004805460010190555b5b5b505b505050565b6000600f5460ff166003811161000057148015611738575060105461012c014210155b156117495742601055611749611949565b5b6001600f5460ff16600381116100005714801561176d575060105461012c014210155b1561177a5761177a611949565b5b600080600f5460ff1660038111610000571461179657610000565b60005434106101855760078054830190556117b2333484611c67565b6001805481018155600a805491820180825590919082818380158290116117fe576000838152602090206117fe9181019083015b808211156108955760008155600101610881565b5090565b5b505050916000526020600020900160005b8154600160a060020a033381166101009390930a9283029202191617905550600854600154141561184357611843611949565b5b610bfd565b610000565b5b5b505b50565b604080516020818101835260008252600a80548451818402810184019095528085529293929091830182828015610c6157602002820191906000526020600020905b8154600160a060020a03168152600190910190602001808311610c43575b505050505090505b90565b60408051602081810183526000808352600160a060020a0385168152600d82528390206005018054845181840281018401909552808552929392909183018282801561192b57602002820191906000526020600020905b815481526020019060010190808311611917575b505050505090505b919050565b6000545b90565b600f5460ff165b90565b600f5460ff1660038111610000576001016003811161000057600f805460ff191660018360038111610000570217905550426010556002600f5460ff16600381116100005750505b6003600f5460ff16600381116100005714156119ac5742600c555b5b565b600080805b8351831015611a2457600d6000858581518110156100005790602001906020020151600160a060020a0316600160a060020a03168152602001908152602001600020915083516005548115610000578354919004908101835560058054829003905590505b6001909201916119b4565b610960611ca4565b5b50505050565b600160a060020a0381166000908152600d602052604090208054801515611a5957610000565b6000808355604051600160a060020a0385169183156108fc02918491818181858888f193505050501515611a8f57808255610bf8565b610bf883611e5c565b5b5b505050565b600080808080600f5460ff166003811161000057148015611ac6575060105461012c014210155b15611ad75742601055611ad7611949565b5b6001600f5460ff166003811161000057148015611afb575060105461012c014210155b15611b0857611b08611949565b5b600380600f5460ff16600381116100005714611b2457610000565b60075460408701516101a0910242016040880180519290910691820190529350600192505b8215611ba957600091505b600254821015611ba05783600283815481101561000057906000526020600020900160005b50541415611b945760408601516101a0904201069350611ba0565b5b600190910190611b54565b60009250611b49565b8394505b5b505b505050919050565b600080808080805b8660a0015151831015611c2657600d60348860a00151858151811015610000579060200190602002015181156100005706811561000057069150600a821115611c0857600a91505b811515611c16576001840193505b938101935b600190920191611bc0565b5060005b83811015611c5957601585600b011115611c4957600185019450611c50565b600b850194505b5b600101611c2a565b8495505b5050505050919050565b600160a060020a0383166000908152600d6020526040812083815560018101805460ff191690556002810183905560038101919091555b50505050565b60006006819055805b600954821015611d5757600d6000600984815481101561000057906000526020600020900160005b9054600160a060020a036101009290920a9004168152602080820192909252604001600090812060018101805460ff19169055600381018290556004810182905560058101805483825590835292909120909250611d49918101905b808211156108955760008155600101610881565b5090565b5b505b600190910190611cad565b60098054600080835591909152611da6907f6e1540171b6c0c960b71a7020d9f60077f6af931a8bbf590da0223dacf75c7af908101905b808211156108955760008155600101610881565b5090565b5b5060028054600080835591909152611df7907f405787fa12a823e0f2b7631cc41b3ba8828b3321ca811111fa75cd3aa3bb5ace908101905b808211156108955760008155600101610881565b5090565b5b50600b8054600080835591909152611e48907f0175b7a638427703f0dbe7bb9bbf987a2551717b34e79f33b5b1008d1fa01db9908101905b808211156108955760008155600101610881565b5090565b5b50600f805460ff191660011790555b5050565b600160a060020a0381166000908152600d602090815260408220600180546000190181558101805460ff1916905560038101839055600481018390556002810183905560058101805484825590845291909220610bf8918101905b808211156108955760008155600101610881565b5090565b5b505b50505600a165627a7a723058205c16e27261217d1a81dc974b5a1382ecbb04816e693366719cba4654f3744b2d0029",
    "events": {},
    "updated_at": 1493613544456,
    "links": {},
    "address": "0x17e91cecba69bf3e096c6997f1b9514e4d87ce19"
  }
};

  Contract.checkNetwork = function(callback) {
    var self = this;

    if (this.network_id != null) {
      return callback();
    }

    this.web3.version.network(function(err, result) {
      if (err) return callback(err);

      var network_id = result.toString();

      // If we have the main network,
      if (network_id == "1") {
        var possible_ids = ["1", "live", "default"];

        for (var i = 0; i < possible_ids.length; i++) {
          var id = possible_ids[i];
          if (Contract.all_networks[id] != null) {
            network_id = id;
            break;
          }
        }
      }

      if (self.all_networks[network_id] == null) {
        return callback(new Error(self.name + " error: Can't find artifacts for network id '" + network_id + "'"));
      }

      self.setNetwork(network_id);
      callback();
    })
  };

  Contract.setNetwork = function(network_id) {
    var network = this.all_networks[network_id] || {};

    this.abi             = this.prototype.abi             = network.abi;
    this.unlinked_binary = this.prototype.unlinked_binary = network.unlinked_binary;
    this.address         = this.prototype.address         = network.address;
    this.updated_at      = this.prototype.updated_at      = network.updated_at;
    this.links           = this.prototype.links           = network.links || {};
    this.events          = this.prototype.events          = network.events || {};

    this.network_id = network_id;
  };

  Contract.networks = function() {
    return Object.keys(this.all_networks);
  };

  Contract.link = function(name, address) {
    if (typeof name == "function") {
      var contract = name;

      if (contract.address == null) {
        throw new Error("Cannot link contract without an address.");
      }

      Contract.link(contract.contract_name, contract.address);

      // Merge events so this contract knows about library's events
      Object.keys(contract.events).forEach(function(topic) {
        Contract.events[topic] = contract.events[topic];
      });

      return;
    }

    if (typeof name == "object") {
      var obj = name;
      Object.keys(obj).forEach(function(name) {
        var a = obj[name];
        Contract.link(name, a);
      });
      return;
    }

    Contract.links[name] = address;
  };

  Contract.contract_name   = Contract.prototype.contract_name   = "BlockJack";
  Contract.generated_with  = Contract.prototype.generated_with  = "3.2.0";

  // Allow people to opt-in to breaking changes now.
  Contract.next_gen = false;

  var properties = {
    binary: function() {
      var binary = Contract.unlinked_binary;

      Object.keys(Contract.links).forEach(function(library_name) {
        var library_address = Contract.links[library_name];
        var regex = new RegExp("__" + library_name + "_*", "g");

        binary = binary.replace(regex, library_address.replace("0x", ""));
      });

      return binary;
    }
  };

  Object.keys(properties).forEach(function(key) {
    var getter = properties[key];

    var definition = {};
    definition.enumerable = true;
    definition.configurable = false;
    definition.get = getter;

    Object.defineProperty(Contract, key, definition);
    Object.defineProperty(Contract.prototype, key, definition);
  });

  bootstrap(Contract);

  if (typeof module != "undefined" && typeof module.exports != "undefined") {
    module.exports = Contract;
  } else {
    // There will only be one version of this contract in the browser,
    // and we can use that.
    window.BlockJack = Contract;
  }
})();

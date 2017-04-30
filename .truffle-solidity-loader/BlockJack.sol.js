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
    "unlinked_binary": "0x60606040526078600355600060048190556005819055600655600f805460ff19169055426010553461000057604051606080611ec88339810160409081528151602083015191909201515b600081815542840160075560088390556001555b5050505b611e57806100716000396000f3006060604052361561016f5763ffffffff60e060020a60003504166312065fe0811461017457806316ada547146101935780631e64d148146101b257806333b16d93146101d4578063403c9fa8146101e35780634ba2363a1461020257806353aab4341461022157806355c9e926146102405780635b0f3bd81461025f5780635f83abe21461028d57806373f08a75146102ac578063791dd37a146102be578063871c6ea0146103265780638cbd9eb8146103455780638d52e1df1461036457806397b2f55614610373578063a26759cb14610392578063a74c2bb61461039c578063afd82067146103c5578063b71c47a2146103e4578063babd3d9a146103f3578063c040e6b814610414578063cea1351614610442578063d67c9961146104aa578063d6ffa29a146104bc578063ebf6e91d146104cb578063ec4a8b17146104dd578063efa1c482146104ea578063f0194e5a14610552578063fc727658146105c6578063fcaa7664146105e5575b610000565b3461000057610181610613565b60408051918252519081900360200190f35b3461000057610181610630565b60408051918252519081900360200190f35b3461000057610181600435610636565b60408051918252519081900360200190f35b34610000576101e1610657565b005b34610000576101816108ff565b60408051918252519081900360200190f35b3461000057610181610906565b60408051918252519081900360200190f35b346100005761018161090c565b60408051918252519081900360200190f35b3461000057610181610912565b60408051918252519081900360200190f35b346100005761026c610919565b6040518082600381116100005760ff16815260200191505060405180910390f35b346100005761018161091f565b60408051918252519081900360200190f35b34610000576101e1600435610944565b005b34610000576102cb610b70565b6040805160208082528351818301528351919283929083019185810191028083838215610313575b80518252602083111561031357601f1990920191602091820191016102f3565b5050509050019250505060405180910390f35b3461000057610181610bdb565b60408051918252519081900360200190f35b3461000057610181610be2565b60408051918252519081900360200190f35b34610000576101e1610be9565b005b3461000057610181610cb2565b60408051918252519081900360200190f35b6101e1610cb8565b005b34610000576103a9610cda565b60408051600160a060020a039092168252519081900360200190f35b3461000057610181610cdf565b60408051918252519081900360200190f35b34610000576101e1610cff565b005b3461000057610400610e6a565b604080519115158252519081900360200190f35b346100005761026c610e75565b6040518082600381116100005760ff16815260200191505060405180910390f35b34610000576102cb610e7e565b6040805160208082528351818301528351919283929083019185810191028083838215610313575b80518252602083111561031357601f1990920191602091820191016102f3565b5050509050019250505060405180910390f35b34610000576101e1600435610edf565b005b34610000576101e1610fe7565b005b34610000576101e1600435611347565b005b6101e1600435611684565b005b34610000576102cb6117c4565b6040805160208082528351818301528351919283929083019185810191028083838215610313575b80518252602083111561031357601f1990920191602091820191016102f3565b5050509050019250505060405180910390f35b34610000576102cb600160a060020a036004351661182f565b6040805160208082528351818301528351919283929083019185810191028083838215610313575b80518252602083111561031357601f1990920191602091820191016102f3565b5050509050019250505060405180910390f35b34610000576101816118a7565b60408051918252519081900360200190f35b346100005761026c6118ae565b6040518082600381116100005760ff16815260200191505060405180910390f35b600160a060020a0333166000908152600d60205260409020545b90565b60105481565b600281815481101561000057906000526020600020900160005b5054905081565b600080808080600f5460ff16600381116100005714801561067e575060105461012c014210155b1561068f574260105561068f6118b8565b5b6001600f5460ff1660038111610000571480156106b3575060105461012c014210155b156106c0576106c06118b8565b5b600380600f5460ff166003811161000057146106dc57610000565b60095460065410156106ed57610000565b60009450600093505b60095484101561078357600d6000600986815481101561000057906000526020600020900160005b9054906101000a9004600160a060020a0316600160a060020a0316600160a060020a03168152602001908152602001600020925084836004015411801561076a57506015836004015411155b1561077757826004015494505b5b6001840193506106f6565b600091505b60095482101561089257600d6000600984815481101561000057906000526020600020900160005b9054906101000a9004600160a060020a0316600160a060020a0316600160a060020a031681526020019081526020016000209250848360040154141561088657600b8054806001018281815481835581811511610832576000838152602090206108329181019083015b8082111561082e576000815560010161081a565b5090565b5b505050916000526020600020900160005b600985815481101561000057906000526020600020900160005b9054835461010093840a600160a060020a039390940a90910482168302929091021916179055505b5b600190910190610788565b6108f5600b8054806020026020016040519081016040528092919081815260200182805480156108eb57602002820191906000526020600020905b8154600160a060020a031681526001909101906020018083116108cd575b5050505050611907565b5b5b505b50505050565b6005545b90565b60055481565b60005481565b6001545b90565b60025b90565b600060026000815481101561000057906000526020600020900160005b505490505b90565b600080600f5460ff166003811161000057148015610968575060105461012c014210155b1561097957426010556109796118b8565b5b6001600f5460ff16600381116100005714801561099d575060105461012c014210155b156109aa576109aa6118b8565b5b600180600f5460ff166003811161000057146109c657610000565b600160a060020a0333166000908152600d60205260408120905481549193509010156109f157610000565b600080548354038355805460058054909101815560078054860190556009546003808601828155918452600e60209081526040852087548155600180890154908201805460ff191660ff9092161515919091179055600280890154908201559254918301919091556004808701549083015582860180549383018054858255818752929095208795939492810192918215610aad5760005260206000209182015b82811115610aad578254825591600101919060010190610a92565b5b50610ace9291505b8082111561082e576000815560010161081a565b5090565b50506007546002850180549091029055505060098054600181018083558281838015829011610b2257600083815260209020610b229181019083015b8082111561082e576000815560010161081a565b5090565b5b505050916000526020600020900160005b8154600160a060020a033381166101009390930a92830292021916179055506001546009541415610b6757610b676118b8565b5b5b5b505b5050565b604080516020818101835260008252600980548451818402810184019095528085529293929091830182828015610bd057602002820191906000526020600020905b8154600160a060020a03168152600190910190602001808311610bb2575b505050505090505b90565b6006545b90565b6008545b90565b60005b600954811015610c495733600160a060020a0316600982815481101561000057906000526020600020900160005b9054906101000a9004600160a060020a0316600160a060020a03161415610c4057610000565b5b600101610bec565b60015460029011610ca4575060005b600a54811015610c9f57610c96600a82815481101561000057906000526020600020900160005b9054906101000a9004600160a060020a031661198b565b5b600101610c58565b610cad565b610cad3361198b565b5b5b50565b60015481565b600160a060020a0333166000908152600d602052604090208054340181555b50565b305b90565b600160a060020a0333166000908152600d60205260409020600401545b90565b600080600f5460ff166003811161000057148015610d23575060105461012c014210155b15610d345742601055610d346118b8565b5b6001600f5460ff166003811161000057148015610d58575060105461012c014210155b15610d6557610d656118b8565b5b600380600f5460ff16600381116100005714610d8157610000565b600160a060020a0333166000908152600d60205260409020600354600c5491935001421115610dd4576004546000908152600e602052604090206001908101805460ff1916909117905542600c55610e41565b8160030154600454141580610ded5750600182015460ff165b80610dfb5750600654600954145b15610e0557610000565b60058201546002141561016f5760646004830155600080548354600291829004018455905460058054929091049091039055610e41565b610000565b5b5b6009546004541415610e59576000600455610b6c565b6004805460010190555b5b5b505b50565b600854600154145b90565b600f5460ff1681565b604080516020818101835260008252600280548451818402810184019095528085529293929091830182828015610bd057602002820191906000526020600020905b815481526020019060010190808311610ec0575b505050505090505b90565b600080600f5460ff166003811161000057148015610f03575060105461012c014210155b15610f145742601055610f146118b8565b5b6001600f5460ff166003811161000057148015610f38575060105461012c014210155b15610f4557610f456118b8565b5b600380600f5460ff16600381116100005714610f6157610000565b600160a060020a0333166000908152600d60205260409020600281018054850190556007805485029055600354600c5491935001421115610fc6576004546000908152600e602052604090206001908101805460ff1916909117905542600c55610b67565b6001828101805460ff1916821790556006805490910190555b5b5b505b5050565b600080808080600f5460ff16600381116100005714801561100e575060105461012c014210155b1561101f574260105561101f6118b8565b5b6001600f5460ff166003811161000057148015611043575060105461012c014210155b15611050576110506118b8565b5b600280600f5460ff1660038111610000571461106c57610000565b6110746118b8565b600094505b60095460020285101561123c5760098054600d916000918881156100005706815481101561000057906000526020600020900160005b9054600160a060020a036101009290920a90041681526020808201929092526040908101600020815160c08101835281548152600182015460ff161515818501526002820154818401526003820154606082015260048201546080820152600582018054845181870281018701909552808552929850611172949193899360a086019391929183018282801561116457602002820191906000526020600020905b815481526020019060010190808311611150575b5050505050815250506119f7565b9250600280548060010182818154818355818115116111b6576000838152602090206111b69181019083015b8082111561082e576000815560010161081a565b5090565b5b505050916000526020600020900160005b5084905550600584018054600181018083558281838015829011611211576000838152602090206112119181019083015b8082111561082e576000815560010161081a565b5090565b5b505050916000526020600020900160005b508490555060078054840290555b600190940193611079565b600091505b6009548210156108f557600d6000600984815481101561000057906000526020600020900160005b9054600160a060020a036101009290920a90041681526020808201929092526040908101600020815160c08101835281548152600182015460ff16151581850152600282015481840152600382015460608201526004820154608082015260058201805484518187028101870190955280855292985061132c949193899360a086019391929183018282801561131e57602002820191906000526020600020905b81548152602001906001019080831161130a575b505050505081525050611b10565b60048501555b600190910190611241565b5b5b505b50505050565b60008080600f5460ff16600381116100005714801561136c575060105461012c014210155b1561137d574260105561137d6118b8565b5b6001600f5460ff1660038111610000571480156113a1575060105461012c014210155b156113ae576113ae6118b8565b5b600380600f5460ff166003811161000057146113ca57610000565b600160a060020a0333166000908152600d60205260409020600354600c549194500142111561141d576004546000908152600e602052604090206001908101805460ff1916909117905542600c55611659565b82600301546004541415806114365750600183015460ff165b806114445750600654600954145b1561144e57610000565b6040805160c08101825284548152600185015460ff16151560208083019190915260028601548284015260038601546060830152600486015460808301526005860180548451818402810184019095528085526114ec94889360a086019391929083018282801561116457602002820191906000526020600020905b815481526020019060010190808311611150575b5050505050815250506119f7565b915060028054806001018281815481835581811511611530576000838152602090206115309181019083015b8082111561082e576000815560010161081a565b5090565b5b505050916000526020600020900160005b508390555060058301805460018101808355828183801582901161158b5760008381526020902061158b9181019083015b8082111561082e576000815560010161081a565b5090565b5b505050916000526020600020900160005b50839055506040805160c08101825284548152600185015460ff161515602080830191909152600286015482840152600386015460608301526004860154608083015260058601805484518184028101840190955280855261164094889360a086019391929083018282801561131e57602002820191906000526020600020905b81548152602001906001019080831161130a575b505050505081525050611b10565b6004840181905560159010611659576006805460010190555b5b5b60095460045414156116715760006004556108f9565b6004805460010190555b5b5b505b505050565b6000600f5460ff1660038111610000571480156116a7575060105461012c014210155b156116b857426010556116b86118b8565b5b6001600f5460ff1660038111610000571480156116dc575060105461012c014210155b156116e9576116e96118b8565b5b600080600f5460ff1660038111610000571461170557610000565b600054341061016f576007805483019055611721333484611bbf565b6001805481018155600a8054918201808255909190828183801582901161176d5760008381526020902061176d9181019083015b8082111561082e576000815560010161081a565b5090565b5b505050916000526020600020900160005b8154600160a060020a033381166101009390930a928302920219161790555060085460015414156117b2576117b26118b8565b5b610b6c565b610000565b5b5b505b50565b604080516020818101835260008252600a80548451818402810184019095528085529293929091830182828015610bd057602002820191906000526020600020905b8154600160a060020a03168152600190910190602001808311610bb2575b505050505090505b90565b60408051602081810183526000808352600160a060020a0385168152600d82528390206005018054845181840281018401909552808552929392909183018282801561189a57602002820191906000526020600020905b815481526020019060010190808311611886575b505050505090505b919050565b6000545b90565b600f5460ff165b90565b600f5460ff1660038111610000576001016003811161000057600f805460ff1916600183600381116100005702179055506003600f5460ff16600381116100005714156119045742600c555b5b565b600080805b835183101561197c57600d6000858581518110156100005790602001906020020151600160a060020a0316600160a060020a03168152602001908152602001600020915083516005548115610000578354919004908101835560058054829003905590505b60019092019161190c565b6108f9611bfc565b5b50505050565b600160a060020a0381166000908152600d6020526040902080548015156119b157610000565b6000808355604051600160a060020a0385169183156108fc02918491818181858888f1935050505015156119e757808255610b67565b610b6783611db1565b5b5b505050565b600080808080600f5460ff166003811161000057148015611a1e575060105461012c014210155b15611a2f5742601055611a2f6118b8565b5b6001600f5460ff166003811161000057148015611a53575060105461012c014210155b15611a6057611a606118b8565b5b600380600f5460ff16600381116100005714611a7c57610000565b60075460408701516101a0910242016040880180519290910691820190529350600192505b8215611b0157600091505b600254821015611af85783600283815481101561000057906000526020600020900160005b50541415611aec5760408601516101a0904201069350611af8565b5b600190910190611aac565b60009250611aa1565b8394505b5b505b505050919050565b600080808080805b8660a0015151831015611b7e57600d60348860a00151858151811015610000579060200190602002015181156100005706811561000057069150600a821115611b6057600a91505b811515611b6e576001840193505b938101935b600190920191611b18565b5060005b83811015611bb157601585600b011115611ba157600185019450611ba8565b600b850194505b5b600101611b82565b8495505b5050505050919050565b600160a060020a0383166000908152600d6020526040812083815560018101805460ff191690556002810183905560038101919091555b50505050565b60006006819055805b600954821015611caf57600d6000600984815481101561000057906000526020600020900160005b9054600160a060020a036101009290920a9004168152602080820192909252604001600090812060018101805460ff19169055600381018290556004810182905560058101805483825590835292909120909250611ca1918101905b8082111561082e576000815560010161081a565b5090565b5b505b600190910190611c05565b60098054600080835591909152611cfe907f6e1540171b6c0c960b71a7020d9f60077f6af931a8bbf590da0223dacf75c7af908101905b8082111561082e576000815560010161081a565b5090565b5b5060028054600080835591909152611d4f907f405787fa12a823e0f2b7631cc41b3ba8828b3321ca811111fa75cd3aa3bb5ace908101905b8082111561082e576000815560010161081a565b5090565b5b50600b8054600080835591909152611da0907f0175b7a638427703f0dbe7bb9bbf987a2551717b34e79f33b5b1008d1fa01db9908101905b8082111561082e576000815560010161081a565b5090565b5b50600f805460ff191690555b5050565b600160a060020a0381166000908152600d602090815260408220600180546000190181558101805460ff1916905560038101839055600481018390556002810183905560058101805484825590845291909220610b67918101905b8082111561082e576000815560010161081a565b5090565b5b505b50505600a165627a7a7230582058e886f2d9ede70d9935b5243aa0df3e1d3165187995193dc3e810dee7deb5980029",
    "events": {},
    "updated_at": 1493591687214,
    "links": {},
    "address": "0xc6d51a1d508b1b96d17b28ee9aebad7249573a3a"
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

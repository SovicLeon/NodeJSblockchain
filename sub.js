const lib = require('./class.js');

// Create a new Blockchain object
let chain = new lib.Blockchain();

process.on('message', function(m) {
  console.log('Child: Chain from parent process length: ' + m.chain.length);
  //console.log('J1Child: Chain from parent process length: ' + JSON.stringify(m));
  // Assign the received chain to the local chain variable
  chain.chain = m.chain;
  chain.difficulty = m.difficulty;
  // Call the addBlock function on the local chain object
  //console.log('2Child: Chain from parent process length: ' + chain.chain.length);
  //console.log('J2Child: Chain from parent process length: ' + JSON.stringify(chain));
  let success = chain.addBlock(new lib.Block(chain.chain.length, Date.now(), chain.chain.length));
  if (success) {
    console.log('Block added to the chain');
    process.send(chain);
  } else {
    console.log('Block invalid and not added to the chain');
  }
});
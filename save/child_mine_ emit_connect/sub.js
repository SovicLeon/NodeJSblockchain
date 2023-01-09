const lib = require('./class.js');

// Create a new Blockchain object
let chain = new lib.Blockchain();

process.on('message', function(m) {
  console.log('Child: Chain from parent process length: ' + m.chain.length);
  // Assign the received chain to the local chain variable
  chain = new lib.Blockchain(m.chain);
  for (let i = 1; true; i++) {
    // Call the addBlock function on the local chain object
    let success = chain.addBlock(new lib.Block(i, Date.now(), i));
    if (success) {
      console.log("Child: Is chain valid? " + chain.isChainValid());
      console.log('Block added to the chain');
      process.send(chain);
    } else {
      console.log('Block invalid and not added to the chain');
    }
  }
});
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const ioC = require('socket.io-client');

const lib = require("./class.js");

// Create a new instance of the blockchain
let chain = new lib.Blockchain();

// List of connected nodes
let nodes = [];

// Function to broadcast a new block to all nodes
function broadcastChain() {
  io.emit('new chain', chain);
}

// Function to connect to another node
function connectToNode(host) {
  // Connect to the node using Socket.io
  let socket = ioC.connect(host);

  // Add the node to the list of connected nodes
  nodes.push(socket);

  // Send the current blockchain to the new node
  socket.emit('blockchain', chain);

  // Event handler for receiving a new block from a node
  socket.on('new chain', blockchain => {
    console.log('Received block, len:', blockchain.length);

    // Validate the block and add it to the blockchain if it is valid
    if (blockchain.isChainValid()) {
      chain = blockchain;
    }
  });

  // Event handler for disconnecting a node
  socket.on('disconnect', () => {
    console.log('Node disconnected:', socket.id);

    // Remove the node from the list of connected nodes
    nodes = nodes.filter(node => node !== socket);
  });
}

// Socket.io event handler for incoming connections
io.on('connection', socket => {
  console.log('Node connected:', socket.id);

  // Add the node to the list of connected nodes
  nodes.push(socket);

  // Send the current blockchain to the new node
  socket.emit('blockchain', chain);

  // Event handler for receiving a new block from a node
  socket.on('new chain', blockchain => {
    console.log('Received block, len:', blockchain.length);

    // Validate the block and add it to the blockchain if it is valid
    if (blockchain.isChainValid()) {
      chain = blockchain;
    }
  });

  // Event handler for disconnecting a node
  socket.on('disconnect', () => {
    console.log('Node disconnected:', socket.id);

    // Remove the node from the list of connected nodes
    nodes = nodes.filter(node => node !== socket);
  });
});

// Connect to another node
connectToNode('http://localhost:3001');

// Start the server
server.listen(3000, () => {
  console.log('Server listening on port 3000');
});

// Set the mining interval to 5 seconds
let miningInterval = 10 * 1000;

// Start mining new blocks at the specified interval
//setInterval(mineBlock, miningInterval);


// Write Javascript code here
var cp = require('child_process');
  
var child = cp.fork('sub.js');
  
child.on('message', function(m) {
  console.log("Parent: Chain from child process length: " + m.chain.length);
  chain = m;
  broadcastChain();
});

child.send(chain);

child.on('close', (code) => {
  console.log(`child process exited with code ${code}`);
});

/*function mineBlock() {
  let success = chain.addBlock(new lib.Block(chain.chain.length, Date.now(), { amount: chain.chain.length }));
  if (success) {
    console.log("Block added to the chain");
    broadcastChain();
  } else {
    console.log("Block invalid and not added to the chain");
  }
}*/
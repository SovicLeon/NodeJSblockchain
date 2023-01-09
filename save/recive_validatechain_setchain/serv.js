const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const ioC = require('socket.io-client');
const crypto = require('crypto');

// Difficulty level (higher number = more difficult)
const DIFFICULTY = 4;

// Block class with index, timestamp, data, hash, and previous hash
class Block {
  constructor(index, timestamp, data, previousHash, difficulty) {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data;
    this.previousHash = previousHash;
    this.difficulty = difficulty;
    this.hash = this.calculateHash();
    this.nonce = 0;
  }

  // Calculate the hash of the block
  calculateHash() {
    return crypto.createHash('sha256').update(this.index + this.timestamp.toString() + JSON.stringify(this.data) + this.previousHash + this.nonce + this.difficulty).digest('hex');
  }

  // Mine the block by incrementing the nonce until the hash starts with a certain number of zeros (determined by the difficulty)
  mineBlock(difficulty) {
    let zeros = "";
    for (let i = 0; i < difficulty; i++) {
      zeros += "0";
    }
    while (this.hash.substring(0, difficulty) !== zeros) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
    console.log("\nBLOCK MINED: " + this.index + " " + this.hash + " " + difficulty);
  }
}

// Blockchain class with an array of blocks and a method to add a new block
class Blockchain {
    constructor() {
        this.chain = [this.createGenesisBlock()];
        this.difficulty = 4;
        this.diffAdjustInterval = 1; // Number of blocks between difficulty adjustments
        this.blockGenInterval = 60000; // Expected time to generate a block (in miliseconds)
      }

  // Create the first block in the chain
  createGenesisBlock() {
    return new Block(0, Date.now(), "Genesis block", "0", DIFFICULTY);
  }

  // Get the latest block in the chain
  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

   // Add a new block to the chain
  addBlock(newBlock) {
    newBlock.previousHash = this.getLatestBlock().hash;
    newBlock.difficulty = this.difficulty;
    newBlock.mineBlock(this.difficulty);

    // Validate the block before adding it to the chain
    if (this.isBlockValid(newBlock)) {
      this.chain.push(newBlock);

      // Adjust the difficulty level if necessary
      if (this.chain.length % this.diffAdjustInterval === 0) {
        this.difficulty = this.calculateDifficulty();
      }
      return true;
    }
    return false;
  }

  // Calculate the difficulty level based on the time it takes to generate new blocks
  calculateDifficulty() {   
    // Get the previous adjustment block
    const prevAdjustmentBlock = this.chain[this.chain.length - 1 - this.diffAdjustInterval];
    console.log("Previous adjustment block: " + prevAdjustmentBlock.difficulty);
    console.log("Too smal " + (this.chain.length-1) + " " + this.diffAdjustInterval);

    if (prevAdjustmentBlock.difficulty == undefined) {
        return this.difficulty;
      }   

    // Calculate the expected time to generate a block
    const timeExpected = this.blockGenInterval * this.diffAdjustInterval;
    console.log("Time expected: " + timeExpected);

    // Calculate the time taken to generate the latest block
    const timeTaken = this.getLatestBlock().timestamp - prevAdjustmentBlock.timestamp;
    console.log("Time taken: " + timeTaken);

    // Adjust the difficulty level based on the time taken to generate the block
    if (timeTaken < (timeExpected / 2)) {
      return prevAdjustmentBlock.difficulty + 1;
    } else if (timeTaken > (timeExpected * 2)) {
      return prevAdjustmentBlock.difficulty - 1;
    } else {
      return prevAdjustmentBlock.difficulty;
    }
  }
    
      // Validate the block by checking its hash and previous hash
    isBlockValid(block) {
        if (block.hash !== block.calculateHash()) {
          return false;
        }
        if (block.previousHash !== this.getLatestBlock().hash) {
          return false;
        }
        return true;
    }
    

  // Check if the chain is valid by ensuring that the hash of each block is correct and that the chain is not tampered with
  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];
      if (currentBlock.hash !== currentBlock.calculateHash()) {
        console.log('CHAIN INVALID-hash err1: ' + i);
        return false;
      }
      if (currentBlock.previousHash !== previousBlock.hash) {
        console.log('CHAIN INVALID-hash err2: ' + i);
        return false;
      }
    }
    return true;
  }
}

// Create a new instance of the blockchain
let chain = new Blockchain();

let chainIN = new Blockchain();

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
    console.log('Received chain, len:', blockchain.chain.length);

    chainIN = new Blockchain(blockchain);

    // Validate the block and add it to the blockchain if it is valid
    if (chainIN.isChainValid) {
      chain = blockchain;
      console.log('Received chain is valid, new chain IS set.');
    } else {
      console.log('Received chain is invalid, new chain NOT set.');
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
    console.log('Received chain, len:', blockchain.chain.length);

    // Validate the block and add it to the blockchain if it is valid
    if (blockchain.isChainValid) {
      chain = blockchain;
      console.log('Received chain is valid, new chain set.');
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
connectToNode('http://localhost:3000');

// Start the server
server.listen(3001, () => {
  console.log('Server listening on port 3001');
});
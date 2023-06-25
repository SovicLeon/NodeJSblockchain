# NodeJS POW blockchain

Uses P2P connection

## How it works

* serv.js starts mining and adds blocks to the blockchain

* connects to another server with port

* every miner adds other miners that are connected to each other to the nodes variable

* every miner every so often synchronizes and sends its blockchain to other nodes

* every miner validates the the recieved blockchain and if valid sets it as its own

* after some time the nodes are synchronized

* after some time the difficulty goes up

* new blocks are accepted and added to the chain based on if valid and if they have more difficulty

* the chain with more "work" or more blocks with bigger difficulty is set as current chain

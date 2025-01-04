#!/bin/bash

# Start both the Node.js server and the static file server
node server/index.js & npx serve -s dist -l $PORT

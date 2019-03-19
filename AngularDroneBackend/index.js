// Get dependencies
const express = require('express');
const path = require('path');
const http = require('http');
const bodyParser = require('body-parser');
//const io = require('socket.io')(http);

// Get our API routes
const api = require('./server/routes/api');

const app = express();

// Parsers for POST data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Point static path to dist
const pathToWeb = path.join(__dirname, '/../AngularDroneWebApp/dist/webApp');
console.log("DIRNAME: ",);
app.use(express.static(pathToWeb));

// Set our api routes
app.use('/api', api);

// Catch all other routes and return the index file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '/../AngularDroneWebApp/dist/webApp/index.html'));
});

/**
 * Get port from environment and store in Express.
 */
const httpport = process.env.PORT || '3000';
app.set('port', httpport);

/**
 * Create HTTP server.
 */
const server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(httpport, () => console.log(`API running on localhost:${httpport}`));
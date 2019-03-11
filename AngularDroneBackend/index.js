// Get dependencies
const express = require('express');
const path = require('path');
const http = require('http');
const bodyParser = require('body-parser');
const io = require('socket.io')(http);

const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline')
const port = new SerialPort('COM15', {baudRate: 9600, autoOpen: false})



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

io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
  socket.on('chat message', function(msg){
      console.log(msg);
    io.emit('chat message', msg);
  });
});



port.open(function (err) {
    if (err) {
      return console.log('Error opening port: ', err.message)
    }
    console.log("port opened");

  })

  port.on('open', function() {
    console.log("Port opened Event");
  })

port.on('error', function(err) {
    console.log('Error: ', err.message);
})

port.on('data', function (data) {
  //console.log('Data:', data)
})

const parser = port.pipe(new Readline('*'))
parser.on('data', function(data) {
    console.log('Data:', data);
    io.emit('serial input', data);
})

/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(httpport, () => console.log(`API running on localhost:${httpport}`));
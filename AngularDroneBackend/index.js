var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

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

const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline')
const port = new SerialPort('COM15', {baudRate: 9600, autoOpen: false})

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


/*port.parser.on('data', function (data) {
    console.log('Data:', data, data.toString('utf8'));
  });*/

  port.on('data', function (data) {
    //console.log('Data:', data)
  })

const parser = port.pipe(new Readline('*'))
parser.on('data', function(data) {
    console.log('Data:', data);
    io.emit('serial input', data);
})



http.listen(3000, function(){
  console.log('listening on *:3000');
});
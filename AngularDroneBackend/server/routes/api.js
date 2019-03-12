const express = require('express');
const router = express.Router();
const SerialPortNode= require('serial-node'), serialNode = new SerialPortNode();

let parser = undefined;
let port = undefined;

const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline')
const http = require('http');
const io = require('socket.io')(http);
io.origins('*:*');
/* GET api listing. */
router.get('/', (req, res) => {
  res.send('api works');
});

router.get('/ports', (req, res) => {
    let ports = [];
    var list = serialNode.list();
    for(i=0;i<list.length;i++) 
    {
        ports.push(list[i]); 
    }
    res.send(ports);
});

router.put('/ports', (req, res) => {
    if(port)
    {
        port.close();
    }

    port = new SerialPort(req.body.port, {baudRate: 9600, autoOpen: false})
    port.open(function (err) {
        if (err) {
          return console.log('Error opening port: ', err.message)
        }
        console.log("port opened");
        parser = port.pipe(new Readline('*'))
        parser.on('data', function(data) {
            console.log('Data:', data);
            io.emit('newcoordinate', data);
        })
      })


    res.send("success");
});

module.exports = router;
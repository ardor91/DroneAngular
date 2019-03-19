const express = require('express');
const router = express.Router();
const SerialPortNode= require('serial-node'), serialNode = new SerialPortNode();

const LocalStorage = require('node-localstorage').LocalStorage,
localStorage = new LocalStorage('./scratch');

let parser = undefined;
let port = undefined;

const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline')
const nhttp = require('http').Server(express);
const io = require('socket.io')(nhttp);

/* GET api listing. */
router.get('/', (req, res) => {
  res.send('api works');
});

router.get('/ports', (req, res) => {
  SerialPort.list().then(
    ports => ports.forEach((value, index, array) => {
      console.log("SERIAL PORT: ", value.comName);
    }),
    err => console.error(err)
  )

  for(let i = 0; i < localStorage.length; i++) {
    var k = localStorage.key(i);
    if(k.indexOf("COM") !== -1) {
      console.log("Port found: ", k);
      port = new SerialPort(k, {baudRate: 9600, autoOpen: false});
      port.close();
      //localStorage.removeItem(k);
    }
  }
  for(let i = 0; i < localStorage.length; i++) {
    var k = localStorage.key(i);
    if(k.indexOf("COM") !== -1) {
      localStorage.removeItem(k);
    }
  }

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
    if(localStorage.getItem(req.body.port)) {
      port = new SerialPort(req.body.port, {baudRate: 9600, autoOpen: false});
      port.close();
      localStorage.removeItem(req.body.port);
    }

    port = new SerialPort(req.body.port, {baudRate: 9600, autoOpen: false})
    port.open(function (err) {
        if (err) {
          return console.log('Error opening port: ', err.message)
        }
        console.log("port opened");
        localStorage.setItem(req.body.port, 'opened');
        parser = port.pipe(new Readline('*'))
        parser.on('data', function(data) {
            console.log('Data:', data);
            io.emit('newcoordinate', data);
        })
      })


    res.send({result:"success"});
});

nhttp.listen(4444);

module.exports = router;
const express = require('express');
const router = express.Router();

const mavlink = require('mavlink');

let myMAV = new mavlink(0,0);



const SerialPortNode= require('serial-node'), serialNode = new SerialPortNode();

const LocalStorage = require('node-localstorage').LocalStorage,
localStorage = new LocalStorage('./scratch');

let parser = undefined;
let port = undefined;

let targetPosition = undefined;
let flightPlan = undefined;
let planPointIndex = 0;
let isGoingToStart = true;

const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline')
const nhttp = require('http').Server(express);
const io = require('socket.io')(nhttp);

/* GET api listing. */
router.get('/', (req, res) => {
  res.send('api works');
});

io.on("connection", socket => {
  socket.on('newposition', (position) => {
    console.log("NEW POSITION BLAT, ", position);
    targetPosition = position;
  });

  socket.on('flightplan', (plan) => {
    console.log("NEW PLAN BLAT, ", plan);
    let flag = false;
    flightPlan = [];
    plan.forEach(line => {
      if(flag) {
        flightPlan.push({
          position: line.StartPoint,
          sprayerOn: flag
        });
        flightPlan.push({
          position: line.EndPoint,
          sprayerOn: !flag
        });
      } else {
        flightPlan.push({
          position: line.EndPoint,
          sprayerOn: flag
        });
        flightPlan.push({
          position: line.StartPoint,
          sprayerOn: !flag
        });        
      }
      flag = !flag;
    });
    //flightPlan = plan;
    planPointIndex = 0;
    console.log(flightPlan);
    //targetPosition = position;
  });
});

let mavport = new SerialPort("COM12", {baudRate: 57600, autoOpen: true});
myMAV.on("ready", function() {
  //parse incoming serial data
  console.log("Mavlink ready");
  mavport.on('data', function(data) {
      //console.log("mavdata: ", data);
      //let json = JSON.stringify(data);
      //console.log(json);
      myMAV.parse(data);
      //console.log("LOL: ", msg);
  });
  
  //listen for messages
  myMAV.on("GPS_RAW_INT", function(message, fields) {
      console.log("mavparsedmessage: ", fields);
      io.emit('gpstest', {lat: (fields.lat / 10000000), lng: (fields.lon / 10000000), angle: 60}); //524812088
      //console.log(message.payload.toString());
      //console.log(message.buffer.toString());
  });

  let lat = 52.461099646230515;
  let lng = 30.953739391214980;
  let angle = 0;

  

  emit(lat, lng, angle);

});

let onPosition = false;

function move(current, target) {
    /*var a = Math.abs(current.lat - target.lat);
    var b = Math.abs(current.lng - target.lng);

    c = Math.sqrt(a*a + b*b);

    var angle = (Math.asin(a/c) / Math.PI) * 180;

    var step = 0.00001 * Math.tan(angle);
    console.log(angle);
    return step;*/


    let iSpeed = 0.00001;

    //let fDistance = Math.sqrt( (current.lat-target.lat)*(current.lat-target.lat) + (current.lng - target.lng)*(current.lng-target.lng) );

    let fRadians = 0;
    if (current.lat != target.lat)
    {
      fRadians = Math.atan( 1.0 * Math.abs(current.lng - target.lng) / Math.abs(current.lat-target.lat) );
    }

    // определяем, на сколько нужно изменить позицию Label по осям
    let fDiffX = Math.abs(iSpeed * Math.cos(fRadians));
    let fDiffY = Math.abs(iSpeed * Math.sin(fRadians));

    // преобразование fDiffX, fDiffY в целые числа
    let iDiffX = fDiffX;
    let iDiffY = fDiffY;

    // изменение позиции Label
    if ( target.lat < current.lat ) 
    {
      current.lat += iDiffX;
    }
    else if ( target.lat > current.lat ) {
      current.lat -= iDiffX;
    }
    if ( target.lng < current.lng ) {
      current.lng += iDiffY;
    }
    else if ( target.lng > current.lng ) {
      current.lng -= iDiffY;
    }

    return current;

    // надеюсь, понятно для чего ниже эти переменные
    fOstDiffX = fDiffX - iDiffX;
    fOstDiffY = fDiffY - iDiffY;
}

function emit(lat, lng, angle) {
  setTimeout(() => {
    //console.log("emitting: ", lat, lng);
if(targetPosition) {
  //console.log(lat, targetPosition.lat, lat - targetPosition.lat);
  onPosition = true;

  if(Math.abs(lat - targetPosition.lat) > 0.00001 || Math.abs(lng - targetPosition.lng) > 0.00001)
  {
    let c = move({lat: lat, lng: lng}, targetPosition);
    lat = c.lat;
    lng = c.lng;
    onPosition = false;
  }
    /*if(Math.abs(lat - targetPosition.lat) > 0.00001) {
      if(lat > targetPosition.lat) lat -= 0.00001;
      if(lat < targetPosition.lat) lat += 0.00001;
      onPosition = false;
    }
    let step = calculateStep({lat: lat, lng: lng}, targetPosition);
    if(Math.abs(lng - targetPosition.lng) > 0.00001) {
      if(lng > targetPosition.lng) lng -= step; //0.00001;
      if(lng < targetPosition.lng) lng += step; //0.00001;
      onPosition = false;
    }*/
console.log(onPosition);
    if(onPosition) {
      let planElement = flightPlan[planPointIndex];
      planPointIndex++;
      
      targetPosition = {
        lat: planElement.position.X,
        lng: planElement.position.Y
      };
    }

    io.emit('gpstest', {lat: lat, lng: lng, angle: angle, onPosition: onPosition});
  } else {
    if(flightPlan) {
    targetPosition = {
      lat: flightPlan[0].position.X,
      lng: flightPlan[0].position.Y
    };
  }
  }
    /*lat += 0.0001;
    lng += 0.0001;*/
    angle++;
    if(angle >= 360) angle = 0;
    emit(lat, lng, angle);
  }, 100);
}

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
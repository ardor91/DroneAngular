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
let batteryLevel = 100;
let sprayLevel = 100;

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
    targetPosition = {
        lat: flightPlan[0].position.X,
        lng: flightPlan[0].position.Y
        };
    status = 1;
    console.log(flightPlan);
    let lat = 52.461099646230515;
  let lng = 30.953739391214980;
  let angle = 0;
  iteration = 0;
  

  emit(lat, lng, angle);
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

  

  //emit(lat, lng, angle);

});

let onPosition = false;

function move(current, target) {
    let iSpeed = 0.00001;
    let fRadians = Math.atan( Math.abs(current.lng - target.lng) / Math.abs(current.lat - target.lat) );
    let dX = Math.abs(iSpeed * Math.cos(fRadians));
    let dY = Math.abs(iSpeed * Math.sin(fRadians));
    if ( target.lat < current.lat ) 
    {
      current.lat -= dX;
    }
    else if ( target.lat > current.lat ) {
      current.lat += dX;
    }
    if ( target.lng < current.lng ) {
      current.lng -= dY;
    }
    else if ( target.lng > current.lng ) {
      current.lng += dY;
    }
    return current;
}

let batteryDischargeSpeed = 5;
let sprayDischargeSpeed = 10;
let iteration = 0;
let lastPosition = null;
let basePosition = {
    lat: 52.461099646230515,
    lng: 30.953739391214980
};
//0 - idle, 1 - working, 2 - going to base, 3 - charging, 4 - finished and going home, 5 - going back to work
let status = 0;
let toggleSpray = false;

function emit(lat, lng, angle) {
  setTimeout(() => {
      console.log(status);
    if(status == 1) {
        lastPosition = {lat: lat, lng: lng};
    }
    if(status == 1 && (batteryLevel < 20 || sprayLevel <= 0)) {
        status = 2;
        targetPosition = basePosition;
    }

    if(status == 1 || status == 2) {
        if(iteration % batteryDischargeSpeed == 0 && batteryLevel > 0) {
            batteryLevel--;
        }
    }
    if(status == 1) {
        if(iteration % sprayDischargeSpeed == 0 && sprayLevel > 0) {
            sprayLevel--;
        }
    }

    if (status == 3) {
        if(iteration % batteryDischargeSpeed == 0 && batteryLevel < 100) {
            batteryLevel++;
        }
        if(iteration % sprayDischargeSpeed == 0 && sprayLevel < 100) {
            sprayLevel++;
        }
        if(batteryLevel == 100 && sprayLevel == 100) {
            status = 5;
            targetPosition = lastPosition;
        }

    }

    if( status == 1 || status == 2 || status == 4 || status == 5) {
        onPosition = true;

        if(Math.abs(lat - targetPosition.lat) > 0.00001 || Math.abs(lng - targetPosition.lng) > 0.00001)
        {
            let c = move({lat: lat, lng: lng}, targetPosition);
            lat = c.lat;
            lng = c.lng;
            angle = c.angle;
            onPosition = false;
        }

        if(onPosition) {
            if(status == 4) {
                status = 0;
                return;
            }
            if(status == 2) {
                status = 3;
            }
            if(status == 5) {
                status = 1;
            }
            if(status == 1) {
                if(flightPlan.length <= planPointIndex) {
                    targetPosition = basePosition; 
                    status = 4;
                } else {
                    targetPosition = {
                    lat: flightPlan[planPointIndex].position.X,
                    lng: flightPlan[planPointIndex].position.Y
                    };
                    toggleSpray = flightPlan[planPointIndex].sprayerOn;
                    planPointIndex++;
                }
            }
          }     
          
    }
    io.emit('gpstest', {lat: lat, lng: lng, angle: angle, onPosition: onPosition, batteryLevel: batteryLevel, sprayLevel: sprayLevel, sprayToggled: toggleSpray});
    

    iteration++;
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
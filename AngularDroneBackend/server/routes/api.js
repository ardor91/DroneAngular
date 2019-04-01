const express = require('express');
const router = express.Router();
const nhttp = require('http').Server(express);
const io = require('socket.io')(nhttp);

const SerialPortNode= require('serial-node'), serialNode = new SerialPortNode();
const SerialPort = require('serialport');
const MavlinkClient = require('../services/mavlinkClient');

const DEFAULT_PORT = "COM100";
const DEFAULT_BAUD = 115200;
let CURRENT_PORT = null;
let client = null;

let connectMavlink = (port, baud) => {
  client = new MavlinkClient(port, baud, 1, 1);
  client.createConnectClient().then(() => {
    CURRENT_PORT = port;

    client.subscribeToHeartbeat((data) => {
      io.emit('heartbeat', data);
    });
    
    client.subscribeToPreArmStatus((data) => {
        io.emit('prearm', data);
    });
    
    client.subscribeToAttitude((data) => {
        io.emit('attitude', data);
    });

    client.subscribeToHomePosition((data) => {
      io.emit('homeposition', data);
    });
    
    client.subscribeToGps((data) => {
      io.emit('gpstest', {lat: (data.lat / 10000000), lng: (data.lon / 10000000), angle: 60});
    });

    io.emit('mavlink_client_created', { status: 1, message: "Success" });
  }).catch(err => {
    io.emit('mavlink_client_created', { status: 0, message: err.message });
  });
}

let parser = undefined;
let port = undefined;

let targetPosition = undefined;
let flightPlan = undefined;
let planPointIndex = 0;
let batteryLevel = 100;
let sprayLevel = 100;

//connectMavlink(DEFAULT_PORT, DEFAULT_BAUD);

io.on("connection", socket => {
  socket.on('newposition', (position) => {
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

  socket.on('armCopter', (plan) => {
    client.armCopter();
  });

  socket.on('disarmCopter', (plan) => {
    client.disarmCopter();
  });

  socket.on('rebootSystem', (params) => {
    client.rebootSystems(0, 0);
  });

  socket.on('setHome', async gps => {
    client.setHomePosition(gps.lat, gps.lng);
    let newHome = await client.getHomePosition();
    console.log('NEWHOME:', newHome);
    io.emit('homeposition', newHome);
  });

  socket.on('takeoff', (altitude) => {
    client.takeOff(altitude);
  });

  socket.on('land', (lat, lng, alt) => {
    client.land(lat, lng, alt);
  });

  socket.on('setModeLand', () => {
    client.setMode(client.modes.COPTER_MODE_LAND);
  });

  socket.on('rtl', () => {
    client.returnToLaunch();
  });

  socket.on('setModeRtl', () => {
    client.setMode(client.modes.COPTER_MODE_RTL);
  });

  socket.on('setModePosHold', () => {
    client.setMode(client.modes.COPTER_MODE_POSHOLD);
  });
});



//let mavport = new SerialPort("COM14", {baudRate: 115200, autoOpen: true});

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
let lastTargetPosition = null;
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
                targetPosition = lastTargetPosition;
                status = 1;
            } else
            if(status == 1) {
                if(flightPlan.length <= planPointIndex) {
                    targetPosition = basePosition; 
                    status = 4;
                } else {
                    targetPosition = {
                    lat: flightPlan[planPointIndex].position.X,
                    lng: flightPlan[planPointIndex].position.Y
                    };
                    lastTargetPosition = targetPosition;
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
    let portsList = [];
    //var list = serialNode.list();
    SerialPort.list().then(
      ports => {
        ports.forEach((port) => {
          portsList.push(port.comName);
        });
        if(CURRENT_PORT)
        portsList.push(CURRENT_PORT + ": Current");
        res.send(portsList);
      },
      err => console.error(err)
    )
    
});

router.put('/ports', (req, res) => {
    if(port)
    {
        port.close();
    }
    connectMavlink(req.body.port, req.body.baud);
    res.send({result:"success"});
});

nhttp.listen(4444);

module.exports = router;
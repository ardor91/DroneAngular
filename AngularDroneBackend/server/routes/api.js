const express = require('express');
const router = express.Router();
const nhttp = require('http').Server(express);
const io = require('socket.io')(nhttp);

const SerialPortNode= require('serial-node'), serialNode = new SerialPortNode();
const SerialPort = require('serialport');
const MavlinkClient = require('../services/mavlinkClient');

const DEFAULT_PORT = "COM10";
const DEFAULT_BAUD = 115200;
let CURRENT_PORT = null;
let client = null;
let currentGPSPoint = null;

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

    client.subscribeToAckResponse((data) => {
      io.emit('ack', data);
    });
    
    client.subscribeToGps((data) => {
      currentGPSPoint = {
        lat: data.lat,
        lng: data.lon,
        alt: data.alt,
        angle: data.cog
      };
      //console.log("GPS: ", data);
      io.emit('gpstest', {lat: (data.lat / 10000000), lng: (data.lon / 10000000), angle: data.cog, fix_type: data.fix_type});
    });

    io.emit('mavlink_client_created', { status: 1, message: "Success" });
  }).catch(err => {
    console.log("Error: ", err);
    io.emit('mavlink_client_created', { status: 0, message: err });
  });
}

let port = undefined;

let targetPosition = undefined;
let flightPlan = undefined;
let planPointIndex = 0;
let batteryLevel = 100;
let sprayLevel = 100;
let onPosition = false;
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
let acceptanceRadius = 0.00001;

//connectMavlink(DEFAULT_PORT, DEFAULT_BAUD);

io.on("connection", socket => {
  /*socket.on('newposition', (position) => {
    targetPosition = position;
  });*/

  socket.on('flightplan', (plan) => {
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

    planPointIndex = 0;
    targetPosition = {
      lat: flightPlan[0].position.X,
      lng: flightPlan[0].position.Y
    };
    status = 1;
    console.log(flightPlan);
    let lat = 52.461099646230515;
    let lng = 30.953739391214980;
    iteration = 0;
    client.takeOff(5);
    setTimeout(() => {
      console.log("Starting loop");
      client.navToWaypoint(0, 0, targetPosition.lat, targetPosition.lng, 5);
      loop();
    }, 10000);
  });

  socket.on('flightplansimulation', (plan) => {
    console.log("SIMULATION STARTED");
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

  socket.on('armCopter', (value) => {
    if (value) {
      console.log('ARM');
      client.armCopter();
    } else {
      console.log('DISARM');
      client.disarmCopter();
    }
  });

  socket.on('disarmCopter', (plan) => {
    client.disarmCopter();
  });

  socket.on('rebootSystem', (params) => {
    client.rebootSystems(0, 0);
  });

  socket.on('setHome', async gps => {
    client.setHomePosition(gps.lat, gps.lng);
    basePosition = {lat: gps.lat, lng: gps.lng};
    let newHome = await client.getHomePosition();
    io.emit('homeposition', newHome);
  });

  socket.on('takeoff', (altitude) => {
    console.log("API TAKEOFF: ", altitude);
    client.takeOff(altitude);
  });

  socket.on('land', ({ lat, lng, alt }) => {
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
    client.setMode(client.modes.COPTER_MODE_POSHOLD, 4, 4);
  });

  socket.on('newposition', (gps) => {
    client.navToWaypoint(10, 1, gps.lat, gps.lng, 5);
  });

  socket.on('custom_mode', (modeId) => {
    client.customMode(modeId);
  });

  socket.on('custom_command', (commandDef) => {
    client.customCommand(commandDef);
  });

  socket.on('sendinterval', () => {
    client.sendInterval();
  });
});



//let mavport = new SerialPort("COM14", {baudRate: 115200, autoOpen: true});

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

function emit(lat, lng, angle) {
  setTimeout(() => {
      console.log("SIMSTATUS: " + status);
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
    io.emit('gpstest', {lat: lat, lng: lng, angle: angle, onPosition: onPosition, batteryLevel: batteryLevel, sprayLevel: sprayLevel, sprayToggled: toggleSpray, basePosition: basePosition});
    

    iteration++;
    emit(lat, lng, angle);
  }, 100);
}
// 0 - idle, 1 - working, 2 - going to base, 3 - charging, 4 - finished and going home, 5 - going back to work
// repeat every 100ms
function loop() {
  setTimeout(() => {
    //console.log(status);
    // working
    if(status == 1) {
        //console.log();
        lastPosition = {lat: currentGPSPoint.lat, lng: currentGPSPoint.lng};
    }
    /*if(status == 1 && (batteryLevel < 20 || sprayLevel <= 0)) {
        status = 2;
        targetPosition = basePosition;
    }*/

    /*if(status == 1 || status == 2) {
        if(iteration % batteryDischargeSpeed == 0 && batteryLevel > 0) {
            batteryLevel--;
        }
    }*/
    /*if(status == 1) {
        if(iteration % sprayDischargeSpeed == 0 && sprayLevel > 0) {
            sprayLevel--;
        }
    }*/

    /*if (status == 3) {
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
    }*/

    if( status == 1 || status == 2 || status == 4 || status == 5) {
      onPosition = true;

      if(Math.abs(currentGPSPoint.lat / 10000000 - targetPosition.lat) > acceptanceRadius || Math.abs(currentGPSPoint.lng / 10000000 - targetPosition.lng) > acceptanceRadius)
      {
          //console.log("not on position. diffLat: ", Math.abs(currentGPSPoint.lat / 10000000 - targetPosition.lat), "diff lon: ", Math.abs(currentGPSPoint.lng / 10000000 - targetPosition.lng));
          onPosition = false;
      }

      if(onPosition) {
        console.log("On position");
        // finished and going home and on home position now
        if(status == 4) {
            status = 0; // idle
            return;
        }
        // going back to home and on home position now
        if(status == 2) {
            status = 3; // charging
        }
        // going back to work and on latest position now
        if(status == 5) {
            targetPosition = lastTargetPosition;
            status = 1; // working
        } else
        // working and on target position now
        if(status == 1) {
          // no next target
          if(flightPlan.length <= planPointIndex) {
            targetPosition = basePosition; 
            status = 4; // going home
          } else {
            // get next target position
            targetPosition = {
              lat: flightPlan[planPointIndex].position.X,
              lng: flightPlan[planPointIndex].position.Y
            };

            client.navToWaypoint(0, 0, targetPosition.lat, targetPosition.lng, 5);
            lastTargetPosition = targetPosition;
            toggleSpray = flightPlan[planPointIndex].sprayerOn;
            planPointIndex++;
          }
        }
      }               
    }
    //io.emit('copter_status', {lat: currentGPSPoint.lat, lng: currentGPSPoint.lng, angle: currentGPSPoint.angle, onPosition: onPosition, batteryLevel: batteryLevel, sprayLevel: sprayLevel, sprayToggled: toggleSpray, basePosition: basePosition});
    
    iteration++;
    loop();
  }, 3000);
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
        portsList.push("Debug port");
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
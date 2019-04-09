const util = require('util');
const mavlink = require('mavlink');
const SerialPort = require('serialport');

module.exports = class MavlinkClient {

    constructor(serialPort, baudRate = 57600, groundStationId=0, deviceId=0) {
        this._startupParams = {
            serialPort: serialPort,
            baudRate: baudRate,
            groundStationId: groundStationId,
            deviceId: deviceId
        }
        this._gpsSubscribers = [];
        this._attitudeSubscribers = [];
        this._heartbeatSubscribers = [];
        this._prearmSubscribers = [];
        this._batteryStatusSibscribers = [];
        this._homePositionSubscribers = [];
        this._commandAckSubscribers = [];
        this._time_usec = 0;
        this._currentGps = {lat: 0, lng: 0};
    }

    get modes() {
        return {
            COPTER_MODE_STABILIZE: 0,
            COPTER_MODE_ALT_HOLD: 2,
            COPTER_MODE_GUIDED: 4,
            COPTER_MODE_RTL: 6,
            COPTER_MODE_LAND: 9,
            COPTER_MODE_POSHOLD: 16
        }
    }

    createConnectClient() {
        return new Promise((resolve, reject) => {
            console.log('Trying to create new client on port ', this._startupParams.serialPort);
            this._resolvedPort = false;

            let mavlinkPromise = new Promise((mavresolve, mavreject) => {
                this._mavlinkObject = new mavlink(this._startupParams.groundStationId, this._startupParams.deviceId);
                this._mavlinkObject.on("ready", () => {
                    mavresolve();
                });
            });

            let portPromise = new Promise((portresolve, portreject) => {
                this._mavport = new SerialPort(this._startupParams.serialPort, { baudRate: this._startupParams.baudRate, autoOpen: true }, () => {
                    if(!this._mavport.isOpen) {
                        portreject("Port was not opened: " + this._startupParams.serialPort);
                    } else {
                        portresolve();
                    }
                });
            });

            Promise.all([mavlinkPromise, portPromise]).then(() => {
                this._mavport.on('data', (data) => {
                    this._mavlinkObject.parse(data);
                });
                
                //listen for Attitude change messages
                this._mavlinkObject.on("ATTITUDE", (message, fields) => {
                    this._attitudeSubscribers.forEach(subscriber => {
                        subscriber(fields);
                    });
                });
    
                //listen for Heartbeat status messages
                this._mavlinkObject.on("HEARTBEAT", (message, fields) => {
                    if (!this._resolvedPort) {
                        this._resolvedPort = true;
                        console.log('Successfuly created MavLink Client');
                        resolve();
                    }
                        
                    this._heartbeatSubscribers.forEach(subscriber => {
                        subscriber(fields);
                    });
                    //this.requestMessage(24);
                });
    
                //listen for Status messages
                this._mavlinkObject.on("STATUSTEXT", (message, fields) => {
                    let status_text = fields.text;
                    let PRE_ARM = 'PreArm';
                    if (status_text.indexOf(PRE_ARM) >= 0) {
                        this._prearmSubscribers.forEach(subscriber => {
                            subscriber(fields);
                        });
                    }                
                });

                //listen for Status messages
                this._mavlinkObject.on("COMMAND_ACK", (message, fields) => {
                    console.log("ACK response received: ", fields);
                    this._commandAckSubscribers.forEach(subscriber => {
                        subscriber(fields);
                    });                                  
                });
    
                //listen for GPS messages
                this._mavlinkObject.on("GLOBAL_POSITION_INT", (message, fields) => {
                    //console.log("GPS ", fields);
                    if(fields.time_usec && fields.time_usec != 0) {
                        //console.log("GOTCHA")
                         this._time_usec =  fields.time_usec;
                            this._currentGps = {lat: fields.lat, lng: fields.lon};
                    }
                    this._gpsSubscribers.forEach(subscriber => {
                        subscriber(fields);
                    });
                });
    
                // Listen for Battery status messages
                this._mavlinkObject.on("BATTERY_STATUS", (message, fields) => {
                    this._batteryStatusSibscribers.forEach(subscriber => {
                        subscriber(fields);
                    });
                });
    
                // Listen for Home position status messages
                this._mavlinkObject.on("HOME_POSITION", (message, fields) => {
                    console.log('HP');
                    this._homePositionSubscribers.forEach(subscriber => {
                        subscriber(fields);
                    });
                });

                // Listen for Home position status messages
                this._mavlinkObject.on("SET_HOME_POSITION", (message, fields) => {
                    console.log('SHP');
                    this._homePositionSubscribers.forEach(subscriber => {
                        subscriber(fields);
                    });
                });

                setTimeout(() => {
                    if (!this._resolvedPort) {
                        reject('Port has not responded with Heartbeat')
                    }
                }, 10000);
            }).catch((err) => {
                console.log('Promise error happened, ', err);
                reject(err);
            });
        });
    }

    reconnectToDrone() {
        this.createConnectClient();
    }

    rebootSystems(autopilot, computer) {
        //MAV_CMD_PREFLIGHT_REBOOT_SHUTDOWN  246
        //1: 0: Do nothing for autopilot, 1: Reboot autopilot, 2: Shutdown autopilot, 3: Reboot autopilot and keep it in the bootloader until upgraded.
        //2: 0: Do nothing for onboard computer, 1: Reboot onboard computer, 2: Shutdown onboard computer, 3: Reboot onboard computer and keep it in the bootloader until upgraded.
        this._sendCommandLong(1, 1, 0, 0, 0, 0, 0, 246, 1, 1, 1);
        setTimeout(() => {
            this._mavport.close((err) => {
                if (err) {
                    throw err;
                } else {
                    console.log('Closed port; going to reconnect to Copter in 10 seconds');
                    setTimeout(() => {
                        this.createConnectClient();
                    }, 10000);
                }
            });
        }, 1000);
    }

    subscribeToGps(subscriber) {
        this._gpsSubscribers.push(subscriber);
    }

    subscribeToAttitude(subscriber) {
        this._attitudeSubscribers.push(subscriber);
    }

    subscribeToHeartbeat(subscriber) {
        this._heartbeatSubscribers.push(subscriber);
    }

    subscribeToPreArmStatus(subscriber) {
        this._prearmSubscribers.push(subscriber);
    }

    subscribeToBatteryStatus(subscriber) {
        this._batteryStatusSibscribers.push(subscriber);
    }

    subscribeToHomePosition(subscriber) {
        this._homePositionSubscribers.push(subscriber);
    }

    subscribeToAckResponse(subscriber) {
        this._commandAckSubscribers.push(subscriber);
    }

    armCopter() {
        //MAV_CMD_COMPONENT_ARM_DISARM  400
        //1: 0 - disarm, 1 - arm
        this._sendCommandLong(1, 0, 0, 0, 0, 0, 0, 400, 1, 1, 1); 
    }

    disarmCopter() {
        //MAV_CMD_COMPONENT_ARM_DISARM  400
        //1: 0 - disarm, 1 - arm
        this._sendCommandLong(0, 0, 0, 0, 0, 0, 0, 400, 1, 1, 1);        
    }

    customMode(modeId) {
        this.setMode(89, modeId);
    }

    customCommand(command) {
        this._sendCommandLong(command.param1, command.param2, command.param3, command.param4, command.param5, command.param6, command.param7, command.id, 1);
    }

    takeOff(altitude) {
        console.log('CLI TAKEOFF; ', altitude);
        //this.setMode(5, 216);
        //0	1	0	16	0	0	0	0	52.461707	30.952236	136.090000	1
        //this._sendCommandLong(2, 2, 60, 0, 0, 0, 0, 178, 1);

        //this._sendCommandLong(5, 0, 0, 0, 52.461707, 30.952236, 10, 16, 1);
        
        this._sendCommandLong(0, 0, 0, 0, 0, 0, altitude, 22, 1);

       // this._set_position_target_global_int(0, 1, this._currentGps.lat, this._currentGps.lng, altitude);
    }

    land(lat, lng, alt) {
        //MAV_CMD_NAV_LAND 21
        this._sendCommandLong(0, 0, 0, 0, lat, lng, alt, 21, 1);
    }

    navToWaypoint(holdTime = 0, radius = 1, lat, lng, alt) {
        //MAV_CMD_NAV_WAYPOINT 16
        //this._sendCommandLong(holdTime, radius, 0, 0, lat, lng, alt, 16, 1);
        console.log("nav: ", lat, lng);
        this._set_position_target_global_int(1, 1, lat, lng, alt);
    }

    //MAV_CMD_NAV_RETURN_TO_LAUNCH 20
    returnToLaunch() {
        this._sendCommandLong(0, 0, 0, 0, 0, 0, 0, 20, 1);
    }

    //MAV_CMD_NAV_CONTINUE_AND_CHANGE_ALT 30
    continueAndChangeAltitude(mode = 0, alt) {
        this._sendCommandLong(mode, 0, 0, 0, 0, 0, alt, 30, 1);
    }

    //MAV_CMD_NAV_SPLINE_WAYPOINT 82
    setSplineWaypoint(lat, lng, alt) {
        this._sendCommandLong(0, 0, 0, 0, lat, lng, alt, 82, 1);
    }

    //MAV_CMD_NAV_GUIDED_ENABLE 92
    
    //MAV_CMD_DO_CHANGE_SPEED 178  1: 0=Airspeed, 1=Ground Speed, 2=Climb Speed, 3=Descent Speed
    
    //MAV_CMD_DO_SET_SERVO 183 1: servo nmb  2: PWM microseconds
    //MAV_CMD_DO_PAUSE_CONTINUE 193  1: 0=pause 1=continue

    //MAV_CMD_DO_SET_MODE 176   1: ENUM MAV_MODE (220 = AUTO_ARMED), 2: ArduCopter-specific mode name
    setMode(baseIndex = 89, modeIndex, submode = 0) {
        console.log("SET MODE: ", modeIndex);
        this._sendCommandLong(baseIndex, modeIndex, submode, 0, 0, 0, 0, 176, 1);
    }

    //MAV_CMD_DO_CHANGE_ALTITUDE 186 1: alt 
    setAltitude(alt = 10) {
        //this._sendCommandLong(alt, 0, 0, 0, 0, 0, 0, 186, 1);
        this._set_position_target_global_int(0, 1, 0, 0, alt);
    }

    //MAV_CMD_DO_SET_HOME 179 1:Use current (1=use current location, 0=use specified location) 5-7: lat, lng, alt
    setHomePosition(lat = 0, lng = 0, alt = 10) {
        console.log('Going to set new Home position');
        this._sendCommandLong((!lat && !lng) ? 1 : 0, 0, 0, 0, lat, lng, alt, 179, 1);
    }

    //MAV_CMD_GET_HOME_POSITION 410
    async getHomePosition() {
        return new Promise((resolve, reject) => {
            this._homePositionSubscribers.push((fields) => {
                console.log('GOT NEW HOME POS');
                resolve(fields);
            });

            //this._sendCommandLong(0, 0, 0, 0, 0, 0, 0, 410, 1);
            this.requestMessage(242);
            //this._homePositionSubscribers = [];
        });
    }

    // MAV_CMD_REQUEST_MESSAGE 512 1: messageID
    // Please get messageId from official mavlink documentation:
    // https://mavlink.io/en/messages/common.html#mavlink-messages
    requestMessage(messageId) {
        this._sendCommandLong(messageId, 0, 0, 0, 0, 0, 0, 512, 1);
    }

    sendInterval() {
        this._mavlinkObject.createMessage("REQUEST_DATA_STREAM",
        { 
            'req_stream_id': 6,
            'req_message_rate': 0x05,
            'start_stop': 1,
            'target_system': 1,
            'target_component': 1
        },
        (message) => {
            this._mavport.write(message.buffer);
        });
    }

    _sendCommandLong(param1, param2, param3, param4, param5, param6, param7, command, confirmation) {
        this._mavlinkObject.createMessage("COMMAND_LONG",
        { 
            'param1': param1,
            'param2': param2,
            'param3': param3,
            'param4': param4,
            'param5': param5,
            'param6': param6,
            'param7': param7,
            'command': command,
            'target_system': 1,
            'target_component': 1,
            'confirmation': confirmation
        },
        (message) => {
            this._mavport.write(message.buffer);
        });
    }

    //SET_POSITION_TARGET_GLOBAL_INT 86
    _set_position_target_global_int(change_pos, change_alt, lat, lng, alt) {
        let type_mask = 65472;
        if(change_pos && change_alt)
        {
            //type_mask -= 7;
        }
        if(change_pos) {
            //type_mask -= 3;
        }
        if(change_alt) {
            //type_mask -= 4;
        }
        console.log("MASK: ", type_mask, lat, lng, alt);
        this._mavlinkObject.createMessage(86,
        { 
            'time_boot_ms': 0,
            'target_system': 1,
            'target_component': 0,
            'coordinate_frame': 6, // MAV_FRAME_GLOBAL_RELATIVE_ALT_INT
            'type_mask': 3576, //0b110111111000, //3576
            'alt': alt,
            'lat_int': lat * 1e7,
            'lon_int': lng * 1e7,
            'vx': 0,
            'vy': 0,
            'vz': 0,
            'afx': 0,
            'afy': 0,
            'afz': 0,
            'yaw': 0,
            'yaw_rate': 0,
        },
        (message) => {
            this._mavport.write(message.buffer);
        });
    }
}
const mavlink = require('mavlink');
const SerialPort = require('serialport');

module.exports = class MavlinkClient {

    constructor(serialPort, baudRate = 57600, groundStationId=0, deviceId=0) {
        this._mavlinkObject = new mavlink(groundStationId, deviceId);
        this._gpsSubscribers = [];
        this._attitudeSubscribers = [];
        this._heartbeatSubscribers = [];
        this._prearmSubscribers = [];

        this._mavport = new SerialPort(serialPort, { baudRate: baudRate, autoOpen: true });
        
        this._mavlinkObject.on("ready", () => {
            console.log("Mavlink for serial port " + serialPort + " is ready");
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
                this._heartbeatSubscribers.forEach(subscriber => {
                    subscriber(fields);
                });
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

            //listen for GPS messages
            this._mavlinkObject.on("GPS_RAW_INT", (message, fields) => {
                this._gpsSubscribers.forEach(subscriber => {
                    subscriber(fields);
                });
            });
        }); 
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

    armCopter() {
        //MAV_CMD_COMPONENT_ARM_DISARM  400
        //1: 0 - disarm, 1 - arm
        this.sendCommandLong(1, 0, 0, 0, 0, 0, 0, 400, 1, 1, 1); 
    }

    disarmCopter() {
        //MAV_CMD_COMPONENT_ARM_DISARM  400
        //1: 0 - disarm, 1 - arm
        this.sendCommandLong(0, 0, 0, 0, 0, 0, 0, 400, 1, 1, 1);        
    }

    rebootSystems(autopilot, computer) {
        //MAV_CMD_PREFLIGHT_REBOOT_SHUTDOWN  246
        //1: 0: Do nothing for autopilot, 1: Reboot autopilot, 2: Shutdown autopilot, 3: Reboot autopilot and keep it in the bootloader until upgraded.
        //2: 0: Do nothing for onboard computer, 1: Reboot onboard computer, 2: Shutdown onboard computer, 3: Reboot onboard computer and keep it in the bootloader until upgraded.
        this.sendCommandLong(1, 1, 0, 0, 0, 0, 0, 246, 1, 1, 1);        
    }

    takeOff(altitude) {
        this.sendCommandLong(0, 0, 0, 0, 0, 0, altitude, 22, 1);
    }

    land(lat, lng, alt) {
        this.sendCommandLong(0, 0, 0, 0, lat, lng, alt, 21, 1);
    }

    navToWaypoint(holdTime = 0, radius = 1, lat, lng, alt) {
        this.sendCommandLong(holdTime, radius, 0, 0, lat, lng, alt, 16, 1);
    }

    sendCommandLong(param1, param2, param3, param4, param5, param6, param7, command, confirmation) {
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
}
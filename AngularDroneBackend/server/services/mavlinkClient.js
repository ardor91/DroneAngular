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
                //io.emit('gpstest', {lat: (fields.lat / 10000000), lng: (fields.lon / 10000000), angle: 60}); //524812088
                //console.log(message.payload.toString());
                //console.log(message.buffer.toString());
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
        this._mavlinkObject.createMessage("COMMAND_LONG",
        { 
            //MAV_CMD_DO_SET_MODE 176
            //MAV_MODE_GUIDED_ARMED 216
            'param1': 1,
            'param2': 0,
            'param3': 0,
            'param4': 0,
            'param5': 0,
            'param6': 0,
            'param7': 0,
            'command': 400,
            'target_system': 1,
            'target_component': 1,
            'confirmation': 1
        },
        (message) => {
            this._mavport.write(message.buffer);
        });
    }

    disarmCopter() {
        this._mavlinkObject.createMessage("COMMAND_LONG",
        { 
            //MAV_CMD_DO_SET_MODE 176
            //MAV_MODE_GUIDED_ARMED 216
            'param1': 0,
            'param2': 0,
            'param3': 0,
            'param4': 0,
            'param5': 0,
            'param6': 0,
            'param7': 0,
            'command': 400,
            'target_system': 1,
            'target_component': 1,
            'confirmation': 1
        },
        (message) => {
            this._mavport.write(message.buffer);
        });
    }

    rebootSystems(autopilot, computer) {
        this._mavlinkObject.createMessage("COMMAND_LONG",
        { 
            //MAV_CMD_PREFLIGHT_REBOOT_SHUTDOWN  246
            //1: 0: Do nothing for autopilot, 1: Reboot autopilot, 2: Shutdown autopilot, 3: Reboot autopilot and keep it in the bootloader until upgraded.
            //2: 0: Do nothing for onboard computer, 1: Reboot onboard computer, 2: Shutdown onboard computer, 3: Reboot onboard computer and keep it in the bootloader until upgraded.
            'param1': 1,
            'param2': 1,
            'param3': 0,
            'param4': 0,
            'param5': 0,
            'param6': 0,
            'param7': 0,
            'command': 246,
            'target_system': 1,
            'target_component': 1,
            'confirmation': 1
        },
        (message) => {
            this._mavport.write(message.buffer);
      });
    }
}
const mavlink = require('mavlink');
const SerialPort = require('serialport');

module.exports = class MavlinkClient {

    constructor(serialPort, baudRate = 57600, groundStationId=0, deviceId=0) {
        this._mavlinkObject = new mavlink(groundStationId, deviceId);
        this._gpsSubscribers = [];
        this._attitudeSubscribers = [];

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

    armCopter() {
        this._mavlinkObject.createMessage("COMMAND_LONG",
        { 
            //MAV_CMD_DO_SET_MODE 176
            //MAV_MODE_GUIDED_ARMED 216
            'param1': 216,
            'command': 176,
            'target_system': 1,
            'target_component': 1,
            'confirmation': 1
        });
    }
}
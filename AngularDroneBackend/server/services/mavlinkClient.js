const mavlink = require('mavlink');
const SerialPort = require('serialport');

class MavlinkClient {
    constructor(serialPort, baudRate = 57600, groundStationId=0, deviceId=0) {
        this.mavlinkObject = new mavlink(groundStationId, deviceId);
        this._gpsSubscribers = [];
        this._attitudeSubscribers = [];

        let mavport = new SerialPort(serialPort, { baudRate: baudRate, autoOpen: true });
        Promise((resolve, reject ) => {
            this.mavlinkObject.on("ready", () => {
                console.log("Mavlink for serial port " + serialPort + " is ready");
                mavport.on('data', function(data) {
                    mavlinkObject.parse(data);
                });
                resolve();
            });
        }).then(() => {
            //listen for Attitude change messages
            mavlinkObject.on("ATTITUDE", function(message, fields) {
                // console.log("Attitude Parsed message: ", fields);
                this._attitudeSubscribers.forEach(subscriber => {
                    subscriber(fields);
                });
            });

            //listen for GPS messages
            mavlinkObject.on("GPS_RAW_INT", function(message, fields) {
                console.log("GPS Parsed message: ", fields);
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
}

module.exports.MavlinkClient;
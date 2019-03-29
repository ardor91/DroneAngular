const express = require('express');
const router = express.Router();
const MavlinkClient = require('../services/mavlinkClient');

//import { MavlinkClient } from '../services/mavlinkClient'

let firstClient = new MavlinkClient('/dev/tty.usbmodem14201', 115200);

let latestAttitudeState = null;
let latestGpsState = null;

firstClient.subscribeToAttitude((data) => {
    latestAttitudeState = data;    
})
firstClient.subscribeToGps((data) => {
    latestGpsState = data;
})

router.get('/currentAttitudeState', (req, res) => {
    res.send(latestAttitudeState);
});

module.exports = router;
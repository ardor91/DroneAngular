const express = require('express');
const router = express.Router();
const MavLinkClient = require('../services/mavlinkClient');

//import { MavlinkClient } from '../services/mavlinkClient'

let firstClient = new MavlinkClient('usbmodem14201', 115200);

let latestAttitudeState = null;
let latestGpsState = null;

firstClient.subscribeToAttitude((data) => {
    console.log('Attitude changed, its message from subscriber:', data);
    latestAttitudeState = data;
})
firstClient.subscribeToGps((data) => {
    latestGpsState = data;
})

router.get('/currentAttitudeState', (req, res) => {
    res.send(latestAttitudeState);
});
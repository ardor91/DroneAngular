// Get dependencies
const express = require('express');
const path = require('path');
const http = require('http');
const bodyParser = require('body-parser');
//const io = require('socket.io')(http);

// Get our API routes
const api = require('./server/routes/api');

const app = express();
/*var cors = require('cors');

let whitelist = ['http://localhost:4200','http://localhost:80'];
        let corsOptions = {
            origin: (origin, callback)=>{
                if (whitelist.indexOf(origin) !== -1) {
                    callback(null, true)
                } else {
                    callback(new Error('Not allowed by CORS'))
                }
            },credentials: true
        }
        app.use(cors(corsOptions));
*/
//app.use(cors());

/*app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://localhost:4200");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  //res.header("Access-Control-Allow-Credentials", "true");
  next();
});*/

// Parsers for POST data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Point static path to dist
const pathToWeb = path.join(__dirname, '/../AngularDroneWebApp/dist/webApp');
console.log("DIRNAME: ",);
app.use(express.static(pathToWeb));

// Set our api routes
app.use('/api', api);

// Catch all other routes and return the index file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '/../AngularDroneWebApp/dist/webApp/index.html'));
});

/**
 * Get port from environment and store in Express.
 */
const httpport = process.env.PORT || '3000';
app.set('port', httpport);

/**
 * Create HTTP server.
 */
const server = http.createServer(app);

/*io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
  socket.on('chat message', function(msg){
      console.log(msg);
    io.emit('chat message', msg);
  });
});*/

/*SerialPort.list().then(
  ports => ports.forEach(console.log),
  err => console.error(err)
)

const port = new SerialPort('COM15', {baudRate: 9600, autoOpen: false})
port.open(function (err) {
    if (err) {
      return console.log('Error opening port: ', err.message)
    }
    console.log("port opened");

  })

*/

/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(httpport, () => console.log(`API running on localhost:${httpport}`));
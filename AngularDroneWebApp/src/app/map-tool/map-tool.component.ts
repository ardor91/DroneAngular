import { Component, AfterViewInit } from '@angular/core';
import { MapLoaderService } from './map.loader'
import { PathLogic } from '../../shared/utilities/PathLogic'
import { SocketService } from 'src/app/socket.service';
import { ApiService } from 'src/app/api.service';
import { MavEnumsService } from 'src/app/map-tool/mav-enum.service';
import { MatSnackBar } from '@angular/material';
import { MatDialog } from '@angular/material';
import { SelectPointDialogComponent } from './select-point-dialog/select-point-dialog.component';
import { loadDroneOverlay } from './drone.overlay';

declare var google: any;

@Component({
  selector: 'app-map-tool',
  templateUrl: './map-tool.component.html',
  styleUrls: ['./map-tool.component.css']
})
export class MapToolComponent implements AfterViewInit {
  roll:number = 0;
  pitch:number = 0;
  yaw:number = 0;

  map: any;
  drawingManager: any;
  lastPolygon: any;

  availablePorts: any;
  selectedPort: string;
  selectedBaud: string;
  selectedAltitude: string;

  prevGpsPoint: any;
  prevPath: Array<any>;

  image = 'src/assets/images/drone.png';
  homePositionImage = 'src/assets/images/helipad.png';

  gridAngle: any;
  gridStep: any;
  droneOverlay: any;

  // sliders
  autoTicks = false;
  disabled = false;
  invert = false;
  max = 100;
  min = 0;
  showTicks = false;
  step = 1;
  thumbLabel = true;
  value = 0;
  vertical = false;

  heartbeat: any;
  attitude: any;
  prearm: any;
  home_position: any;

  flightPlan: Array<any>;
  lastPrearmIndex: number;

  preArmMessages: Array<PreArmMessage>;

  customHomePositionMarker: any;
  connected: any;
  isArmed: boolean;

  sandboxMode: any;
  sandboxCommand: any;
  sandboxCommandDef: CommandLongModel;
  commands: Array<CommandLongModel>;
  sandboxParam1: any;
  sandboxParam2: any;
  sandboxParam3: any;
  sandboxParam4: any;
  sandboxParam5: any;
  sandboxParam6: any;
  sandboxParam7: any;

  basePositionOverlay: any;
  lastHomePosition: any;
  gpsRaw: any;

  constructor(private socketService: SocketService, private apiService: ApiService, private snackBar: MatSnackBar, public dialog: MatDialog, public enumsService: MavEnumsService) {
  }

  ngAfterViewInit() {
    MapLoaderService.load().then(() => {
      this.initGoogleMap();

      let gpss = new google.maps.LatLng(52.461099646230515, 30.95373939121498);
      const DroneOverlayClass = loadDroneOverlay(google);
      this.droneOverlay = new DroneOverlayClass(gpss, this.image, this.map);
      this.basePositionOverlay = new DroneOverlayClass(gpss, this.homePositionImage, this.map, false, 1);      
    })
  }

  ngOnInit() {
    this.getPorts();
    this.preArmMessages = [];
    this.selectedAltitude = "0";

    this.socketService.mavlink_client_created.subscribe(data => {
      console.log(data);
      if(data.status == 0) {
        this.snackBar.open(data.message, null, {
          duration: 5000,
        });
      }
    });

    this.socketService.testcoord.subscribe(gps => { this.gpsRaw = gps; console.log("SIM RESPONSE: ", gps); this.moveDroneOverlay(gps); });
    this.socketService.heartbeat.subscribe(data => 
      {
        this.heartbeat = data; 
        this.isArmed = ((this.heartbeat.base_mode & 128) >> 7) == 1;
      }
    );
    this.socketService.prearm.subscribe(data => { this.prearm = data; this.managePrearmMessages(data); });
    this.socketService.attitude.subscribe(data => { this.changeAttitude(data); });
    this.socketService.home_position.subscribe(data => { this.home_position = data; });
    this.socketService.ack.subscribe(data => { this.showAckMessage(data); });
    this.socketService.copter_status.subscribe(data => { this.moveDroneOverlay(data) });
  }

  showAckMessage(data) {
    if(!data || !data.result) return;
    this.snackBar.open(this.enumsService.getCommandName(data.command) + " is " + this.enumsService.getAckMessage(data.result), null, {
      duration: 10000,
    });
  }

  requestPorts() {
    this.getPorts();
  }

  managePrearmMessages(data) {
    this.lastPrearmIndex++;
    let currTimestamp = Date.now() / 1000;
    this.preArmMessages.push({
      message: data.text,
      timestamp: currTimestamp
    });
    let tempArray = [];
    this.preArmMessages.forEach((message) => {
      if((currTimestamp - message.timestamp) < 25 && !this.isMessageExist(message)) {
        tempArray.push(message);
      }
    });
    this.preArmMessages = tempArray;
    
    setTimeout((lastPrearmIndex) => {
      if(this.lastPrearmIndex == lastPrearmIndex) {
        this.preArmMessages = [];
      }
    }, 15000);
  }

  isMessageExist(message) {
    this.preArmMessages.forEach((element) => {
      if(element.message == message.message)
        return true;
    })
    return false;
  }

  changeAttitude(data) {
    if(data) {
      this.roll = data.roll;
      this.yaw = data.yaw;
      this.pitch = data.pitch;
    }
  }

  stepChanged() {
    console.log(this.gridStep);
    this.drawPath();
  }

  angleChanged() {
    console.log(this.gridAngle);
    this.drawPath();
  }

  formatLabel(value: number | null) {
    if (!value) {
      return 0;
    }
    return value * 1000000;
  }

  openSnackBar(message: string, action: string) {
    this.snackBar.open(message, action, {
      duration: 10000,
    });
  }

  sendCommand() {
    this.socketService.sendCustomCommand(this.sandboxCommand, this.sandboxParam1, this.sandboxParam2, this.sandboxParam3, this.sandboxParam4, this.sandboxParam5, this.sandboxParam6, this.sandboxParam7);
  }

  sendMode() {
    this.socketService.sendCustomMode(this.sandboxMode);
  }

  startSimulation() {
    if (!this.flightPlan) { return; }
    this.socketService.sendFlightPlanSimulation(this.flightPlan);
  }

  startWork() {
    if (!this.flightPlan) { return; }
    this.socketService.sendFlightPlan(this.flightPlan);
  }

  armCopter(value) {
    this.socketService.armCopter(value);
  }

  reboot() {
    const dialogRef = this.dialog.open(SelectPointDialogComponent, {
      data: {
        title: "Confirm action",
        message: "Are you sure you want to reboot copter?",
        description: "Copter will crash immediately if it is in flight"
      }
    });

      dialogRef.afterClosed().subscribe(result => {
        this.socketService.rebootSystem();
      });    
  }

  setPosHold() {
    this.socketService.setPosHold();
  }

  takeoff() {
    this.socketService.takeoff(this.selectedAltitude);
  }

  rtl() {
    this.socketService.rtl();
  }

  land() {
    this.socketService.land({
      lat: null,
      lng: null,
      alt: 0
    });
  }

  getPorts(): void {
    this.apiService.getPorts()
        .subscribe(ports => {
          this.availablePorts = ports;
          console.log(ports);
        });
  }

  startListening(): void {
    console.log("Selected: ", this.selectedPort);
    this.apiService.startListening(this.selectedPort, this.selectedBaud).subscribe(() => {});
  }

  sendInterval() {
    this.socketService.sendInterval();
  }

  moveDroneOverlay(data) {
    if(!this.map) return;

    if(!this.prevGpsPoint) {
      this.prevGpsPoint = data;
      this.map.setOptions({
        center: new google.maps.LatLng(data.lat, data.lng)
      });
      return;
    }

    let polyline = [data, this.prevGpsPoint];

    let angle = 0;
    /*if(this.prevGpsPoint)
    {
      var prevP = new google.maps.LatLng(this.prevGpsPoint.lat, this.prevGpsPoint.lng);
      var currP = new google.maps.LatLng(data.lat, data.lng);
      //angle = google.maps.geometry.spherical.computeHeading(prevP, currP);
    }*/

    if(data.basePosition && (!this.lastHomePosition || this.lastHomePosition != data.basePosition))
    {
      this.lastHomePosition = data.basePosition;
      this.basePositionOverlay.setPosition({lat: data.basePosition.lat, lng: data.basePosition.lng}, 0);
    }
    
    this.droneOverlay.setPosition({lat: data.lat, lng: data.lng}, data.angle, data.batteryLevel, data.sprayLevel);
  }

  drawPath() {
    if(!this.lastPolygon) {
      return;
    }
    
    if(this.prevPath) {
      this.prevPath.forEach(element => {
        element.setMap(null);
      });
    }
    let array: Array<Point> = [];
    this.lastPolygon.forEach(element => {
      array.push({X: element.lat(), Y: element.lng()});
    });
    console.log(array);
    let pathUtility = new PathLogic();
    let splines = pathUtility.GetPathLinesFromPolygon(array, +this.gridAngle, +this.gridStep);
    console.log(splines);
    let coords = [];
    let order = true;
    this.prevPath = [];
    this.flightPlan = splines;
    splines.forEach(element => {
      coords = [];
      coords.push({lat: element.StartPoint.X, lng: element.StartPoint.Y});
      coords.push({lat: element.EndPoint.X, lng: element.EndPoint.Y});
      let flightPath = new google.maps.Polyline({
        path: coords,
        geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 2
      });
      flightPath.setMap(this.map);
      this.prevPath.push(flightPath);
    });
  }
  
  initGoogleMap() {
    this.map = new google.maps.Map(document.getElementById('map'), {
      center: { lat: 52.461099646230515, lng: 30.95373939121498 },
      zoom: 18,
      mapTypeId: 'satellite'
    });

    this.drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: '',
      drawingControl: true,
      drawingControlOptions: {
        position: google.maps.ControlPosition.TOP_CENTER,
        drawingModes: ['polygon', 'marker']
      }
    });

    this.drawingManager.setMap(this.map);
    let component = this;

    google.maps.event.addListener(this.drawingManager, 'markercomplete', (event) => {
      if(this.customHomePositionMarker) {
        this.customHomePositionMarker.setMap(null);
      }
      this.customHomePositionMarker = event;

      this.socketService.setHome(event.position);
    });

    google.maps.event.addListener(this.drawingManager, 'polygoncomplete', (event) => {
      // Polygon drawn
      google.maps.event.addListener(event.getPath(), 'set_at', function() {
        component.drawPath();
      });
      google.maps.event.addListener(event.getPath(), 'insert_at', function() {
        component.drawPath();
      });
      google.maps.event.addListener(event.getPath(), 'remove_at', function() {
        if (event.getPath().length > 2) {
          component.drawPath();
        }
      });
    });

    this.map.addListener('click', function(e) {
      console.log('Map clicked at ', e.latLng.lat(), e.latLng.lng());

      const dialogRef = component.dialog.open(SelectPointDialogComponent, {
        data: {
          title: "Confirm action",
          message: "Are you want to send copter to this point?",
          description: ""
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        component.socketService.setNewPosition({lat: e.latLng.lat(), lng: e.latLng.lng()});
        console.log(`Dialog result: ${result}`);
      });
    });

    google.maps.event.addListener(this.drawingManager, 'overlaycomplete', (event) => {
      if (event.type === google.maps.drawing.OverlayType.POLYGON) {
        // this is the coordinate, you can assign it to a variable or pass into another function.
        this.lastPolygon = event.overlay.getPath().getArray();
        event.overlay.setOptions({
          editable: true,
          zIndex: 0,
          fillOpacity: 0.0,
        });
        this.droneOverlay.setMap(null);
        this.droneOverlay.setMap(component.map);
        google.maps.event.addListener(event.overlay, 'dblclick', (function(vertex) {
          console.log(vertex);
          if (event.overlay.getPath().length > 3) {
            event.overlay.getPath().removeAt(vertex.vertex);
          }
        }));
      }
    });
  }

  getCommandDef() {
    this.sandboxCommandDef = this.enumsService.getCommandDef(this.sandboxCommand);
  }

  getSystemStatus(value) {
    return this.enumsService.getSystemStatus(value);
  }

  getMavType(value) {
    return this.enumsService.getMavType(value);
  }

  getCustomMode(value) {
    return this.enumsService.getCustomMode(value);
  }
}
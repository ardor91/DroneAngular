import { Component, AfterViewInit } from '@angular/core';
import { MapLoaderService } from './map.loader'
import { PathLogic } from '../../shared/utilities/PathLogic'
import { Observable, Subscription } from 'rxjs';
import { SocketService } from 'src/app/socket.service';
import { ApiService } from 'src/app/api.service';

declare var google: any;

@Component({
  selector: 'app-map-tool',
  templateUrl: './map-tool.component.html',
  styleUrls: ['./map-tool.component.css']
})
export class MapToolComponent implements AfterViewInit {
  map: any;
  drawingManager: any;
  lastPolygon: any;

  availablePorts: any;
  selectedPort: string;
  newGps: string;

  prevPoint: any;

  private _gpsSub: Subscription;

  constructor(private socketService: SocketService, private apiService: ApiService) {
  }

  ngAfterViewInit() {
    MapLoaderService.load().then(() => {
      this.drawPolygon();
    })
  }

  ngOnInit() {
    this.getPorts();
  }
 
  getPorts(): void {
    this.apiService.getPorts()
        .subscribe(ports => {
          this.availablePorts = ports;
          console.log(ports);
        });
  }

  refreshPorts(): void {
    this.getPorts();
  }

  startListening(): void {
    console.log("Selected: ", this.selectedPort);
    this.apiService.startListening(this.selectedPort).subscribe(result => {
      console.log("START LISTENING RESULT: " + result);
      this._gpsSub = this.socketService.newcoordinate.subscribe(gps => {this.newGps = gps; console.log("NEW GPS: ", this.newGps); this.drawReceivedFromSerial(this.newGps)});
    });
  }

  drawReceivedFromSerial(gps) {

    console.log("Parsed0: ", gps);
    gps = gps.substr(1);
    console.log("Parsed1: ", gps);
    gps = gps.substr(0, gps.length - 2);
    console.log("Parsed2: ", gps);
    gps = gps.split(";");
    console.log("Parsed3: ", gps);
    gps = {lat: +gps[0], lng: +gps[1]};
    console.log("Parsed4: ", gps);
    var flightPlanCoordinates = [
      {lat: 52.461099646230515, lng: 30.95373939121498},
      {lat: 52.462099646230515, lng: 30.97373939121498},
      {lat: 52.464099646230515, lng: 30.99373939121498},
      {lat: 52.465099646230515, lng: 30.91373939121498}
    ];
    if(this.prevPoint)
      this.prevPoint.setMap(null);
    this.prevPoint = new google.maps.Circle({
      strokeColor: '#FF0000',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#FF0000',
      fillOpacity: 0.35,
      map: this.map,
      center: {lat: gps.lat, lng: gps.lng},
      radius: 10
    });
  }

  splitSomething() {
    let array: Array<Point> = [];
    let point1: Point = { X: 10, Y: 10};
    let point2: Point = { X: 10, Y: -10};
    let point3: Point = { X: -10, Y: -10};
    let point4: Point = { X: -10, Y: 10};

    array.push(point1);
    array.push(point2);
    array.push(point3);
    array.push(point4);

    let pathUtility = new PathLogic();
    let splines = pathUtility.GetPathLinesFromPolygon(array, 45, 2);
    console.log(splines);
  }

  drawCCCC() {
    //console.log(this.lastPolygon);
    let array: Array<Point> = [];
    this.lastPolygon.forEach(element => {
      //console.log(element.lat(), element.lng());
      array.push({X: element.lat(), Y: element.lng()});
    });
    console.log(array);
    let pathUtility = new PathLogic();
    let splines = pathUtility.GetPathLinesFromPolygon(array, 45, 0.001);
    console.log(splines);
    let coords = [];
    let order = true;
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
      
    });
    

    
  }

  drawAAAA() {
    var flightPlanCoordinates = [
      {lat: 52.461099646230515, lng: 30.95373939121498},
      {lat: 52.462099646230515, lng: 30.97373939121498},
      {lat: 52.464099646230515, lng: 30.99373939121498},
      {lat: 52.465099646230515, lng: 30.91373939121498}
    ];
    var flightPath = new google.maps.Polyline({
      path: flightPlanCoordinates,
      geodesic: true,
      strokeColor: '#FF0000',
      strokeOpacity: 1.0,
      strokeWeight: 2
    });

    flightPath.setMap(this.map);
  }
  
  drawPolygon() {
    this.map = new google.maps.Map(document.getElementById('map'), {
      center: { lat: 52.461099646230515, lng: 30.95373939121498 },
      zoom: 16
    });

    this.drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: google.maps.drawing.OverlayType.POLYGON,
      drawingControl: true,
      drawingControlOptions: {
        position: google.maps.ControlPosition.TOP_CENTER,
        drawingModes: ['polygon']
      }
    });

    this.drawingManager.setMap(this.map);
    google.maps.event.addListener(this.drawingManager, 'overlaycomplete', (event) => {
      // Polygon drawn
      if (event.type === google.maps.drawing.OverlayType.POLYGON) {
        //this is the coordinate, you can assign it to a variable or pass into another function.
        this.lastPolygon = event.overlay.getPath().getArray();
      }
    });
  }
}

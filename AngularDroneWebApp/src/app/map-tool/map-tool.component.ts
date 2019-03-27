import { Component, AfterViewInit } from '@angular/core';
import { MapLoaderService } from './map.loader'
import { PathLogic } from '../../shared/utilities/PathLogic'
import { Observable, Subscription } from 'rxjs';
import { SocketService } from 'src/app/socket.service';
import { ApiService } from 'src/app/api.service';
import { isObject } from 'util';

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
  newGps2: string;

  prevPoint: any;
  pointsArray: Array<any>;

  private _gpsSub: Subscription;
  private _gpsSub2: Subscription;

  prevGpsPoint: any;
  prevPath: Array<any>;

  image = require('src/assets/images/drone.png');
  USGSOverlay: any;
  droneOverlay: any;

  gridAngle: any;
  gridStep: any;

  //sliders
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

  flightPlan: Array<any>;

  constructor(private socketService: SocketService, private apiService: ApiService) {
  }

  ngAfterViewInit() {
    MapLoaderService.load().then(() => {
      this.drawPolygon();
      this.test();
      let gpss = new google.maps.LatLng(52.461099646230515, 30.95373939121498);

      this.droneOverlay = new this.USGSOverlay(gpss, this.image, this.map);
    })
  }

  ngOnInit() {
    this.getPorts();
    this.pointsArray = [];

    this._gpsSub2 = this.socketService.testcoord.subscribe(gps => {this.newGps2 = gps; this.drawAngledArrow(this.newGps2)});

    
  }

  stepChanged() {
    console.log(this.gridStep);
    this.drawCCCC();
  }

  angleChanged() {
    console.log(this.gridAngle);
    this.drawCCCC();
  }

  formatLabel(value: number | null) {
    if (!value) {
      return 0;
    }

    

    return value * 1000000;
  }


  startWork() {
    if(!this.flightPlan) return;
    this.socketService.sendFlightPlan(this.flightPlan);
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
      this._gpsSub = this.socketService.newcoordinate.subscribe(gps => {this.newGps = gps;  this.drawReceivedFromSerial(this.newGps)});
    });
  }

  drawAngledArrow(gps) {
    if(!this.map) return;
    /*let lineSymbol = {
      path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
      scaledSize: new google.maps.Size(200, 200),
    };*/

    console.log(gps);

    if(!this.prevGpsPoint) {
      this.prevGpsPoint = gps;
      this.map.setOptions({
        center: new google.maps.LatLng(gps.lat, gps.lng)
      });
      return;
    }

    let polyline = [gps, this.prevGpsPoint];
    console.log(polyline);
    /*let point = new google.maps.Polyline({
      path: polyline,
      strokeColor: '#FF0000',
      strokeOpacity: 0.70001,
      strokeWeight: 2,
      map: this.map,
      icons: [{
        icon: lineSymbol,
        offset: '100%'
      }],
    });*/

    this.droneOverlay.setPosition({lat: gps.lat, lng: gps.lng}, gps.angle);

    if(this.prevPoint)
      this.prevPoint.setMap(null);
    //this.prevPoint = point;

    this.prevGpsPoint = gps;
  }

  changeSettings() {
    console.log(this.gridStep, this.gridAngle);
  }

  drawReceivedFromSerial(gps) {
    var lineSymbol = {
      path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW
    };
    var flightPlanCoordinates = [
      {lat: 52.461099646230515, lng: 30.95373939121498},
      {lat: 52.462099646230515, lng: 30.97373939121498},
      {lat: 52.464099646230515, lng: 30.99373939121498},
      {lat: 52.465099646230515, lng: 30.91373939121498}
    ];
    /*if(this.prevPoint)
      this.prevPoint.setMap(null);*/
    
    var point = new google.maps.Polyline({
      path: flightPlanCoordinates,
      strokeColor: '#FF0000',
      strokeOpacity: 0.00001,
      strokeWeight: 0,
      map: this.map
    });

    if(this.prevPoint) {
      this.prevPoint.setOptions({
        fillColor: '#222222',
        strokeColor: '#444444'
      });
    }
      //this.prevPoint.fillColor = '#222222';
    this.pointsArray.splice(0, 0, point);
    this.prevPoint = point;
    console.log(this.pointsArray);
    if(this.pointsArray.length > 50)
    {
      let oldestPoint = this.pointsArray.pop();
      console.log("oldest: ", oldestPoint);
      oldestPoint.setMap(null);
    }


    
console.log("OLOLO: ", this.prevPoint.center);
    // Create the polyline and add the symbol via the 'icons' property.
    var line = new google.maps.Polyline({
      path: [{lat: this.prevPoint.center.lat, lng: this.prevPoint.center.lng}, {lat: gps.lat, lng: gps.lng}],
      icons: [{
        icon: lineSymbol,
        offset: '100%'
      }],
      map: this.map
    });

    this.prevGpsPoint = gps;
  }

  drawCCCC() {
    if(!this.lastPolygon) {
      return;
    }
    
    if(this.prevPath) {
      this.prevPath.forEach(element => {
        element.setMap(null);
      });
    }
    //console.log(this.lastPolygon);
    let array: Array<Point> = [];
    this.lastPolygon.forEach(element => {
      //console.log(element.lat(), element.lng());
      array.push({X: element.lat(), Y: element.lng()});
    });
    console.log(array);
    let pathUtility = new PathLogic();
    console.log("ebat, ", this.gridAngle, this.gridStep);
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
    let component = this;
    google.maps.event.addListener(this.drawingManager, 'polygoncomplete', (event) => {
      
      // Polygon drawn
      console.log("POLYGON FIRED");
      google.maps.event.addListener(event.getPath(), 'set_at', function() {
        console.log('Vertex moved');
        component.drawCCCC();
      });
      google.maps.event.addListener(event.getPath(), 'insert_at', function() {
        console.log('Vertex created.');
        component.drawCCCC();
      });
      google.maps.event.addListener(event.getPath(), 'remove_at', function() {
        console.log('Vertex created.');
        if(event.getPath().length > 2) {
          component.drawCCCC();
        }
        
      });

      
      
    });

    this.map.addListener('click', function(e) {
      console.log('Map clicked at ', e.latLng.lat(), e.latLng.lng());
      //component.droneOverlay.setPosition({lat: e.latLng.lat(), lng: e.latLng.lng()}, Math.floor(Math.random() * 360));
      component.socketService.setNewPosition({lat: e.latLng.lat(), lng: e.latLng.lng()});
    });

    google.maps.event.addListener(this.drawingManager, 'overlaycomplete', (event) => {
      if (event.type === google.maps.drawing.OverlayType.POLYGON) {
        //this is the coordinate, you can assign it to a variable or pass into another function.
        this.lastPolygon = event.overlay.getPath().getArray();
        event.overlay.setOptions({
          editable: true
        });

        google.maps.event.addListener(event.overlay, 'dblclick', (function(vertex) {
          console.log(vertex);
          if(event.overlay.getPath().length > 3) {
            event.overlay.getPath().removeAt(vertex.vertex);
          }
        }));
      }
    });


    /*var bounds = {
      north: 52.98,
      south: 50.99,
      east: 30.98,
      west: 30.96
    };

    var flightPlanCoordinates = [
      {lat: 52.461099646230515, lng: 30.95373939121498},
      {lat: 52.462099646230515, lng: 30.97373939121498},
      {lat: 52.464099646230515, lng: 30.99373939121498},
      {lat: 52.465099646230515, lng: 30.91373939121498}
    ];

    // Define the rectangle and set its editable property to true.
    let rectangle = new google.maps.Polyline({
      path: flightPlanCoordinates,
      editable: true,
      draggable: true
    });

    rectangle.setMap(this.map);

    // Add an event listener on the rectangle.
    rectangle.getPath().addListener('set_at', () => {console.log("Event fired");});*/
  }
test() {
  this.USGSOverlay = class extends (google.maps.OverlayView as { new():any}) {
    image_: any;
    map_: any;
    div_: any;
    rotation_: any;
    gpsPoint_: any;
    constructor(gps, image, private map) {
        super();
        // Initialize all properties.
        this.image_ = image;
        this.map_ = map;
        this.rotation_ = 0;
        this.gpsPoint_ = gps;
        // Define a property to hold the image's div. We'll
        // actually create this div upon receipt of the onAdd()
        // method so we'll leave it null for now.
        this.div_ = null;
        // Explicitly call setMap on this overlay.
        this.setMap(map);
        this.set
    }
    /**
     * onAdd is called when the map's panes are ready and the overlay has been
     * added to the map.
     */
    onAdd() {
        const div = document.createElement('div');
        div.style.borderStyle = 'none';
        div.style.borderWidth = '0px';
        div.style.position = 'absolute';
        // Create the img element and attach it to the div.
        const img = document.createElement('img');
        img.src = this.image_;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.position = 'absolute';
        div.appendChild(img);
        this.div_ = div;
        // Add the element to the "overlayLayer" pane.
        const panes = this.getPanes();
        panes.overlayLayer.appendChild(div);
    };
    draw() {
        // We use the south-west and north-east
        // coordinates of the overlay to peg it to the correct position and size.
        // To do this, we need to retrieve the projection from the overlay.
        const overlayProjection = this.getProjection();
        // Retrieve the south-west and north-east coordinates of this overlay
        // in LatLngs and convert them to pixel coordinates.
        // We'll use these coordinates to resize the div.
        const gp = overlayProjection.fromLatLngToDivPixel(this.gpsPoint_);
        // Resize the image's div to fit the indicated dimensions.
        const div = this.div_;
        div.style.left = (gp.x - 30) + 'px';
        div.style.top = (gp.y - 30) + 'px';
        div.style.width = '60px';
        div.style.height = '60px';
        div.style.transform = "rotate(" + this.rotation_ + "deg)";
    };
    setPosition(gps, angle) {
      this.gpsPoint_ = new google.maps.LatLng(gps.lat, gps.lng);
      this.rotation_ = angle;
      this.draw();
    }
    // The onRemove() method will be called automatically from the API if
    // we ever set the overlay's map property to 'null'.
    onRemove() {
        this.div_.parentNode.removeChild(this.div_);
        this.div_ = null;
    };
};
}
  
}

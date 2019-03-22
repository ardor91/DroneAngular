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
  newGps2: string;

  prevPoint: any;
  pointsArray: Array<any>;

  private _gpsSub: Subscription;
  private _gpsSub2: Subscription;

  prevGpsPoint: any;
  prevPath: Array<any>;
  

  constructor(private socketService: SocketService, private apiService: ApiService) {
  }

  ngAfterViewInit() {
    MapLoaderService.load().then(() => {
      this.drawPolygon();
    })
  }

  ngOnInit() {
    this.getPorts();
    this.pointsArray = [];

    this._gpsSub2 = this.socketService.testcoord.subscribe(gps => {this.newGps2 = gps; console.log("NEW GPS: ", this.newGps2); this.drawAngledArrow(this.newGps2)});
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

  drawAngledArrow(gps) {
    let lineSymbol = {
      path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
      scaledSize: new google.maps.Size(200, 200),
    };

    if(!this.prevGpsPoint) {
      this.prevGpsPoint = gps;
      this.map.setOptions({
        center: gps
      });
      return;
    }

    let polyline = [gps, this.prevGpsPoint];
    console.log(polyline);
    let point = new google.maps.Polyline({
      path: polyline,
      strokeColor: '#FF0000',
      strokeOpacity: 0.70001,
      strokeWeight: 2,
      map: this.map,
      icons: [{
        icon: lineSymbol,
        offset: '100%'
      }],
    });


    let contentString = '<div id="content">'+
    '<div id="siteNotice">'+
    '</div>'+
    '<h1 id="firstHeading" class="firstHeading">Uluru</h1>'+
    '<div id="bodyContent">'+
    '<p><b>Uluru</b>, also referred to as <b>Ayers Rock</b>, is a large ' +
    'sandstone rock formation in the southern part of the '+
    'Northern Territory, central Australia. It lies 335&#160;km (208&#160;mi) '+
    'south west of the nearest large town, Alice Springs; 450&#160;km '+
    '(280&#160;mi) by road. Kata Tjuta and Uluru are the two major '+
    'features of the Uluru - Kata Tjuta National Park. Uluru is '+
    'sacred to the Pitjantjatjara and Yankunytjatjara, the '+
    'Aboriginal people of the area. It has many springs, waterholes, '+
    'rock caves and ancient paintings. Uluru is listed as a World '+
    'Heritage Site.</p>'+
    '<p>Attribution: Uluru, <a href="https://en.wikipedia.org/w/index.php?title=Uluru&oldid=297882194">'+
    'https://en.wikipedia.org/w/index.php?title=Uluru</a> '+
    '(last visited June 22, 2009).</p>'+
    '</div>'+
    '</div>';

var infowindow = new google.maps.InfoWindow({
  content: contentString
});

point.addListener('click', function() {
  infowindow.open(this.map, point);
});



    if(this.prevPoint)
      this.prevPoint.setMap(null);
    this.prevPoint = point;

    this.prevGpsPoint = gps;
  }

  drawReceivedFromSerial(gps) {
    var lineSymbol = {
      path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW
    };
    /*console.log("Parsed0: ", gps);
    gps = gps.substr(1);
    console.log("Parsed1: ", gps);
    gps = gps.substr(0, gps.length - 2);
    console.log("Parsed2: ", gps);
    gps = gps.split(";");
    console.log("Parsed3: ", gps);
    gps = {lat: +gps[0], lng: +gps[1]};
    console.log("Parsed4: ", gps);*/
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

    /*let point = new google.maps.Circle({
      strokeColor: '#FF0000',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#FF0000',
      fillOpacity: 0.35,
      map: this.map,
      center: {lat: gps.lat, lng: gps.lng},
      radius: 1
    });*/
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
    let splines = pathUtility.GetPathLinesFromPolygon(array, 45, 0.001);
    console.log(splines);
    let coords = [];
    let order = true;
    this.prevPath = [];
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
}

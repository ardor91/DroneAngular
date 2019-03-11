import { Component, AfterViewInit } from '@angular/core';
import { MapLoaderService } from './map.loader'
import { PathLogic } from '../../shared/utilities/PathLogic'
import { Observable, Subscription } from 'rxjs';
import { SocketService } from 'src/app/socket.service';

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

  constructor(private socketService: SocketService) {
  }

  ngAfterViewInit() {
    MapLoaderService.load().then(() => {
      this.drawPolygon();
    })
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

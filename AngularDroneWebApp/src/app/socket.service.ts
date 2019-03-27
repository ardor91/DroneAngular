import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';

@Injectable({
  providedIn: 'root'
})
export class SocketService {

  newcoordinate = this.socket.fromEvent<string>('newcoordinate');

  testcoord = this.socket.fromEvent<string>('gpstest');

  constructor(private socket: Socket) { }

  setNewPosition(gps) {
    this.socket.emit('newposition', gps);
  }

  sendFlightPlan(plan) {
    this.socket.emit('flightplan', plan);
  }
}

import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';

@Injectable({
  providedIn: 'root'
})
export class SocketService {

  newcoordinate = this.socket.fromEvent<string>('newcoordinate');

  testcoord = this.socket.fromEvent<string>('gpstest');

  heartbeat = this.socket.fromEvent<string>('heartbeat');

  prearm = this.socket.fromEvent<string>('prearm');

  attitude = this.socket.fromEvent<string>('attitude');

  constructor(private socket: Socket) { }

  setNewPosition(gps) {
    this.socket.emit('newposition', gps);
  }

  sendFlightPlan(plan) {
    this.socket.emit('flightplan', plan);
  }

  armCopter() {
    this.socket.emit('armCopter', 1);
  }

  rebootSystem() {
    this.socket.emit('rebootSystem', 1);
  }
}

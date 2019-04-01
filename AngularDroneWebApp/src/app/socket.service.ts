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

  home_position = this.socket.fromEvent<string>('homeposition')

  mavlink_client_created = this.socket.fromEvent<any>('mavlink_client_created');

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

  setHome(gps) {
    this.socket.emit('setHome', gps);
  }
}

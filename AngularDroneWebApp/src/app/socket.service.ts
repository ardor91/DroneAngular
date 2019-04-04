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
  ack = this.socket.fromEvent<any>('ack');
  copter_status = this.socket.fromEvent<string>('copter_status');

  constructor(private socket: Socket) { }

  setNewPosition(gps) {
    this.socket.emit('newposition', gps);
  }

  sendFlightPlanSimulation(plan) {
    this.socket.emit('flightplansimulation', plan);
  }

  sendFlightPlan(plan) {
    this.socket.emit('flightplan', plan);
  }

  armCopter(value) {
    this.socket.emit('armCopter', value);
  }

  takeoff(altitude) {
    this.socket.emit('takeoff', altitude);
  }

  setHome(gps) {
    this.socket.emit('setHome', gps);
  }

  setPosHold() {
    this.socket.emit('setModePosHold');
  }

  rtl() {
    this.socket.emit('setModeRtl');
  }

  land(gps) {
    this.socket.emit('land', gps);
  }

  rebootSystem() {
    this.socket.emit('rebootSystem', 1);
  }

  sendCustomMode(modeID) {
    this.socket.emit('custom_mode', modeID);
  }

  sendCustomCommand(id, p1, p2, p3, p4, p5, p6, p7) {
    console.log(id, p1, p2, p3, p4, p5, p6, p7);
    this.socket.emit('custom_command', 
    {
      id: id, 
      param1: !p1 ? 0 : p1,
      param2: !p2 ? 0 : p2,
      param3: !p3 ? 0 : p3,
      param4: !p4 ? 0 : p4,
      param5: !p5 ? 0 : p5,
      param6: !p6 ? 0 : p6,
      param7: !p7 ? 0 : p7 
    })
  }
  
}

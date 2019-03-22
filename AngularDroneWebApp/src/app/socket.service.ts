import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';

@Injectable({
  providedIn: 'root'
})
export class SocketService {

  newcoordinate = this.socket.fromEvent<string>('newcoordinate');

  testcoord = this.socket.fromEvent<string>('gpstest');

  constructor(private socket: Socket) { }
}

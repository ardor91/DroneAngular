import { AttitudeService } from './attitude.service';
import { Component, OnInit, OnChanges, Input } from '@angular/core';

@Component({
  selector: 'app-attitude',
  templateUrl: './attitude.component.html',
  styleUrls: ['./attitude.component.css']
})
export class AttitudeComponent implements OnInit,  OnChanges {
  @Input() roll: number;
  @Input() pitch: number;
  @Input() yaw: number;

  private canEleId = 'renderCanvas';

  constructor(private attServ: AttitudeService) { }

  ngOnInit() {
    this.attServ.createScene(this.canEleId);
    this.attServ.animate();
  }

  ngOnChanges() {
    //console.log(this.roll, this.pitch, this.yaw);
    this.attServ.rotateCamera(this.roll, this.pitch, this.yaw);
  }

}

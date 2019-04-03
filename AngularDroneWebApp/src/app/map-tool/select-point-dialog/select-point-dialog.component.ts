import { Component, OnInit, Inject } from '@angular/core';
import {MAT_DIALOG_DATA} from '@angular/material';

@Component({
  selector: 'app-select-point-dialog',
  templateUrl: './select-point-dialog.component.html',
  styleUrls: ['./select-point-dialog.component.css']
})
export class SelectPointDialogComponent implements OnInit {

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit() {
  }
}

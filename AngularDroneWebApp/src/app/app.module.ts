import 'hammerjs';
import { BrowserModule, HAMMER_GESTURE_CONFIG } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GestureConfig } from '@angular/material';

import { AppComponent } from './app.component';
import { MapToolComponent } from './map-tool/map-tool.component';
import { TopMenuComponent } from './top-menu/top-menu.component';
import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';
import {HttpClientModule} from '@angular/common/http';

import {MatSelectModule} from '@angular/material/select';
import {MatButtonModule} from '@angular/material/button';
import {MatSliderModule} from '@angular/material/slider';
import {MatCardModule} from '@angular/material/card';
import {MatDividerModule} from '@angular/material/divider';
import {MatListModule} from '@angular/material/list';
import {MatSnackBarModule} from '@angular/material/snack-bar';

const config: SocketIoConfig = { url: 'http://localhost:4444', options: {} };

@NgModule({
  declarations: [
    AppComponent,
    MapToolComponent,
    TopMenuComponent
  ],
  imports: [
    BrowserAnimationsModule,
    BrowserModule,
    
    FormsModule,
    MatSelectModule,
    HttpClientModule,
    MatButtonModule,
    MatSliderModule,
    MatCardModule,
    MatDividerModule,
    MatListModule,
    MatSnackBarModule,
    SocketIoModule.forRoot(config)
  ],
  providers: [{ provide: HAMMER_GESTURE_CONFIG, useClass: GestureConfig },],
  bootstrap: [AppComponent]
})
export class AppModule { }

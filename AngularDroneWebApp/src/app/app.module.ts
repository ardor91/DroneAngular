import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { MapToolComponent } from './map-tool/map-tool.component';
import { TopMenuComponent } from './top-menu/top-menu.component';
import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';
import {HttpClientModule} from '@angular/common/http';

import {MatSelectModule} from '@angular/material/select';
import {MatButtonModule} from '@angular/material/button';

const config: SocketIoConfig = { url: 'http://localhost:4444', options: {} };

@NgModule({
  declarations: [
    AppComponent,
    MapToolComponent,
    TopMenuComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    MatSelectModule,
    HttpClientModule,
    MatButtonModule,
    SocketIoModule.forRoot(config)
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

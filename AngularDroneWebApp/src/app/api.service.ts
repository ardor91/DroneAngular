import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private apiUrl = '/api';

  constructor(private http: HttpClient) { }

  getPorts() {
    return this.http.get(this.apiUrl + '/ports');
  }

  startListening(port: string, baud: string) {
    console.log("Service: ", port, " received");
    return this.http.put(this.apiUrl + '/ports', {port: port, baud: baud}, httpOptions);
  }
}

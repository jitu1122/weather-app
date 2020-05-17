import { Injectable } from '@angular/core';
import {tap} from 'rxjs/operators';
import {Observable} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import * as moment from 'moment';

@Injectable({
  providedIn: 'root'
})
export class AppService {
  public weatherData: any;

  constructor(private http: HttpClient) { }

  public getWeather(lat, lon): Observable<any> {
    return this.http
      .get<any>(`https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&units=metric&appid=4d25babe08e29eff7578c99bcf2b516b`)
      .pipe(
        tap((res: any = {}) => {
          this.weatherData = res;
          }),
      );
  }
  public getIpLocation(): Observable<any> {
    return this.http.get<any>('https://api.ipdata.co?api-key=97afb818626e1dec6995ee0a083b815cb37f1ab93d36379416640dd4');
  }

  convertTime(time, format) {
    return moment.unix(time).format(format);
  }

  getIcon(status) {
    return (status === 'Rain' || status === 'Drizzle') ? 'rain.svg' : status === 'Clear' ? 'sunny.svg' : 'cloudy.svg';
  }
}

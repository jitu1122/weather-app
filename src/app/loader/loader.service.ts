import { Injectable } from '@angular/core';
import {Observable, Subject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {
  private requestQueue: Array<string>;
  private isLoaderVisible: boolean;
  public showLoader: Subject<boolean>;

  constructor(
  ) {
    this.requestQueue = [];
    this.isLoaderVisible = false;
    this.showLoader = new Subject<boolean>();
  }

  public get _showLoader(): Observable<boolean> {
    return this.showLoader.asObservable();
  }

  public requestSent(url: string): void {
    if (url.indexOf('ignoreLoader=true') === -1) {
      this.requestQueue.push(url);
      if (!this.isLoaderVisible && this.requestQueue.length > 0) {
        this.isLoaderVisible = true;
        this.showLoader.next(this.isLoaderVisible);
      }
    }
  }

  public responseReceived(url: string): void {
    if (this.requestQueue.indexOf(url) > -1) {
      this.requestQueue.splice(this.requestQueue.indexOf(url), 1);
      if (this.requestQueue.length === 0) {
        this.isLoaderVisible = false;
        this.showLoader.next(this.isLoaderVisible);
      }
    }
  }
}

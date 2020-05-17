import { Injectable } from '@angular/core';
import {HttpInterceptor, HttpRequest, HttpResponse, HttpEvent, HttpHandler, HttpErrorResponse, HttpHeaders} from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {LoaderService} from './loader.service';

@Injectable({
  providedIn: 'root'
})
export class PmsLoaderInterceptor implements HttpInterceptor {

  constructor(private loaderService: LoaderService) { }

  public intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    const url: string = req.url;
    let requestClone: HttpRequest<any>;

    requestClone = (url.indexOf('ignoreLoader=true') > -1) ?
      req.clone({ url: this.stripIgnoreLoaderQuery(req.url) }) : req.clone();

    // requestClone.headers.append();
    this.loaderService.requestSent(url);

    return next.handle(requestClone)
      .pipe(map((event: HttpEvent<any>) => {
        if (event instanceof HttpResponse) {
          this.loaderService.responseReceived(url);
        } else if (event instanceof HttpErrorResponse) {
          this.loaderService.responseReceived(url);
        }
        return event;
      }), catchError((error: HttpErrorResponse) => {
        this.loaderService.responseReceived(url);
        return throwError(error);
      }));

  }

  private stripIgnoreLoaderQuery(url: string): string {
    return url.replace('?ignoreLoader=true', '').replace('&ignoreLoader=true', '');
  }

}

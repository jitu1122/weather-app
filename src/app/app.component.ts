import {Component, ElementRef, NgZone, OnInit, ViewChild} from '@angular/core';
import * as Highcharts from 'highcharts';
import {AppService} from './app.service';
import * as moment from 'moment';
import HC_stock from 'highcharts/modules/stock';
import {MapsAPILoader} from '@agm/core';

HC_stock(Highcharts);

declare var google: any;


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  @ViewChild('searchInput', {static: false})
  public searchElementRef: ElementRef;

  startDates = [0, 1, 2, 3, 4];
  plotBands = [];
  sunChart: any;
  tempChart: any;
  sunStatusData: any;

  options = {
    title: {
      text: ''
    },
    tooltip: {
      enabled: false
    },
    plotOptions: {
      crosshair: {
        enabled: false
      }
    },
    legend: {
      enabled: false
    },
    xAxis: {
      lineWidth: 0,
      tickWidth: 0,
      plotBands: this.plotBands,
      labels: {
        allowHTML: true,
        formatter() {
          return this.chart.series[0].yData[this.chart.series[0].xData.indexOf(this.pos)] ?
            '<b>' + this.chart.series[0].yData[this.chart.series[0].xData.indexOf(this.pos)] + '°</b><br><p>' + moment.utc(this.value).format('ha') + '</p>' : '';
        }
      },
    },
    credits: {
      enabled: false
    },
    navigator: {
      enabled: true
    },

    rangeSelector: {
      enabled: false
    },
    yAxis: {
      title: '',
      gridLineWidth: 0,
      labels: {
        enabled: false
      },
      crosshair: false
    },

    series: [{
      type: 'area',
      data: [29.9, 71.5, 106.4, 129.2, 144.0]
    }]
  };
  optionsSun = {
    title: {
      text: ''
    },
    credits: {
      enabled: false
    },
    chart: {
      alignTicks: true
    },
    plotOptions: {
      crosshair: {
        enabled: false
      },
      series: {
        states: {
          hover: {
            enabled: false
          }
        }
      }
    },
    legend: {
      enabled: false
    },
    tooltip: {
      enabled: false
    },
    xAxis: {
      lineWidth: 0,
      tickWidth: 0,
      labels: {
        enabled: false
      },
    },

    yAxis: {
      title: '',
      gridLineWidth: 0,
      labels: {
        enabled: false
      },
      plotLines: [
        {from: 0, to: 0.01, color: '#9b9b9c'}
      ],
      crosshair: false
    },
    series: [{
      type: 'areaspline',
      data: this.sunStatusData,
      negativeColor: 'rgba(21,28,31,0.83)',
      negativeFillColor: 'rgba(21,28,31,0.83)',
      // marker: true,
      color: 'rgb(255,228,14)',
      fillColor: {
        linearGradient: {
          x1: 0.3,
          y1: 0,
          x2: 0.54,
          y2: 0
        },
        stops: [[0, 'rgb(255,228,14)'], [1, '#ffffff']]
      }
    }]
  };

  // creating plotbands
  constructor(public appService: AppService,
              private mapsAPILoader: MapsAPILoader,
              private ngZone: NgZone) {
  }

  ngOnInit(): void {
    this.initAddress();
    this.setSunData();
    const thisRef = this;
    this.appService.getIpLocation().subscribe((r) => {
      if (r.latitude && r.longitude) {
        thisRef.weatherData(r.latitude, r.longitude);
      } else {
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            (function success(position) {
              console.log('latitude', position.coords.latitude,
                'longitude', position.coords.longitude);
              thisRef.weatherData(position.coords.latitude, position.coords.longitude);
            }),
            function error() {
            });
        }
      }
    });
    // @ts-ignore
    this.tempChart = Highcharts.stockChart('temp-graph-container', this.options, () => {
    });
    // @ts-ignore
    this.sunChart = Highcharts.chart('sun-graph-container', this.optionsSun, () => {
    });
  }

  weatherData(lat, lon) {
    this.appService.getWeather(lat, lon).subscribe((r) => {
        const now = moment();
        const rise = moment.unix(r.current.sunrise);
        const set = moment.unix(r.current.sunset);
        const diff = set.diff(rise, 'hours');
        const sunPercent = Math.round(((now.diff(rise, 'hours') / diff) * 100) / 25);
        this.sunStatusData[2 + sunPercent].marker.enabled = true;
        this.sunChart.series[0].setData(this.sunStatusData);
        this.sunChart.series[0].options.fillColor.linearGradient = {
          x1: 0,
          y1: 0,
          x2: (sunPercent * 2) / 10,
          y2: 0
        };
        this.sunChart.redraw();

        const tempData = [];
        this.startDates = [];
        r.hourly.map((t) => {
          tempData.push([moment.unix(t.dt).toDate().getTime(), t.temp]);
          this.startDates.push(moment.unix(t.dt).toDate().getTime());
        });
        this.startDates.map((re) => {
          this.tempChart.xAxis[0].addPlotBand({
            borderWidth: 3,
            borderColor: '#f1f1f2',
            color: '#f1f1f2',
            from: re - 1000,
            to: re + 1000
          });
        });
        console.log(this.sunChart);
        this.tempChart.series[0].setData(tempData);
        this.tempChart.xAxis[0].setExtremes(
          this.startDates[0],
          this.startDates[5]
        );
      }
    );
  }

  initAddress() {
    this.mapsAPILoader.load().then(() => {
      const autocomplete = new google.maps.places.Autocomplete(this.searchElementRef.nativeElement, {
        types: ['address']
      });
      autocomplete.addListener('place_changed', () => {
        this.ngZone.run(() => {
          // @ts-ignore
          const place: google.maps.places.PlaceResult = autocomplete.getPlace();
          if (place.geometry === undefined || place.geometry === null) {
            return;
          }
          this.setSunData();
          this.weatherData(place.geometry.location.lat(), place.geometry.location.lng());
        });
      });
    });

  }

  setSunData() {
    this.sunStatusData = [{
      y: -1, marker: {
        enabled: false,
        symbol: 'url(./assets/sunny.svg)',
        height: 30,
        width: 30
      }
    },
      {
        y: -0.8, marker: {
          enabled: false,
          symbol: 'url(./assets/sunny.svg)',
          height: 30,
          width: 30
        }
      },
      {
        y: 0, marker: {
          enabled: false,
          symbol: 'url(./assets/sunny.svg)',
          height: 30,
          width: 30
        }
      },
      {
        y: 0.8, marker: {
          enabled: false,
          symbol: 'url(./assets/sunny.svg)',
          height: 30,
          width: 30
        }
      },
      {
        y: 1, marker: {
          enabled: false,
          symbol: 'url(./assets/sunny.svg)',
          height: 30,
          width: 30
        }
      },
      {
        y: 0.8, marker: {
          enabled: false,
          symbol: 'url(./assets/sunny.svg)',
          height: 30,
          width: 30
        }
      },
      {
        y: 0, marker: {
          enabled: false,
          symbol: 'url(./assets/sunny.svg)',
          height: 30,
          width: 30
        }
      },
      {
        y: -0.8, marker: {
          enabled: false,
          symbol: 'url(./assets/sunny.svg)',
          height: 30,
          width: 30
        }
      },
      {
        y: -1, marker: {
          enabled: false,
          symbol: 'url(./assets/sunny.svg)',
          height: 30,
          width: 30
        }
      }];
  }

  todayCheck(date) {
    return moment().format('DDMM') === moment.unix(date).format('DDMM');
  }
}

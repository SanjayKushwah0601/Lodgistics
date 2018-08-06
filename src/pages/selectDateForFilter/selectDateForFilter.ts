import { Component, NgZone } from '@angular/core';
import { NavController, AlertController, Platform, ModalController, NavParams, ViewController, Events } from 'ionic-angular';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Validator } from '../../validator';
import { srviceMethodsCall } from '../../services/serviceMethods';
import { baseUrl } from '../../services/configURLs';
import { Keyboard } from '@ionic-native/keyboard';
import { NativeStorage } from '@ionic-native/native-storage';
import { createFollowUpUrl } from '../../services/configURLs';
import { CalendarComponentOptions, CalendarModalOptions, CalendarOptions } from 'ion2-calendar';
import { GoogleAnalyticsProvider } from '../../providers/google-analytics/google-analytics';

@Component({
  selector: 'page-selectDateForFilter',
  templateUrl: 'selectDateForFilter.html',
  providers: [srviceMethodsCall, Keyboard, NativeStorage]
})

export class SelectDateForFilterPage {

  //public dateDisable= new Date();
  public d = new Date();
  public dd = ("0" + this.d.getDate()).slice(-2);
  public mm = ("0" + ((this.d.getMonth()) + 1)).slice(-2); //January is 0!
  public yyyy = this.d.getFullYear();
  public dateDisable = new Date(this.yyyy + '-' + this.mm + '-' + this.dd);
  public _daysConfig = [{
    date: new Date(this.dateDisable),
    disable: true
  }];

  public showSub;
  public hideSub;
  public userId: any;
  public dateRange: any;
  type: 'string'; // 'string' | 'js-date' | 'moment' | 'time' | 'object'
  optionsRange: CalendarComponentOptions = {
    pickMode: 'single',
    daysConfig: this._daysConfig,
  };
  public selectedDate = "";
  public apiInProgress = false;

  constructor(public googleAnalytics: GoogleAnalyticsProvider, public platform: Platform, public params: NavParams, private keyboard: Keyboard, public viewCtrl: ViewController, public zone: NgZone, modalCtrl: ModalController, public commonMethod: srviceMethodsCall, public events: Events, public alertCtrl: AlertController, public nativeStorage: NativeStorage) {

    this.dateRange = '';
    this.keyboard.disableScroll(true);
    this.selectedDate = this.params.get('selectedDate') ? this.params.get('selectedDate') : '';

    this.nativeStorage.getItem('user_auth').then(
      accessToken => {
        this.userId = accessToken.user_id;
      });

    this.showSub = this.keyboard.onKeyboardShow().subscribe(data => {
      //this.keyboard.disableScroll(true);
      console.log('keyboard is shown');
      console.log("screen height=" + data.keyboardHeight);
    });

    this.hideSub = this.keyboard.onKeyboardHide().subscribe(data => {
      console.log('keyboard is hide');
      this.events.publish('hide:keyboard');
    });

  }

  dismiss() {
    this.keyboard.close();
    this.viewCtrl.dismiss('');
  }

  ionViewDidLoad() {
    console.log("I'm alive!");
    this.platform.ready().then(() => {
      this.platform.pause.subscribe(() => {
        console.log("pause");
      });
      this.platform.resume.subscribe(() => {
        console.log("resume");
        setTimeout(() => {
          this.nativeStorage.getItem('notificatio_click').then(
            click => {
              if (click.click) {
                this.viewCtrl.dismiss();
              }
            });
        }, 2000);
      });
    });
  }

  onChange() {
    console.log("change" + this.dateRange);
    let d = new Date(this.dateRange);
    let dd = ("0" + d.getDate()).slice(-2);
    let mm = ("0" + ((d.getMonth()) + 1)).slice(-2); //January is 0!
    let yyyy = d.getFullYear();
    let from_date = new Date(yyyy + '-' + mm + '-' + dd);
    console.log("change" + from_date);
    //alert(this.dateRange);
    this.viewCtrl.dismiss({ date: from_date });
    // this.dateRange = { from: this.dateRange.from, to: this.dateRange.to };
  }
  dateSelection() {
    this.viewCtrl.dismiss({ date: this.dateRange });
  }

}

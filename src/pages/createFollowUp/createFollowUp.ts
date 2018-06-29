import { Component, NgZone } from '@angular/core';
import { NavController, AlertController, Platform, ModalController, NavParams, ViewController, Events } from 'ionic-angular';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Validator } from '../../validator';
import { srviceMethodsCall } from '../../services/serviceMethods';
import { baseUrl } from '../../services/configURLs';
import { Keyboard } from '@ionic-native/keyboard';
import { NativeStorage } from '@ionic-native/native-storage';
import { createFollowUpUrl } from '../../services/configURLs';
import { CalendarComponentOptions } from 'ion2-calendar';

@Component({
  selector: 'page-createFollowUp',
  templateUrl: 'createFollowUp.html',
  providers: [srviceMethodsCall, Keyboard, NativeStorage]
})

export class createFollowUpPage {


  public showSub;
  public hideSub;
  public userId: any;
  public dateRange: any;
  type: 'string'; // 'string' | 'js-date' | 'moment' | 'time' | 'object'
  optionsRange: CalendarComponentOptions = {
    pickMode: 'range'
  };
  public id="";
  public apiInProgress=false;

  constructor(public platform: Platform, public params: NavParams, private keyboard: Keyboard, public viewCtrl: ViewController, public zone: NgZone, modalCtrl: ModalController, public commonMethod: srviceMethodsCall, public events: Events, public alertCtrl: AlertController, public nativeStorage: NativeStorage) {

    this.dateRange= { from: '', to: '' };
    this.keyboard.disableScroll(true);
    this.id = this.params.get('id')?this.params.get('id'):'';
   
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

  createFollowUp() {

    let d = new Date(this.dateRange.from);
    let dd = ("0" + d.getDate()).slice(-2);
    let mm = ("0" + ((d.getMonth()) + 1)).slice(-2); //January is 0!
    let yyyy = d.getFullYear();
    let from_date = new Date(yyyy + '-' + mm + '-' + dd);

    let d1 = new Date(this.dateRange.to);
    let dd1 = ("0" + d1.getDate()).slice(-2);
    let mm1 = ("0" + ((d1.getMonth()) + 1)).slice(-2); //January is 0!
    let yyyy1 = d1.getFullYear();
    let to_date = new Date(yyyy1 + '-' + mm1 + '-' + dd1);

    //this.dismiss();
    //alert(this.workOrderData);
    
    /* create WO api call */
    let alertVar = this.alertCtrl.create({
      title: 'Error!',
      subTitle: 'Invalid Details!',
      buttons: ['OK']
    });


    this.nativeStorage.getItem('user_auth').then(
      accessToken => {
        if (this.commonMethod.checkNetwork()) {
          let url = "";
          let objData = {};
          objData = {"feed":{ 'follow_up_start': from_date, 'follow_up_end': to_date }};
          url = createFollowUpUrl + "/" + this.id;
          console.log("dates="+JSON.stringify(objData));
        
          this.apiInProgress=true;
          this.commonMethod.putDataWithoutLoder(url, objData, accessToken).subscribe(
            data => {
              let foundRepos = data.json();
              console.log(foundRepos);
              this.dismiss();
              this.apiInProgress=false;
            },
            err => {
              this.apiInProgress=false;
              alertVar.present();
              console.error("Error : " + err);
            },
            () => {
              console.log('getData completed');
            }
          );
        }
        else {
          this.commonMethod.showNetworkError();
        }

      },
      error => {
        return '';
      }
    );
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
    console.log("change");
    this.dateRange= { from: this.dateRange.from, to:this.dateRange.to };
  }


}

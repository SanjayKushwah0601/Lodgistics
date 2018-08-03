import { Component, NgZone } from '@angular/core';
import { NavController, AlertController, Platform, ModalController, NavParams, ViewController, Events } from 'ionic-angular';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Validator } from '../../validator';
import { srviceMethodsCall } from '../../services/serviceMethods';
import { baseUrl } from '../../services/configURLs';
import { Keyboard } from '@ionic-native/keyboard';
import { NativeStorage } from '@ionic-native/native-storage';
import { getPushNotificationSettings } from '../../services/configURLs';
import { updatePushNotificationSettings } from '../../services/configURLs';

@Component({
  selector: 'page-notificationSettings',
  templateUrl: 'notificationSettings.html',
  providers: [srviceMethodsCall, Keyboard, NativeStorage]
})

export class NotificationSettingsPage {

  public showSub;
  public hideSub;
  public marginBottom = 0;
  public notificationData: any;
  public allKeys = [];
  public spinner = false;
  public showLoader = false;

  constructor(public platform: Platform, public params: NavParams, private keyboard: Keyboard, public viewCtrl: ViewController, public zone: NgZone, modalCtrl: ModalController, public commonMethod: srviceMethodsCall, public events: Events, public alertCtrl: AlertController, public nativeStorage: NativeStorage) {

    this.keyboard.disableScroll(true);
    this.notificationData = {
      id: "",
      user_id: ""
    };

    let alertVar = this.alertCtrl.create({
      title: 'Error!',
      subTitle: 'Invalid Details!',
      buttons: ['OK']
    });

    this.nativeStorage.getItem('user_auth').then(
      accessToken => {
        if (this.commonMethod.checkNetwork()) {

          this.spinner = true;
          this.commonMethod.getDataWithoutLoder(getPushNotificationSettings, accessToken).subscribe(
            data => {
              this.notificationData = data.json();

              // let keys = Object.keys(this.notificationData)
              // let key_to_use = keys[0];

              // console.log("keys="+keys);
              // if( keys.length>0 )
              // {
              //   for(let i=0;i<keys.length;i++)
              //   {
              //     console.log(i+"="+keys[i]);
              //   }
              // }

              var o = this.notificationData;
              for (var prop in o) {
                if (prop != "id" && prop != "user_id") {
                  console.log(prop);
                  let nameArray = prop.split("_");
                  let name = "";
                  for (let i = 0; i < nameArray.length; i++) {
                    if (nameArray[i] != 'enabled' && nameArray[i] != 'notification') {
                      name += nameArray[i].charAt(0).toUpperCase() + nameArray[i].slice(1) + " ";
                    }
                  }
                  this.allKeys.push({ name: name, key: { key_name: prop, prop: o[prop] } });
                }
                //console.log(prop,o[prop]);  
              }
              this.spinner = false;


            },
            err => {
              //this.commonMethod.hideLoader();
              this.spinner = false;
              alertVar.present();
              console.error("Error : " + err);
            },
            () => {
              //this.commonMethod.hideLoader();
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

    this.showSub = this.keyboard.onKeyboardShow().subscribe(data => {
      //this.keyboard.disableScroll(true);
      console.log('keyboard is shown');
      console.log("screen height=" + data.keyboardHeight);
      this.zone.run(() => {
        //this.checkPageHeight();
        this.marginBottom = data.keyboardHeight;

      });

    });

    this.hideSub = this.keyboard.onKeyboardHide().subscribe(data => {
      console.log('keyboard is hide');
      this.events.publish('hide:keyboard');
      //this.classnameForFooter = "openKeyboard";
      this.marginBottom = 0;

    });

  }

  dismiss() {
    this.keyboard.close();
    this.viewCtrl.dismiss();
  }

  update() {
    console.log(this.allKeys);
    let tempObj = {
      id: this.notificationData.id,
      user_id: this.notificationData.user_id
    };

    for (let i = 0; i < this.allKeys.length; i++) {
      let keyName = this.allKeys[i].key.key_name;

      this.zone.run(() => {
        //this.checkPageHeight();
        tempObj[keyName] = JSON.parse(JSON.stringify(this.allKeys[i].key.prop));
      });

    }


    console.log(tempObj);


    let alertVar = this.alertCtrl.create({
      title: 'Error!',
      subTitle: 'Invalid Details!',
      buttons: ['OK']
    });
    this.nativeStorage.getItem('user_auth').then(
      accessToken => {
        if (this.commonMethod.checkNetwork()) {
          //let objData = this.notificationData;
          this.showLoader = true;
          this.commonMethod.putDataWithoutLoder(updatePushNotificationSettings, tempObj, accessToken).subscribe(
            data => {
              let foundRepos = data.json();
              //this.commonMethod.hideLoader();
              this.showLoader = false;
              this.keyboard.close();
              this.viewCtrl.dismiss();
            },
            err => {
              //this.commonMethod.hideLoader();
              console.error("Error : " + err);
              let res = err.json();
              if (typeof (res.errors.message) !== undefined) {
                let alertVarErr = this.alertCtrl.create({
                  title: 'Error!',
                  subTitle: res.errors ? res.errors : 'Invalid Details!',
                  buttons: ['OK']
                });
                alertVarErr.present();
              }
              else {
                alertVar.present();
              }
              this.showLoader = false;
            },
            () => {
              //this.commonMethod.hideLoader();
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
}


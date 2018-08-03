import { Component, NgZone } from '@angular/core';
import { NavController, AlertController, Platform, ModalController, NavParams, ViewController, Events } from 'ionic-angular';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Validator } from '../../validator';
import { srviceMethodsCall } from '../../services/serviceMethods';
import { baseUrl } from '../../services/configURLs';
import { Keyboard } from '@ionic-native/keyboard';
import { changePasswordUrl } from '../../services/configURLs';
import { NativeStorage } from '@ionic-native/native-storage';

@Component({
  selector: 'page-changePassword',
  templateUrl: 'changePassword.html',
  providers: [srviceMethodsCall, Keyboard, NativeStorage]
})

export class ChangePasswordPage {

  public showSub;
  public hideSub;
  public marginBottom = 0;
  public userId = "";
  public userData: any;
  public showLoader = false;

  constructor(public platform: Platform, public params: NavParams, private keyboard: Keyboard, public viewCtrl: ViewController, public zone: NgZone, modalCtrl: ModalController, public commonMethod: srviceMethodsCall, public events: Events, public alertCtrl: AlertController, public nativeStorage: NativeStorage, public navCtrl: NavController) {

    this.keyboard.disableScroll(true);
    this.userData = {
      password: '',
      password_confirmation: ''
    };

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

    let alertVar = this.alertCtrl.create({
      title: 'Error!',
      subTitle: 'Invalid Details!',
      buttons: ['OK']
    });

    this.nativeStorage.getItem('user_auth').then(
      accessToken => {

        this.userId = accessToken.user_id;

        if (this.commonMethod.checkNetwork()) {
          this.showLoader = true;
          let objData = { 'user': { 'password': this.userData.password.trim(), 'password_confirmation': this.userData.password_confirmation.trim() } };
          this.commonMethod.putDataWithoutLoder(changePasswordUrl, objData, accessToken).subscribe(
            data => {
              let foundRepos = data.json();
              //this.commonMethod.hideLoader();
              this.showLoader = false;
              this.keyboard.close();
              this.viewCtrl.dismiss();
            },
            err => {
              //this.commonMethod.hideLoader();
              this.showLoader = false;
              //alertVar.present();
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


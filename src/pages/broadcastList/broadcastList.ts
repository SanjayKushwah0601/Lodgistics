import { Component, NgZone } from '@angular/core';
import { NavController, AlertController, Platform, ModalController, NavParams, ViewController, Events } from 'ionic-angular';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Validator } from '../../validator';
import { srviceMethodsCall } from '../../services/serviceMethods';
import { Keyboard } from '@ionic-native/keyboard';
import { NativeStorage } from '@ionic-native/native-storage';
import { getBroadcastListUrl } from '../../services/configURLs';

@Component({
  selector: 'page-broadcastList',
  templateUrl: 'broadcastList.html',
  providers: [srviceMethodsCall, Keyboard, NativeStorage]
})

export class BroadcastListPage {

  public showSub;
  public hideSub;
  public foundRepos=[];
  public spinner=true;

  constructor(public platform: Platform, public params: NavParams, private keyboard: Keyboard, public viewCtrl: ViewController, public zone: NgZone, modalCtrl: ModalController, public commonMethod: srviceMethodsCall, public events: Events, public alertCtrl: AlertController, public nativeStorage: NativeStorage) {

    this.keyboard.disableScroll(true);
    

    this.platform.ready().then(() => {

          /* strat api call get WO locations */
          let alertVar = this.alertCtrl.create({
            title: 'Error!',
            subTitle: 'Invalid Details!',
            buttons: ['OK']
          });

          this.nativeStorage.getItem('user_auth').then(
            accessToken => {
              if (this.commonMethod.checkNetwork()) {
                this.spinner=true;
                this.commonMethod.getDataWithoutLoder(getBroadcastListUrl, accessToken).subscribe(
                  data => {
                    this.foundRepos = data.json();
                    console.log("==" + JSON.stringify(this.foundRepos));
                    this.spinner=false;

                    this.nativeStorage.setItem('broadcast_count', this.foundRepos.length)
                      .then(
                      () => console.log('Stored broadcast_count!'),
                      error => console.error('Error storing broadcast_count', error)
                      );

                  },
                  err => {
                    this.spinner=false;
                    alertVar.present();
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
          /* end api call to get WO location */
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

}

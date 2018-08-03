import { Component, NgZone } from '@angular/core';
import { NavController, AlertController, Platform, ModalController, NavParams, ViewController, Events } from 'ionic-angular';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Validator } from '../../validator';
import { srviceMethodsCall } from '../../services/serviceMethods';
import { baseUrl } from '../../services/configURLs';
import { Keyboard } from '@ionic-native/keyboard';
import { NativeStorage } from '@ionic-native/native-storage';
import { createBroadcastUrl } from '../../services/configURLs';

@Component({
  selector: 'page-markFixed',
  templateUrl: 'markFixed.html',
  providers: [srviceMethodsCall, Keyboard, NativeStorage]
})

export class markFixedPage {


  public showSub;
  public hideSub;
  public userId: any;
  public messageText = "";
  public tags = [];

  constructor(public platform: Platform, public params: NavParams, private keyboard: Keyboard, public viewCtrl: ViewController, public zone: NgZone, modalCtrl: ModalController, public commonMethod: srviceMethodsCall, public events: Events, public alertCtrl: AlertController, public nativeStorage: NativeStorage) {
    this.keyboard.disableScroll(true);

    this.tags = [
      { text: "Repair", is_selected: false },
      { text: "Replace", is_selected: false },
      { text: "Paint", is_selected: false },
      { text: "Touch-up", is_selected: false },
      { text: "Clean", is_selected: false }
    ];

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

  markFixed() {
    this.dismiss();
    /* create WO api call */
    // let alertVar = this.alertCtrl.create({
    //   title: 'Error!',
    //   subTitle: 'Invalid Details!',
    //   buttons: ['OK']
    // });


    // this.nativeStorage.getItem('user_auth').then(
    //   accessToken => {
    //     if (this.commonMethod.checkNetwork()) {
    //       let url = "";
    //       let objData = {};
    //       let objData1 = {};
    //       objData = {"feed":{ 'broadcast_start': from_date, 'broadcast_end': to_date }};
    //       url = createBroadcastUrl + "/" + this.id;
    //       console.log("dates="+JSON.stringify(objData));

    //       this.commonMethod.putData(url, objData, accessToken).subscribe(
    //         data => {
    //           let foundRepos = data.json();
    //           console.log(foundRepos);
    //           this.commonMethod.hideLoader();
    //           this.dismiss();
    //         },
    //         err => {
    //           this.commonMethod.hideLoader();
    //           alertVar.present();
    //           console.error("Error : " + err);
    //         },
    //         () => {
    //           this.commonMethod.hideLoader();
    //           console.log('getData completed');
    //         }
    //       );
    //     }
    //     else {
    //       this.commonMethod.showNetworkError();
    //     }

    //   },
    //   error => {
    //     return '';
    //   }
    // );
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

  selectTag(tag, is_selected, index) {
    if (is_selected == true) {
      this.tags[index].is_selected = false;
      this.messageText = this.messageText.replace(tag, '');
    }
    else {
      this.tags[index].is_selected = true;
      this.messageText = this.messageText.trim();
      if (this.messageText == "") {
        this.messageText += tag + " ";
      }
      else {
        this.messageText += " " + tag + " ";
      }
    }
  }


}

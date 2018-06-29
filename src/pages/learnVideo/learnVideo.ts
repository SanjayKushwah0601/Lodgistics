import { Component, NgZone } from '@angular/core';
import { NavController, AlertController, Platform, ModalController, NavParams, ViewController, Events } from 'ionic-angular';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Validator } from '../../validator';
import { srviceMethodsCall } from '../../services/serviceMethods';
import { baseUrl } from '../../services/configURLs';
import { Keyboard } from '@ionic-native/keyboard';
import { NativeStorage } from '@ionic-native/native-storage';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'page-learnVideo',
  templateUrl: 'learnVideo.html',
  providers: [srviceMethodsCall, Keyboard, NativeStorage]
})

export class learnVideoPage {

  public showSub;
  public hideSub;
  public marginBottom = 0;
  public userId = "";
  public userData: any;
  trustedVideoUrl: SafeResourceUrl;

  constructor(public platform: Platform, public params: NavParams, private keyboard: Keyboard, public viewCtrl: ViewController, public zone: NgZone, modalCtrl: ModalController, public commonMethod: srviceMethodsCall, public events: Events, public alertCtrl: AlertController, public nativeStorage: NativeStorage, private domSanitizer: DomSanitizer) {

    let id = this.params.get('id');

    this.trustedVideoUrl = this.domSanitizer.bypassSecurityTrustResourceUrl("https://www.youtube.com/embed/"+id+"?rel=0&amp;showinfo=0");
    
  }

  dismiss() {
    this.keyboard.close();
    this.viewCtrl.dismiss();
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


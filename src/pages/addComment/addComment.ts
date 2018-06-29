import { Component, NgZone } from '@angular/core';
import { NavController, AlertController, Platform, ModalController, NavParams, ViewController, Events } from 'ionic-angular';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Validator } from '../../validator';
import { srviceMethodsCall } from '../../services/serviceMethods';
import { Keyboard } from '@ionic-native/keyboard';
import { NativeStorage } from '@ionic-native/native-storage';

@Component({
  selector: 'page-addComment',
  templateUrl: 'addComment.html',
  providers: [srviceMethodsCall, Keyboard, NativeStorage]
})

export class AddCommentPage {
  
  public commentText = "";

  constructor(public platform: Platform, public params: NavParams, private keyboard: Keyboard, public viewCtrl: ViewController, public zone: NgZone, modalCtrl: ModalController, public commonMethod: srviceMethodsCall, public events: Events, public nativeStorage: NativeStorage) {
    this.keyboard.disableScroll(true);
    this.commentText = this.params.get('comment') ? this.params.get('comment') : '';

  }

  dismiss() {
    this.keyboard.close();
    this.viewCtrl.dismiss('');
  }

  send() {
    this.keyboard.close();
    this.viewCtrl.dismiss({ msg: this.commentText.trim()});
  }

  changeModelValue(e)
  {
    this.zone.run(() => {
      this.commentText=this.commentText;
    });
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
           if(click.click){
            this.viewCtrl.dismiss('');
           }
          });
        },2000);
      });
    });
  }
}

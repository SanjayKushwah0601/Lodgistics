import { Component, ViewChild, trigger, transition, style, animate, state, NgZone } from '@angular/core';
import { NavController, AlertController, Platform, NavParams, Content, ModalController } from 'ionic-angular';
import { srviceMethodsCall } from '../../services/serviceMethods';
import { NativeStorage } from '@ionic-native/native-storage';
import { Keyboard } from '@ionic-native/keyboard';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { FeedsPage } from '../feeds/feeds';
import { MyMentionPage } from '../myMention/myMention';
import { ChattingPage } from '../chatting/chatting';
import { CreateWorkOrderPage } from '../createWorkOrder/createWorkOrder';
import { WorkOrderPage } from '../workOrder/workOrder';
import { getRoomCheckListItemsUrl } from '../../services/configURLs';
import { markAllChecklistForPmMsg } from '../../providers/appConfig';
import { markFixedPage } from '../markFixed/markFixed';

@Component({
  selector: 'page-startPm',
  templateUrl: 'startPm.html',
  providers: [srviceMethodsCall, NativeStorage, Keyboard, SQLite]
})

export class StartPmPage {
  @ViewChild(Content) content: Content;

  public foundRepos = [];
  public lastUpdatesAt: Date;
  public feedNotificationCount = 0;
  public messagesNotificationCount = 0;
  public interval: any;
  public userId = "";
  public userPermissions: any;
  public isPopupOpen = false;
  public roomNo = "";
  public alert: any;
  public roomId = "";

  constructor(public navCtrl: NavController, public commonMethod: srviceMethodsCall, public alertCtrl: AlertController, public nativeStorage: NativeStorage, public keyboard: Keyboard, private sqlite: SQLite, public zone: NgZone, public modalCtrl: ModalController, public platform: Platform, public params: NavParams) {

    this.userPermissions = {
      "wo_access": {
        "view_listing": false,
        "can_create": false,
        "can_close": false
      }
    };
    this.platform.ready().then(() => {

      this.commonMethod.getUserPermissions().then(
        permissions => {
          this.userPermissions = permissions;
          if (!this.userPermissions.wo_access.can_create) {

          }
        },
        error => {
          return false;
        }
      );
    });

    this.roomNo = this.params.get('roomNo') ? this.params.get('roomNo') : '';
    this.roomId = this.params.get('roomId') ? this.params.get('roomId') : '';

    let thisObj = this;
    this.interval = window.setInterval(function () {
      /// call your function here
      console.log("update notification count");
      thisObj.nativeStorage.getItem('user_notifications').then(
        count => {
          thisObj.feedNotificationCount = count.feed_count ? count.feed_count : 0;
          thisObj.messagesNotificationCount = count.message_count ? count.message_count : 0;
        },
        error => {
          return false;
        }
      );

    }, 1000);

  }

  getRoomChecklistItems() {
    this.lastUpdatesAt = new Date();
    let alertVar = this.alertCtrl.create({
      title: 'Error!',
      subTitle: 'Invalid Details!',
      buttons: ['OK']
    });

    this.nativeStorage.getItem('user_auth').then(
      accessToken => {
        this.userId = accessToken.user_id;
        console.log("access token details  : " + JSON.stringify(accessToken));
        if (this.commonMethod.checkNetwork()) {

          this.commonMethod.getData(getRoomCheckListItemsUrl, accessToken).subscribe(
            data => {
              this.foundRepos = data.json();
              console.log(this.foundRepos);
            },
            err => {
              this.commonMethod.hideLoader();
              alertVar.present();
              console.error("Error : " + err);
            },
            () => {
              this.commonMethod.hideLoader();
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

  /* functions for footer */
  openChatPage() {
    this.navCtrl.setRoot(ChattingPage);
  }
  openFeedPage() {
    this.navCtrl.setRoot(FeedsPage);
  }

  openMyMentionPage() {
    this.navCtrl.setRoot(MyMentionPage);
  }

  openWOPage() {
    this.navCtrl.setRoot(WorkOrderPage);
  }

  ionViewDidEnter() {
    this.nativeStorage.setItem('lastPage', { "pageName": StartPmPage.name, "index": this.navCtrl.getActive().index });
    console.log("page loaded");
    this.getRoomChecklistItems();
  }

  ionViewWillLeave() {
    console.log("Looks like I'm about to leave :(, clear notification Interval");
    window.clearInterval(this.interval);
  }

  confirmMarkAll() {
    this.alert = this.alertCtrl.create({
      message: markAllChecklistForPmMsg,
      cssClass: 'confirm-work-order',
      enableBackdropDismiss: false,
      buttons: [
        {
          text: 'No',
          handler: data => {
            console.log('No clicked');
          }
        },
        {
          text: 'Yes',
          handler: data => {
            console.log('Yes clicked');
          }
        }
      ]
    });
    this.alert.present();
  }

  markFixed() {
    this.isPopupOpen = true;
    let modal = this.modalCtrl.create(markFixedPage, { id: '' });
    modal.onDidDismiss(data => {
      this.isPopupOpen = false;
      this.closekeyboard();
    });
    modal.present();
  }

  closekeyboard() {
    this.keyboard.close();
  }

  createWorkOrder(id, value, image_url, mentioned_user_ids, room_id, maintenance_checklist_item_id) {
    room_id = this.roomId;
    let modal = this.modalCtrl.create(CreateWorkOrderPage, { id: id, value: value, image_url: image_url, mentioned_user_ids: mentioned_user_ids, room_id: room_id, maintenance_checklist_item_id: maintenance_checklist_item_id });
    modal.onDidDismiss(data => {
      this.closekeyboard();
    });
    modal.present();
  }

  confirmResetStatus(name) {
    this.alert = this.alertCtrl.create({
      message: "Reset the status of '" + name + "'?",
      cssClass: 'confirm-work-order',
      enableBackdropDismiss: false,
      buttons: [
        {
          text: 'No',
          handler: data => {
            console.log('No clicked');
          }
        },
        {
          text: 'Yes',
          handler: data => {
            console.log('Yes clicked');
          }
        }
      ]
    });
    this.alert.present();
  }



}



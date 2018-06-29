import { Component, ViewChild, trigger, transition, style, animate, state, NgZone } from '@angular/core';
import { NavController, AlertController, Platform, Content, ModalController } from 'ionic-angular';
import { srviceMethodsCall } from '../../services/serviceMethods';
import { NativeStorage } from '@ionic-native/native-storage';
import { Keyboard } from '@ionic-native/keyboard';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { FeedsPage } from '../feeds/feeds';
import { MyMentionPage } from '../myMention/myMention';
import { ChattingPage } from '../chatting/chatting';
import { WorkOrderPage } from '../workOrder/workOrder';
import { BroadcastListPage } from '../broadcastList/broadcastList';
import { StartPmPage } from '../startPm/startPm';
import { locationsUrl } from '../../services/configURLs';

@Component({
  selector: 'page-roomsMaintenance',
  templateUrl: 'roomsMaintenance.html',
  providers: [srviceMethodsCall, NativeStorage, Keyboard, SQLite]
})

export class RoomsMaintenancePage {
  @ViewChild(Content) content: Content;

  public lastUpdatesAt: Date;
  public feedNotificationCount = 0;
  public messagesNotificationCount = 0;
  public woNotificationCount = 0;
  public interval: any;
  public userId = "";
  public broadcast_count=0;
  public userPermissions:any;
  public isPopupOpen = false;
  public roomNo="";
  public room:any;
  public roomId="";

  constructor(public navCtrl: NavController, public commonMethod: srviceMethodsCall, public alertCtrl: AlertController, public nativeStorage: NativeStorage, public keyboard: Keyboard, private sqlite: SQLite, public zone: NgZone, public modalCtrl: ModalController, public platform: Platform) {

    this.userPermissions = {
      "wo_access": {
        "view_listing": false,
        "can_create": false,
        "can_close":false
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

    let thisObj = this;
    this.interval = window.setInterval(function () {
      /// call your function here
      console.log("update notification count");
      thisObj.nativeStorage.getItem('user_notifications').then(
        count => {
          thisObj.feedNotificationCount = count.feed_count ? count.feed_count : 0;
          thisObj.messagesNotificationCount = count.message_count ? count.message_count : 0;
          thisObj.woNotificationCount = count.wo_count ? count.wo_count: 0;
        },
        error => {
          return false;
        }
      );

    }, 1000);

    /* Manage count for broadcast */
    this.nativeStorage.getItem('broadcast_count').then(
      count => {
        this.broadcast_count = count;
      },
      error => {
        return false;
      }
    );

  }

  getLocations() {
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
        
          this.commonMethod.getData(locationsUrl, accessToken).subscribe(
            data => {
              let allData = data.json();
              this.room = allData.Room;
              console.log(this.room);
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
    this.nativeStorage.setItem('lastPage', { "pageName": RoomsMaintenancePage.name, "index": this.navCtrl.getActive().index });
    console.log("page loaded");
    this.getLocations();
  }

  ionViewWillLeave() {
    console.log("Looks like I'm about to leave :(, clear notification Interval");
    window.clearInterval(this.interval);
  }

  broadcastList() {
    this.isPopupOpen = true;
    let modal = this.modalCtrl.create(BroadcastListPage);
    modal.onDidDismiss(data => {
      this.isPopupOpen = false;
      //this.callTodaysFeedInBackground();
    });
    modal.present();
  }

  selectRoom(no,id)
  {
    this.roomNo=no;
    this.roomId=id;
  }

  deSelectRoom()
  {
    this.roomNo="";
    this.roomId="";
  }
  
  startPm()
  {
    this.navCtrl.push(StartPmPage, { roomNo: this.roomNo,roomId:this.roomId});
  }

}



import { Component, NgZone, ViewChild, ElementRef, Input, Injectable } from '@angular/core';
import { ModalController, ViewController, NavController, AlertController, Platform, FabContainer } from 'ionic-angular';
import { Http, Headers, RequestOptions } from '@angular/http';
import { srviceMethodsCall } from '../../services/serviceMethods';
import { NativeStorage } from '@ionic-native/native-storage';
import { ChattingPage } from '../chatting/chatting';
import { MyMentionPage } from '../myMention/myMention';
import { FeedsPage } from '../feeds/feeds';
import { learnVideoPage } from '../learnVideo/learnVideo';
import { Keyboard } from '@ionic-native/keyboard';
import { YoutubeVideoPlayer } from '@ionic-native/youtube-video-player';
import { getHowToVideosUrl } from '../../services/configURLs';
import { BroadcastListPage } from '../broadcastList/broadcastList';
import { WorkOrderPage } from '../workOrder/workOrder';
import { TaskChecklistPage } from '../taskChecklist/taskChecklist';
import { SendMessagePage } from '../sendMessage/sendMessage';
import { CreateWorkOrderPage } from '../createWorkOrder/createWorkOrder';
import { CreateFeedsPage } from '../createFeeds/createFeeds';
import { GoogleAnalyticsProvider } from '../../providers/google-analytics/google-analytics';

@Component({
  selector: 'page-myVideos',
  templateUrl: 'myVideos.html',
  providers: [srviceMethodsCall, NativeStorage, Keyboard, YoutubeVideoPlayer, FabContainer]
})
export class MyVideosPage {
  public userVideoData: any;
  public videoObj: any;
  public modelObj: any;
  public broadcast_count = 0;
  public userPermissions: any;
  public isPopupOpen = false;
  public feedNotificationCount = 0;
  public messagesNotificationCount = 0;
  public woNotificationCount = 0;
  public interval: any;
  public spinner = false;
  public fabButtonOpened = false;

  constructor(public googleAnalytics: GoogleAnalyticsProvider, public platform: Platform, public navCtrl: NavController, public commonMethod: srviceMethodsCall, public alertCtrl: AlertController, public nativeStorage: NativeStorage, private http: Http, public zone: NgZone, private keyboard: Keyboard, private viewCtrl: ViewController, private youtube: YoutubeVideoPlayer, private modalCtrl: ModalController, public fabContainer: FabContainer) {

    this.userPermissions = {
      "wo_access": {
        "view_listing": false,
        "can_create": false
      }
    };
    this.platform.ready().then(() => {

      this.commonMethod.getUserPermissions().then(
        permissions => {
          this.userPermissions = permissions;
        },
        error => {
          return false;
        }
      );

      let thisObj = this;
      this.interval = window.setInterval(function () {
        /// call your function here
        console.log("update notification count");
        thisObj.nativeStorage.getItem('user_notifications').then(
          count => {
            thisObj.feedNotificationCount = count.feed_count ? count.feed_count : 0;
            thisObj.messagesNotificationCount = count.message_count ? count.message_count : 0;
            thisObj.woNotificationCount = count.wo_count ? count.wo_count : 0;
          },
          error => {
            return false;
          }
        );

      }, 1000);


    });

    let alertVar = this.alertCtrl.create({
      title: 'Error!',
      subTitle: 'Invalid Details!',
      buttons: ['OK']
    });

    this.nativeStorage.getItem('user_auth').then(
      accessToken => {
        if (this.commonMethod.checkNetwork()) {

          this.spinner = true;
          this.commonMethod.getDataWithoutLoder(getHowToVideosUrl, accessToken).subscribe(
            data => {
              this.userVideoData = data.json();
              this.spinner = false;
              console.log(this.userVideoData);
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


  /* functions for footer */
  openChatPage() {
    this.googleAnalytics.bottomTabClick('Open Chat Page')
    this.navCtrl.setRoot(ChattingPage);
  }
  openMyMentionPage() {
    this.googleAnalytics.bottomTabClick('Open Mentions Page')
    this.navCtrl.setRoot(MyMentionPage);
  }
  openFeedPage() {
    this.googleAnalytics.bottomTabClick('Open Feed Page')
    this.navCtrl.setRoot(FeedsPage);
  }
  openWOPage() {
    this.googleAnalytics.bottomTabClick('Open Work Order Page')
    this.navCtrl.setRoot(WorkOrderPage);
  }
  openTaskChecklistPage() {
    this.googleAnalytics.bottomTabClick('Open Check List Page')
    this.navCtrl.setRoot(TaskChecklistPage);
  }



  payVideo(id) {


    this.modelObj = this.modalCtrl.create(learnVideoPage, { id: id });

    this.modelObj.onDidDismiss(data => {



    });

    this.modelObj.present();

    //let thisObj=this;
    //setTimeout(function(){  thisObj.modelObj.dismiss();  }, 25000);


    //this.trustedVideoUrl = this.domSanitizer.bypassSecurityTrustResourceUrl("https://www.youtube.com/embed/"+id);
    //console.log("1"+ JSON.stringify(this.youtube));
    // this.videoObj=this.youtube.openVideo(id); 
    //console.log(temp);
    //console.log("2"+ JSON.stringify(this.youtube));
    //let thisObj=this;
    //setTimeout(function(){ console.log("3"+ JSON.stringify(thisObj.youtube)); thisObj.youtube.openVideo('');   }, 3000);
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
                //this.browser.close();
                this.modelObj.dismiss();
              }
            });
        }, 2000);
      });
    });
  }

  ionViewDidEnter() {
    this.nativeStorage.setItem('lastPage', { "pageName": MyVideosPage.name, "index": this.navCtrl.getActive().index });
  }

  ionViewDidLeave() {
    console.log("ionViewDidLeave");
  }

  broadcastList() {
    let modal = this.modalCtrl.create(BroadcastListPage);
    modal.onDidDismiss(data => {
      //this.callTodaysFeedInBackground();
    });
    modal.present();
  }

  createFeedQuick(fab?: FabContainer) {
    if (fab !== undefined) {
      fab.close();
    }
    this.fabButtonOpened = false;
    this.googleAnalytics.fabButtonClick('Create New Post')
    this.createFeed();
  }

  createWorkOrderQuick(fab?: FabContainer) {
    if (fab !== undefined) {
      fab.close();
    }
    this.fabButtonOpened = false;
    this.googleAnalytics.fabButtonClick('Create Work Order')
    this.createWorkOrder('', '', '', '', '');
  }

  sendMessage(fab?: FabContainer) {
    if (fab !== undefined) {
      fab.close();
    }
    this.fabButtonOpened = false;
    this.googleAnalytics.fabButtonClick('Create New Message')
    let modal = this.modalCtrl.create(SendMessagePage);
    modal.onDidDismiss(data => {
      this.closekeyboard();
    });
    modal.present();
  }

  openFabButton() {
    if (this.fabButtonOpened == false) {
      this.fabButtonOpened = true;
    } else {
      this.fabButtonOpened = false;
    }
  }

  createWorkOrder(id, value, image_url, mentioned_user_ids, room_id) {
    let modal = this.modalCtrl.create(CreateWorkOrderPage, { id: id, value: value, image_url: image_url, mentioned_user_ids: mentioned_user_ids, room_id: room_id });
    modal.onDidDismiss(data => {
      this.closekeyboard();
    });
    modal.present();
  }

  createFeed() {
    //console.log('create feed call');
    this.navCtrl.push(CreateFeedsPage);
  }
  closekeyboard() {
    this.keyboard.close();
  }

}

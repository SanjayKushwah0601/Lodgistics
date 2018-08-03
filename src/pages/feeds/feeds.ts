import { Component, ViewChild, trigger, transition, style, animate, state, NgZone } from '@angular/core';
import { NavController, AlertController, Platform, Content, NavParams, ModalController, ViewController, Events, FabContainer, Slides, ActionSheetController } from 'ionic-angular';
import { srviceMethodsCall } from '../../services/serviceMethods';
import { getFeedsUrl, getMentionables } from '../../services/configURLs';
import { NativeStorage } from '@ionic-native/native-storage';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { Keyboard } from '@ionic-native/keyboard';
import { CreateFeedsPage } from '../createFeeds/createFeeds';
import { FeedDetailPage } from '../feedDetail/feedDetail';
import { ChattingPage } from '../chatting/chatting';
import { TranslationService } from '../../providers/translation.service';
import { MyMentionPage } from '../myMention/myMention';
import 'web-animations-js/web-animations.min';
import { LoginPage } from '../login/login';
import { createWorkOrderConfirmMsg } from '../../providers/appConfig';
import { createBroadCastConfirmMsg } from '../../providers/appConfig';
import { CreateWorkOrderPage } from '../createWorkOrder/createWorkOrder';
import { BroadcastListPage } from '../broadcastList/broadcastList';
import { createBroadcastPage } from '../createBroadcast/createBroadcast';
import { WebHomePage } from '../webHomePage/webHomePage';
import { WorkOrderPage } from '../workOrder/workOrder';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { viewWorkOrderUrl } from '../../services/configURLs';
import { textLength } from '../../providers/appConfig';
import { getBroadcastListUrl, getFollowUpUrl } from '../../services/configURLs';
import { cancelBroadcastConfirmMsg, makrCompleteFeedConfirmMsg, reopenMarkCompleteFeedConfirmMsg, cancelFollowUpConfirmMsg, createFollowUpConfirmMsg } from '../../providers/appConfig';
import { createBroadcastUrl, updateFeedStatusUrl } from '../../services/configURLs';
import { TaskChecklistPage } from '../taskChecklist/taskChecklist';
import { SendMessagePage } from '../sendMessage/sendMessage';
import { createFollowUpPage } from '../createFollowUp/createFollowUp';
import { createFollowUpUrl } from '../../services/configURLs';
import { UtilMethods } from '../../services/utilMethods';
import { GoogleAnalyticsProvider } from '../../providers/google-analytics/google-analytics';

@Component({
  selector: 'page-feeds',
  animations: [
    trigger(
      'enterAnimation', [
        transition(':enter', [
          style({ transform: 'translateX(100%)', opacity: 0 }),
          animate('500ms', style({ transform: 'translateX(0)', opacity: 1 }))
        ]),
        transition(':leave', [
          style({ transform: 'translateX(0)', opacity: 1 }),
          animate('0ms', style({ transform: 'translateX(0%)', opacity: 0 }))
        ])
      ]
    )
  ],
  templateUrl: 'feeds.html',
  providers: [UtilMethods, srviceMethodsCall, NativeStorage, Keyboard, TranslationService, SQLite, InAppBrowser, FabContainer]
})

export class FeedsPage {
  @ViewChild(Content) content: Content;
  @ViewChild(Slides) slides: Slides;

  public foundRepos: any;
  public filterDate: Date;
  public callDateFilter;
  public hotelCreatedDate: Date;
  public lastUpdatesAt: Date;
  public showLoader: any;
  public reachedOnLastDate: any;
  public showFilter: any = false;
  public showFilterData: any = false;
  public hotelName: string;
  public touchtime = 0;
  public members = [];
  public showLoaderTodays = false;
  public lastUpdatedAt: any;
  public feedId: any;
  public searchQuery: string = '';
  items: string[];
  state: string = 'inactive';
  public updateAfter: any;
  public lastFeedDate: any;
  public apiCallStatus = false;
  public timeOutStatus = false;
  public isPopupOpen = false;
  public viewWOUrl = "";
  public feedNotificationCount = 0;
  public messagesNotificationCount = 0;
  public woNotificationCount = 0;
  public interval: any;
  public userPermissions: any;
  public timeZoneOffset: any;
  public textLengthValue: any;
  public alert: any;
  public broadcast_count = 0;
  public fabButtonOpened = false;
  public followUpFeeds: any;
  public actionSheet: any;
  //public currentDate = "";
  // public currentDate : any;
  // public totalFeeds=0;
  public totalFeeds = 0;
  public lastfeedcount = 0;

  constructor(public googleAnalytics: GoogleAnalyticsProvider, public platform: Platform, public navCtrl: NavController, public commonMethod: srviceMethodsCall, public navParams: NavParams, public alertCtrl: AlertController, public nativeStorage: NativeStorage, public keyboard: Keyboard, public translationservice: TranslationService, private sqlite: SQLite, public zone: NgZone, public modalCtrl: ModalController, private iab: InAppBrowser, public viewCtrl: ViewController, public events: Events, public fabContainer: FabContainer, public actionSheetCtrl: ActionSheetController, public utilMethods: UtilMethods) {

    this.viewWOUrl = viewWorkOrderUrl;
    this.textLengthValue = textLength;
    this.feedId = this.navParams.get('feedId');
    this.getAllMembersFromDb();
    this.nativeStorage.setItem('groupInfo', { "groupID": '' });
    this.timeZoneOffset = new Date().getTimezoneOffset();

    this.userPermissions = {
      "wo_access": {
        "view_listing": false,
        "can_create": false
      }
    };

    this.platform.ready().then(() => {

      let thisObj = this;

      this.commonMethod.getUserPermissions().then(
        permissions => {
          this.userPermissions = permissions;

          if (this.navParams.get('openWoPopup') as boolean) {
            this.editWorkOrder(this.navParams.get('wo_id'))
          }

        },
        error => {
          return false;
        }
      );


      this.interval = window.setInterval(function () {
        /// call your function here
        // console.log("update notification count");
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

      /* Manage count for broadcast */
      this.nativeStorage.getItem('broadcast_count').then(
        count => {
          this.broadcast_count = count;
        },
        error => {
          return false;
        }
      );

    });

    this.lastUpdatedAt = new Date().toISOString();
    let tempApiDate = new Date();
    tempApiDate.setMinutes(tempApiDate.getMinutes() - 5);
    this.updateAfter = tempApiDate.toString();

    this.nativeStorage.getItem('feedData').then(
      feedData => {

        this.showLoader = false;
        this.reachedOnLastDate = false;
        this.callDateFilter = true;

        this.foundRepos = feedData.data;
        //this.findTotalFeed();
        this.filterDate = new Date(feedData.lastDate);
        this.lastFeedDate = feedData.lastFeedDate;
        if (this.lastFeedDate == null || this.lastFeedDate == undefined) {
          let d = new Date(this.foundRepos[this.foundRepos.length - 1].date);
          let dd = ("0" + d.getDate()).slice(-2);
          let mm = ("0" + ((d.getMonth()) + 1)).slice(-2); //January is 0!
          let yyyy = d.getFullYear();
          this.lastFeedDate = yyyy + '-' + mm + '-' + dd;
        }

        let tempApiDate = new Date((feedData.updateAfter != undefined) ? feedData.updateAfter : feedData.lastDate);
        tempApiDate.setMinutes(tempApiDate.getMinutes() - 5);
        let newDateTime = tempApiDate.toString();

        this.updateAfter = newDateTime;
        let uspdateDate = true;
        for (var key in this.foundRepos) {
          let obj = this.foundRepos[key];
          if (obj.value.length > 0) {
            for (let k = 0; k < 1; k++) {
              if (uspdateDate == true) {
                this.lastUpdatedAt = obj.value[k].updated_at;
                uspdateDate = false;
              }
            }
          }
        }
        console.log('Sanjay: Feed fetched from db and now fetching from server.....')
        this.callTodaysFeedInBackground();
      }, error => {
        let lastPage = this.navCtrl.last();
        console.log("VAL" + lastPage.component.name);
        if (lastPage.component.name == "LoginPage") {
          console.log("show:LoaderPage");
          this.events.publish('show:LoaderPage');
        }
        this.callTodaysFeed();
      }
    );

  }

  callTodaysFeedInBackground() {
    this.checkLoaderMinTime();
    this.apiCallStatus = true;
    let todayDate = new Date();
    let dd1 = ("0" + todayDate.getDate()).slice(-2);
    let mm1 = ("0" + ((todayDate.getMonth()) + 1)).slice(-2); //January is 0!
    let yyyy1 = todayDate.getFullYear();

    this.nativeStorage.getItem('user_notifications').then(
      notifications => {
        let feedCount = 0;
        let messageCount = notifications.message_count;
        let woCount = notifications.wo_count ? notifications.wo_count : 0;

        this.nativeStorage.setItem('user_notifications', { feed_count: feedCount, message_count: messageCount, wo_count: woCount })
          .then(
            () => console.log('Stored user_notifications!'),
            error => console.error('Error storing user_notifications', error)
          );
      },
      error => {
        return '';
      }
    );

    this.nativeStorage.getItem('user_auth').then(
      accessToken => {
        this.hotelCreatedDate = new Date(accessToken.hotel_created);
        this.hotelName = accessToken.hotel_name;
        let startDate = null;
        let endDate = null;
        let d = new Date();
        let dd = ("0" + d.getDate()).slice(-2);
        let mm = ("0" + ((d.getMonth()) + 1)).slice(-2); //January is 0!
        let yyyy = d.getFullYear();
        var seconds = d.getSeconds();
        var minutes = d.getMinutes();
        var hour = d.getHours();
        endDate = yyyy + '-' + mm + '-' + dd;
        startDate = this.lastFeedDate// yyyy + '-' + mm + '-' + dd;


        let addDate = "";
        if (startDate != null && endDate != null) {
          //addDate = '&start_date=' + startDate+"T00:00:00"+this.timeZoneOffset + '&end_date=' + endDate+"T"+hour+":"+minutes+":"+seconds+this.timeZoneOffset;
          addDate = '&start_date=' + startDate + "T00:00:00" + this.timeZoneOffset + '&end_date=' + endDate + "T23:59:59" + this.timeZoneOffset;
        }
        let tempApiDate = new Date();
        console.log("old date=" + tempApiDate);
        tempApiDate.setMinutes(tempApiDate.getMinutes() - 5);
        console.log("new date=" + tempApiDate);

        console.log("callTodaysFeedInBackground url: " + getFeedsUrl + '?updated_after=' + this.updateAfter + addDate);

        if (this.commonMethod.checkNetwork()) {
          this.showLoaderTodays = true;
          this.lastUpdatesAt = new Date();

          this.commonMethod.getDataWithoutLoder(getFeedsUrl + '?updated_after=' + encodeURIComponent(this.updateAfter) + addDate, accessToken).subscribe(
            data => {

              this.updateAfter = tempApiDate.toString();
              let oldDates = [];
              if (this.foundRepos.length > 0) {
                for (var key in this.foundRepos) {
                  let obj = this.foundRepos[key];
                  let firstDate = new Date(obj.date);

                  let dd2 = ("0" + firstDate.getDate()).slice(-2);
                  let mm2 = ("0" + ((firstDate.getMonth()) + 1)).slice(-2); //January is 0!
                  let yyyy2 = firstDate.getFullYear();

                  let d1 = yyyy1 + '-' + mm1 + '-' + dd1;
                  let d2 = yyyy2 + '-' + mm2 + '-' + dd2;

                  oldDates.unshift(d2);
                }
              }
              else {
                this.foundRepos = [{ date: todayDate, value: data.json() }];
              }

              /* manage date */
              let tempData = data.json();

              console.log(JSON.stringify(tempData) + " tempdata " + tempData.length);
              if (tempData.length > 0 && this.foundRepos.length > 0) {
                for (let j = tempData.length - 1; j >= 0; j--) {

                  //sync feeds  
                  let tempdateStr = new Date(tempData[j].updated_at);

                  let dd3 = ("0" + tempdateStr.getDate()).slice(-2);
                  let mm3 = ("0" + ((tempdateStr.getMonth()) + 1)).slice(-2); //January is 0!
                  let yyyy3 = tempdateStr.getFullYear();
                  let d3 = yyyy3 + '-' + mm3 + '-' + dd3;

                  /* Remove value if already exist */
                  for (var key in this.foundRepos) {
                    let obj = this.foundRepos[key];
                    for (let k = 0; k < obj.value.length; k++) {
                      if (obj.value[k].id == tempData[j].id) {
                        //this.foundRepos[key].value[k] = tempData[j];
                        this.foundRepos[key].value.splice(k, 1);
                      }
                    }
                  }

                  if (oldDates.indexOf(d3) != -1) {

                    for (var key in this.foundRepos) {
                      let obj = this.foundRepos[key];
                      let firstDate = new Date(obj.date);

                      let dd2 = ("0" + firstDate.getDate()).slice(-2);
                      let mm2 = ("0" + ((firstDate.getMonth()) + 1)).slice(-2); //January is 0!
                      let yyyy2 = firstDate.getFullYear();
                      let d2 = yyyy2 + '-' + mm2 + '-' + dd2;
                      if (d3 == d2) {
                        let insert = true;
                        for (let k = 0; k < obj.value.length; k++) {
                          if (obj.value[k].id == tempData[j].id) {
                            insert = false;
                            this.foundRepos[key].value[k] = tempData[j];
                          }
                        }
                        if (insert) {
                          this.foundRepos[key].value.unshift(tempData[j]);
                        }

                      }
                    }
                  }
                  else {
                    let array1 = [];
                    array1.push(tempData[j]);
                    console.log(JSON.stringify(tempData[j] + "   tetttts " + array1.length));
                    let cretedDate = new Date(tempData[j].updated_at);
                    let dd2 = ("0" + cretedDate.getDate()).slice(-2);
                    let mm2 = ("0" + ((cretedDate.getMonth()) + 1)).slice(-2); //January is 0!
                    let yyyy2 = cretedDate.getFullYear();

                    let d2 = yyyy2 + '-' + mm2 + '-' + dd2;

                    oldDates.unshift(d2);
                    this.foundRepos.unshift({ date: tempData[j].updated_at, value: array1 });
                  }

                }
              }


              this.nativeStorage.setItem('feedData', { data: this.foundRepos, lastDate: this.filterDate, updateAfter: this.updateAfter.toString(), lastFeedDate: this.lastFeedDate }).then(
                () => console.log('feedData Stored!'),
                error => console.error('Error storing feedData', error)
              );

              this.apiCallStatus = false;

              if (this.timeOutStatus == false) {
                this.showLoaderTodays = false;
              }
              if (this.feedId != null) { this.scrollTo(this.feedId); }
            },
            err => {
              this.apiCallStatus = false;
              console.error("Error : " + err);
            },
            () => {
              this.apiCallStatus = false;
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


  callTodaysFeed() {

    this.checkLoaderMinTime();
    this.showLoader = false;
    this.reachedOnLastDate = false;
    this.callDateFilter = true;
    this.filterDate = new Date();
    this.lastUpdatesAt = new Date();

    let alertVar = this.alertCtrl.create({
      title: 'Error!',
      subTitle: 'Invalid Details!',
      buttons: ['OK']
    });
    let dd1 = ("0" + this.filterDate.getDate()).slice(-2);
    let mm1 = ("0" + ((this.filterDate.getMonth()) + 1)).slice(-2); //January is 0!
    let yyyy1 = this.filterDate.getFullYear();
    let end_date = yyyy1 + '-' + mm1 + '-' + dd1;
    //alert(yyyy1+'-'+mm1+'-'+dd1);
    var seconds = this.filterDate.getSeconds();
    var minutes = this.filterDate.getMinutes();
    var hour = this.filterDate.getHours();
    end_date = end_date;
    this.filterDate.setDate(this.filterDate.getDate() - 1);

    let dd2 = ("0" + this.filterDate.getDate()).slice(-2);
    let mm2 = ("0" + ((this.filterDate.getMonth()) + 1)).slice(-2); //January is 0!
    let yyyy2 = this.filterDate.getFullYear();

    this.nativeStorage.getItem('user_auth').then(
      accessToken => {
        this.hotelCreatedDate = new Date(accessToken.hotel_created);
        this.hotelName = accessToken.hotel_name;
        this.updateAfter = new Date();

        console.log("callTodaysFeed url: " + getFeedsUrl + '?start_date=' + yyyy2 + '-' + mm2 + '-' + dd2 + "T00:00:00" + this.timeZoneOffset + '&end_date=' + end_date + "T23:59:59" + this.timeZoneOffset);

        if (this.commonMethod.checkNetwork()) {

          this.showLoaderTodays = true;
          this.commonMethod.getDataWithoutLoder(getFeedsUrl + '?start_date=' + yyyy2 + '-' + mm2 + '-' + dd2 + "T00:00:00" + this.timeZoneOffset + '&end_date=' + end_date + "T23:59:59" + this.timeZoneOffset, accessToken).subscribe(
            data => {

              this.foundRepos = data.json();

              let today = new Date();
              let yesterday = new Date();

              yesterday.setDate(today.getDate() - 1);
              let tempArray1 = [];
              let tempArray2 = [];
              this.lastFeedDate = yyyy2 + '-' + mm2 + '-' + dd2;

              for (var key in this.foundRepos) {
                let obj = this.foundRepos[key];
                let serverDate = new Date(obj.updated_at);
                let dd = ("0" + serverDate.getDate()).slice(-2);
                let mm = ("0" + ((serverDate.getMonth()) + 1)).slice(-2); //January is 0!
                let yyyy = serverDate.getFullYear();
                let sDate = yyyy + '-' + mm + '-' + dd;
                if (sDate == end_date) {
                  tempArray1.push(obj);
                }
                else {
                  tempArray2.push(obj);
                }
              }

              this.foundRepos = [{ date: today, value: tempArray1 }];
              this.foundRepos.push({ date: yesterday, value: tempArray2 });
              // this.findTotalFeed();
              this.nativeStorage.setItem('feedData', { data: this.foundRepos, lastDate: yesterday, updateAfter: this.updateAfter.toString(), lastFeedDate: this.lastFeedDate }).then(
                () => console.log('feedData Stored!'),
                error => console.error('Error storing feedData', error)
              );

              console.log("----" + this.foundRepos);
              //this.commonMethod.hideLoader();
              this.showLoaderTodays = false;
              if (this.feedId != null) { this.scrollTo(this.feedId); }
            },
            err => {
              //this.commonMethod.hideLoader();
              this.showLoaderTodays = false;
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

  createFeed() {
    //console.log('create feed call');
    this.navCtrl.push(CreateFeedsPage);
  }

  openDetail(id) {
    this.navCtrl.push(FeedDetailPage, { feed_id: id });
  }

  updateFilter(infiniteScroll) {

    let dd = ("0" + this.filterDate.getDate()).slice(-2);
    let mm = ("0" + ((this.filterDate.getMonth()) + 1)).slice(-2); //January is 0!
    let yyyy = this.filterDate.getFullYear();

    //alert(yyyy+'-'+mm+'-'+dd);
    console.log("hotel created date = " + this.hotelCreatedDate);

    if (this.hotelCreatedDate > this.filterDate) {
      this.reachedOnLastDate = true;
      return true;
    }

    let alertVar = this.alertCtrl.create({
      title: 'Error!',
      subTitle: 'Invalid Details!',
      buttons: ['OK']
    });

    this.nativeStorage.getItem('user_auth').then(
      accessToken => {

        if (this.commonMethod.checkNetwork()) {
          this.showLoader = true;
          this.commonMethod.getDataWithoutLoder(getFeedsUrl + '?start_date=' + yyyy + '-' + mm + '-' + dd + "T00:00:00" + this.timeZoneOffset + '&end_date=' + yyyy + '-' + mm + '-' + dd + "T23:59:59" + this.timeZoneOffset, accessToken).subscribe(
            data => {
              //this.foundRepos = data.json();

              var copy = JSON.parse(JSON.stringify(this.filterDate));

              this.foundRepos.push({ date: copy, value: data.json() });
              //this.findTotalFeed();
              console.log("==" + JSON.stringify(this.foundRepos));
              this.callDateFilter = true;
              infiniteScroll.complete();
              this.showLoader = false;
              this.lastFeedDate = yyyy + '-' + mm + '-' + dd;

              this.nativeStorage.setItem('feedData', { data: this.foundRepos, lastDate: this.filterDate, updateAfter: this.updateAfter.toString(), lastFeedDate: this.lastFeedDate }).then(
                () => console.log('feedData Stored!'),
                error => console.error('Error storing feedData', error)
              );

            },
            err => {
              alertVar.present();
              //  this.findTotalFeed();
              this.callDateFilter = true;
              this.showLoader = false;
              infiniteScroll.complete();
              //infiniteScroll.complete();
            },
            () => {
              console.log('getData completed');
              //    this.findTotalFeed();

            }
          );

        }
        else {
          this.commonMethod.showNetworkError();
          //  this.findTotalFeed();

        }

      },
      error => {
        return '';
      }
    );


  }

  doInfinite(infiniteScroll) {
    infiniteScroll.complete();
    if (this.callDateFilter == true) {
      this.filterDate.setDate(this.filterDate.getDate() - 1);
      this.callDateFilter = false;
      if (this.totalFeeds <= 8) {
        this.totalFeeds = 10;
      }
      this.updateFilter(infiniteScroll);
    }
  }

  ionViewDidEnter() {
    this.getFollowUpFeeds();
    this.nativeStorage.setItem('lastPage', { "pageName": FeedsPage.name, "index": this.navCtrl.getActive().index });
    this.platform.ready().then(() => {
      // this.platform.registerBackButtonAction(() => {

      //   this.keyboard.close();
      //   setTimeout(() => {
      //     // this.viewCtrl.dismiss();
      //     this.platform.exitApp();
      //   },
      //     100);
      // });
    });
  }
  searchData() {
    this.showFilterData = true;
    // if the value is an empty string don't filter the items
    if (this.searchQuery.trim() != '') {

      this.keyboard.close();

      if (this.searchQuery == "no" || this.searchQuery == "No") {
        this.foundRepos = [];
      }
      else {
        this.foundRepos = [{ "date": "2017-04-20T13:28:54.762Z", "value": [{ "id": 16659, "title": null, "body": "Clean room #100", "created_at": "2017-04-26T07:56:12.026-04:00", "comments_count": 0, "created_by": { "name": "Animesh Jain", "role": "Admin", "avatar": "/uploads/user/avatar/199/zn178412.jpg" } }] }, { "date": "2017-04-20T13:28:54.762Z", "value": [] }, { "date": "2017-04-20T13:28:54.762Z", "value": [{ "id": 16658, "title": null, "body": "Lorem ipaum dolor si amet. Lorem ipaum dolor si amey. Lorem ipsum dolor. Dolor si amet ipsum pisulun. Loremnlorem ipsun dolor si.", "created_at": "2017-04-24T09:55:58.207-04:00", "comments_count": 0, "created_by": { "name": "Admin", "role": "General Manager", "avatar": "/assets/adminre_theme_v120/image/avatar/avatar.png" } }, { "id": 16653, "title": null, "body": "T", "created_at": "2017-04-24T06:10:06.275-04:00", "comments_count": 1, "created_by": { "name": "Animesh Jain", "role": "Admin", "avatar": "/uploads/user/avatar/199/zn178412.jpg" } }, { "id": 16652, "title": null, "body": "Test", "created_at": "2017-04-24T06:09:59.504-04:00", "comments_count": 0, "created_by": { "name": "Animesh Jain", "role": "Admin", "avatar": "/uploads/user/avatar/199/zn178412.jpg" } }, { "id": 16651, "title": null, "body": "Ggg", "created_at": "2017-04-24T06:09:17.831-04:00", "comments_count": 0, "created_by": { "name": "Animesh Jain", "role": "Admin", "avatar": "/uploads/user/avatar/199/zn178412.jpg" } }, { "id": 16649, "title": null, "body": "New task\n", "created_at": "2017-04-24T03:52:58.295-04:00", "comments_count": 2, "created_by": { "name": "Animesh Jain", "role": "Admin", "avatar": "/uploads/user/avatar/199/zn178412.jpg" } }, { "id": 16646, "title": null, "body": "Clean room #201", "created_at": "2017-04-24T02:10:24.470-04:00", "comments_count": 3, "created_by": { "name": "Animesh Jain", "role": "Admin", "avatar": "/uploads/user/avatar/199/zn178412.jpg" } }, { "id": 16645, "title": null, "body": "Jssmaks", "created_at": "2017-04-24T01:06:19.856-04:00", "comments_count": 0, "created_by": { "name": "Admin", "role": "General Manager", "avatar": "/assets/adminre_theme_v120/image/avatar/avatar.png" } }, { "id": 16642, "title": null, "body": "New", "created_at": "2017-04-24T00:59:37.222-04:00", "comments_count": 4, "created_by": { "name": "Admin", "role": "General Manager", "avatar": "/assets/adminre_theme_v120/image/avatar/avatar.png" } }] }, { "date": "2017-04-20T13:28:54.762Z", "value": [] }, { "date": "2017-04-20T13:28:54.762Z", "value": [] }, { "date": "2017-04-20T13:28:54.762Z", "value": [{ "id": 16641, "title": null, "body": "New comment here", "created_at": "2017-04-21T14:52:06.878-04:00", "comments_count": 0, "created_by": { "name": "Admin", "role": "General Manager", "avatar": "/assets/adminre_theme_v120/image/avatar/avatar.png" } }, { "id": 16634, "title": null, "body": "Clean room #201", "created_at": "2017-04-21T01:44:45.287-04:00", "comments_count": 4, "created_by": { "name": "Animesh Jain", "role": "Admin", "avatar": "/uploads/user/avatar/199/zn178412.jpg" } }, { "id": 16633, "title": null, "body": "Key is misssing of room #100", "created_at": "2017-04-21T01:38:48.336-04:00", "comments_count": 1, "created_by": { "name": "Animesh Jain", "role": "Admin", "avatar": "/uploads/user/avatar/199/zn178412.jpg" } }] }, { "date": "2017-04-20T13:28:54.762Z", "value": [{ "id": 16632, "title": null, "body": "Need 4 towels in room 501", "created_at": "2017-04-20T12:49:39.262-04:00", "comments_count": 0, "created_by": { "name": "Admin", "role": "General Manager", "avatar": "/assets/adminre_theme_v120/image/avatar/avatar.png" } }, { "id": 16628, "title": null, "body": "Need cup of coffie in room #105", "created_at": "2017-04-20T10:54:23.633-04:00", "comments_count": 2, "created_by": { "name": "Animesh Jain", "role": "Admin", "avatar": "/uploads/user/avatar/199/zn178412.jpg" } }, { "id": 16627, "title": null, "body": "Clean room #200", "created_at": "2017-04-20T10:43:55.241-04:00", "comments_count": 0, "created_by": { "name": "Animesh Jain", "role": "Admin", "avatar": "/uploads/user/avatar/199/zn178412.jpg" } }, { "id": 16622, "title": null, "body": "Clean room #300", "created_at": "2017-04-20T04:17:36.275-04:00", "comments_count": 4, "created_by": { "name": "Animesh Jain", "role": "Admin", "avatar": "/uploads/user/avatar/199/zn178412.jpg" } }, { "id": 16621, "title": null, "body": "Testing...", "created_at": "2017-04-20T01:34:52.483-04:00", "comments_count": 1, "created_by": { "name": "Animesh Jain", "role": "Admin", "avatar": "/uploads/user/avatar/199/zn178412.jpg" } }] }];
      }
    }
  }

  openFilter() {
    //this.keyboard.show(); 
    this.showFilter = true;
    this.toggleMove();
  }

  closeFilter() {
    console.log("sanjay: close")
    this.searchQuery = "";
    this.keyboard.close();
    this.showFilter = false;
    this.showFilterData = false;
    this.toggleMove();
    this.callTodaysFeed();
  }


  editSearch() {
    this.alert = this.alertCtrl.create({
      title: 'SELECT THE DATE RANGE',
      message: '<span class="close_icon_popup" (click)="closeSearch()">close</span><ul class="popup-list"><li class="active">Last 7 days</li><li (click)="closeSearch()">Last 14 days</li><li>Last 1 month</li></ul>',
      buttons: ['APPLY'],
      cssClass: 'edit_search'
    });
    // this.alert.dismiss();
    this.alert.present();
  }

  toggleMove() {
    //this.state = (this.state === 'inactive' ? 'active' : 'inactive');
  }


  updateHtml(val, mentioned_targets, i, j) {

    let allChatMentions = [];
    if (mentioned_targets != '' && mentioned_targets != null) {
      allChatMentions = mentioned_targets;
    }

    let newValue = this.commonMethod.getTextValueWithNamesNew(allChatMentions, this.members, val);
    if (newValue.text != "" && newValue.text.length > this.textLengthValue) {
      val = newValue.text.substring(0, this.textLengthValue);
      var newValueWrap = this.commonMethod.getTextValueNew(allChatMentions, this.members, val);
      if (newValueWrap != "") {
        val = newValueWrap + "....";
      }
    } else if (newValue.html != "") {
      if (newValue.html != "") {
        val = newValue.html;
      }
    }
    this.foundRepos[i].value[j].showMore = true;
    // let htmlStr="<span '(click)=showMore("+i+","+j+")'>Read More</span>";
    val = val.replace(/text-decoration-line/g, "text-decoration");
    return val;
    //return val.length > this.textLengthValue ? val.substring(0, this.textLengthValue)  : val; 


  }
  updateHtml1(val, mentioned_targets, i, j) {
    let allChatMentions = [];
    if (mentioned_targets != '' && mentioned_targets != null) {
      allChatMentions = mentioned_targets;
    }

    // let newValue = this.commonMethod.getTextValue(allChatMentions, this.members, val);
    // if (newValue != "") {
    //    val = newValue;
    // }

    let newValue = this.commonMethod.getTextValueWithNamesNew(allChatMentions, this.members, val);
    if (newValue.html != "") {
      val = newValue.html;
    }
    this.foundRepos[i].value[j].showMore = false;
    // let htmlStr="<span '(click)=showLess("+i+","+j+")'>Read Less</span>";
    val = val.replace(/text-decoration-line/g, "text-decoration");
    return val;


  }

  showMore(i, j) {
    this.foundRepos[i].value[j].showMore = false;
  }
  showLess(i, j) {
    // alert('2');
    this.foundRepos[i].value[j].showMore = true;


  }



  closeSearch() {
    //alert('hi');
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

  openTaskChecklistPage() {
    this.googleAnalytics.bottomTabClick('Open Check List Page')
    this.navCtrl.setRoot(TaskChecklistPage);
  }


  translate(title, sourceText, langCode, i, j, mentioned_targets) {

    let allChatMentions = [];
    if (mentioned_targets != '' && mentioned_targets != null) {
      allChatMentions = mentioned_targets;
    }

    sourceText = sourceText.replace(/\n/g, "<br/>");
    let tempStr = "";
    console.log("sourceText=" + sourceText);

    if (this.touchtime == 0) {
      this.touchtime = new Date().getTime();
      setTimeout(() => {
        this.touchtime = 0
      }, 800)
    } else {
      if (((new Date().getTime()) - this.touchtime) < 800) {
        this.touchtime = 0;
        this.translateTitle(title, langCode, i, j);

        if (this.foundRepos[i].value[j].temp_data != undefined && this.foundRepos[i].value[j].temp_data != "") {
          this.foundRepos[i].value[j].body = this.foundRepos[i].value[j].temp_data;
          this.foundRepos[i].value[j].temp_data = "";
        }
        else {
          this.commonMethod.showLoader();
          this.translationservice.translateText(sourceText, langCode).subscribe(data => {

            if (data.detectedSourceLanguage == "en") {
              this.foundRepos[i].value[j].temp_data = this.foundRepos[i].value[j].body;
              this.foundRepos[i].value[j].body = tempStr + data.translatedText;
              this.commonMethod.hideLoader();
            }
            else {
              this.translationservice.translateText(sourceText, 'en').subscribe(data => {

                this.foundRepos[i].value[j].temp_data = this.foundRepos[i].value[j].body;
                this.foundRepos[i].value[j].body = tempStr + data.translatedText;
                this.commonMethod.hideLoader();

              }, error => {
                this.commonMethod.hideLoader();
                let alert = this.alertCtrl.create({
                  subTitle: 'Error:' + '<br>' + error,
                  buttons: ['OK']
                });
                alert.present();
              });
            }

          }, error => {
            this.commonMethod.hideLoader();
            let alert = this.alertCtrl.create({
              subTitle: 'Error:' + '<br>' + error,
              buttons: ['OK']
            });
            alert.present();
          });
        }

      } else {
        this.touchtime = 0;
      }
    }
  }


  translateTitle(sourceText, langCode, i, j) {
    sourceText = sourceText.replace(/\n/g, "<br/>");
    let tempStr = "";
    console.log("sourceText=" + sourceText);

    if (this.foundRepos[i].value[j].temp_title_data != undefined && this.foundRepos[i].value[j].temp_title_data != "") {
      this.foundRepos[i].value[j].title = this.foundRepos[i].value[j].temp_title_data;
      this.foundRepos[i].value[j].temp_title_data = "";
    }
    else {
      //this.commonMethod.showLoader();
      this.translationservice.translateText(sourceText, langCode).subscribe(data => {

        if (data.detectedSourceLanguage == "en") {
          this.foundRepos[i].value[j].temp_title_data = this.foundRepos[i].value[j].title;
          this.foundRepos[i].value[j].title = tempStr + data.translatedText;
          //this.commonMethod.hideLoader();
        }
        else {
          this.translationservice.translateText(sourceText, 'en').subscribe(data => {
            this.foundRepos[i].value[j].temp_title_data = this.foundRepos[i].value[j].title;
            this.foundRepos[i].value[j].title = tempStr + data.translatedText;
            //this.commonMethod.hideLoader();
          }, error => {
            //this.commonMethod.hideLoader();
            let alert = this.alertCtrl.create({
              subTitle: 'Error:' + '<br>' + error,
              buttons: ['OK']
            });
            alert.present();
          });
        }

      }, error => {
        //this.commonMethod.hideLoader();
        let alert = this.alertCtrl.create({
          subTitle: 'Error:' + '<br>' + error,
          buttons: ['OK']
        });
        alert.present();
      });
    }
  }


  getAllMembersFromDb() {
    this.sqlite.create({
      name: 'data.db',
      location: 'default'
    }).then((db: SQLiteObject) => {

      console.log("location----: " + JSON.stringify(db));


      db.executeSql("SELECT user_id, name, image FROM members", {}).then((allMembers) => {
        console.log("SELECT MEMBERS FROM DB: " + JSON.stringify(allMembers));

        if (allMembers.rows.length > 0) {
          for (let i = 0; i < allMembers.rows.length; i++) {
            let tempUserInfo = {
              "id": allMembers.rows.item(i).user_id,
              "name": allMembers.rows.item(i).name,
              "image": allMembers.rows.item(i).image,
              "type": "User"
            };

            this.members.push(tempUserInfo);
          }
        }

      }, (error1) => {
        console.log("SELECT MEMBERS ERROR: " + JSON.stringify(error1));
      });
      this.getMentionable();

      // db.executeSql("SELECT id, name FROM chat_groups", []).then((allMembers) => {
      //   console.log("SELECT GROUPs FROM DB: " + JSON.stringify(allMembers));
      //   if (allMembers.rows.length > 0) {
      //     for (let i = 0; i < allMembers.rows.length; i++) {
      //       let tempUserInfo = {
      //         "id": allMembers.rows.item(i).id,
      //         "name": allMembers.rows.item(i).name,
      //         "image": '',
      //         "type": "Department"
      //       };

      //       this.members.push(tempUserInfo);
      //     }
      //   }
      // }, (error1) => {
      //   console.log("SELECT GROUP ERROR: " + JSON.stringify(error1));
      // });

    }).catch(e => console.log(e));
  }

  getMentionable() {
    this.nativeStorage.getItem('mentionable').then(
      data => {
        if (data) {
          for (let i = 0; i < data.departments.length; i++) {
            let tempUserInfo = {
              "id": data.departments[i].id,
              "name": data.departments[i].name,
              "type": 'Department',
              "image": 'https://vertua.com.ph/wp-content/uploads/2015/03/avatar.png',
              // "total": allMembers.rows.item(i).total
            };
            this.members.push(tempUserInfo);
          }
          console.log('Mentionable Department')
          console.log(this.members)
        } else {
          this.getMentionableFromServer()
        }
      }).catch(error => {
        this.getMentionableFromServer()
      })
  }

  getMentionableFromServer() {
    this.nativeStorage.getItem('user_auth').then(
      accessToken => {
        if (this.commonMethod.checkNetwork()) {
          this.commonMethod.getDataWithoutLoder(getMentionables, accessToken).subscribe(
            data => {
              let foundRepos = data.json();
              for (let i = 0; i < foundRepos.departments.length; i++) {
                let tempUserInfo = {
                  "id": foundRepos.departments[i].id,
                  "name": foundRepos.departments[i].name,
                  "type": 'Department',
                  "image": 'https://vertua.com.ph/wp-content/uploads/2015/03/avatar.png',
                };
                this.members.push(tempUserInfo);
              }

              console.log(foundRepos)
            }, err => {
              // alertVar.present();
              console.error("Error : " + err);
            },
            () => {
              console.log('getData completed');
            })
        }
      })
  }

  showImage(url) {

    this.isPopupOpen = true;
    let w = window.screen.width / 100 * 45;
    //let imgStyle="width='"+w+"px"+' height='"+w+"px"+'";
    //console.log(w);
    this.alert = this.alertCtrl.create({
      title: '',
      message: '<div class="img-loader"></div><img src="' + url + '" class="loaded-image" alt="Loading..." >',
      cssClass: 'image_upload_alert show-image-alert',
      buttons: [
        {
          text: 'Close',
          role: 'cancel',
          handler: data => {
            console.log('Cancel clicked');
            this.isPopupOpen = false;
          }
        }
      ]
    });
    this.alert.present();
  }
  closekeyboard() {
    this.keyboard.close();
  }
  scrollTo(elementId: string) {
    if (document.getElementById(elementId) != null && document.getElementById(elementId) != undefined) {
      let yOffset = document.getElementById(elementId).offsetTop;
      this.content.scrollTo(100, yOffset - 200, 2000);
      //  alert(elementId);
    }
  }

  doRefresh(refresher) {
    refresher.complete();
    this.callTodaysFeedInBackground();
  }

  checkLoaderMinTime() {
    this.timeOutStatus = true;
    let thisObj = this;
    setTimeout(function () {
      if (thisObj.apiCallStatus == false) {
        thisObj.zone.run(() => {
          thisObj.showLoaderTodays = false;
        });
      }
      thisObj.timeOutStatus = false;
    }, 4000);
  }

  confirmWorkOrder(id, value, image_url, mentioned_targets, room_id) {
    this.alert = this.alertCtrl.create({
      message: createWorkOrderConfirmMsg,
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
            this.createWorkOrder(id, value, image_url, mentioned_targets, room_id);
          }
        }
      ]
    });
    this.alert.present();
  }

  createWorkOrder(id, value, image_url, mentioned_targets, room_id) {
    let modal = this.modalCtrl.create(CreateWorkOrderPage, { id: id, value: value, image_url: image_url, mentioned_user_ids: mentioned_targets, room_id: room_id });
    modal.onDidDismiss(data => {
      this.closekeyboard();
      this.callTodaysFeedInBackground();
    });
    modal.present();
  }

  broadcastList() {
    this.isPopupOpen = true;
    let modal = this.modalCtrl.create(BroadcastListPage);
    modal.onDidDismiss(data => {
      this.closekeyboard();
      this.isPopupOpen = false;
      /* Manage count for broadcast */
      this.nativeStorage.getItem('broadcast_count').then(
        count => {
          this.broadcast_count = count;
        },
        error => {
          return false;
        }
      );

      //this.callTodaysFeedInBackground();
    });
    modal.present();
  }


  openWorkOrderPage(id, url) {
    this.nativeStorage.getItem('user_auth').then(
      accessToken => {

        let token = accessToken.access_token ? accessToken.access_token : '';
        let property_token = accessToken.property_token ? accessToken.property_token : '';
        if (id == "") {
          url = url + "?authorization=" + token + "&property_token=" + property_token;
        }
        else {
          url = url + "&authorization=" + token + "&property_token=" + property_token;
        }
        console.log(url);
        let browser = this.iab.create(url, '_blank', 'location=no,closebuttoncaption=Back,toolbar=yes,EnableViewPortScale=yes,toolbarposition=top');
        console.log("link viewed");
        browser.on('exit').subscribe(
          () => {
            console.log('done');
          },
          err => console.error(err));

      },
      error => {
        return '';
      }
    );
  }

  openWOPage() {
    this.googleAnalytics.bottomTabClick('Open Work Order Page')
    this.navCtrl.setRoot(WorkOrderPage);
  }

  ionViewWillLeave() {
    console.log("Looks like I'm about to leave :(, clear notification Interval");
    window.clearInterval(this.interval);
  }

  findTotalFeed() {
    this.totalFeeds = this.lastfeedcount;
    if (this.totalFeeds <= 8) {
      let count = 0;
      if (this.foundRepos != '' && this.foundRepos.length > 0) {
        for (let i = 0; i < this.foundRepos.length; i++) {
          if (this.foundRepos[i].value != undefined && this.foundRepos[i].value != null) {
            count = count + this.foundRepos[i].value.length;
          }
        }
      }
      this.zone.run(() => {
        this.totalFeeds = count;
        this.lastfeedcount = count;
      });
    }
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
              //  alert("111");
              if (click.click && this.alert != undefined) {
                this.alert.dismiss();
              }
            });
        }, 2000);
      });
    });
  }

  createBroadCastConfirm(id) {
    this.alert = this.alertCtrl.create({
      message: createBroadCastConfirmMsg,
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
            // ------
            this.createBroadcast(id);
          }
        }
      ]
    });
    this.alert.present();
  }

  createBroadcast(id) {
    this.isPopupOpen = true;
    let modal = this.modalCtrl.create(createBroadcastPage, { id: id });
    modal.onDidDismiss(data => {
      this.isPopupOpen = false;
      this.closekeyboard();
      this.callTodaysFeedInBackground();
      this.updateBroadcastCount();
    });
    modal.present();
  }

  updateBroadcastCount() {
    this.nativeStorage.getItem('user_auth').then(
      accessToken => {
        /* strat api call get Broadcast List */
        if (this.commonMethod.checkNetwork()) {
          this.commonMethod.getDataWithoutLoder(getBroadcastListUrl, accessToken).subscribe(
            data => {
              let res = data.json();
              this.nativeStorage.setItem('broadcast_count', res.length)
                .then(
                  () => { console.log('Stored broadcast_count!'); this.broadcast_count = res.length; },
                  error => console.error('Error storing broadcast_count', error)
                );
            },
            err => {

            },
            () => {
              console.log('getData completed');
            }
          );
        }
        else {
          this.commonMethod.showNetworkError();
        }
        /* end api call to get Broadcast List */

      },
      error => {
        return '';
      }
    );
  }

  editWorkOrder(wo_no) {
    let modal = this.modalCtrl.create(CreateWorkOrderPage, { wo_no: wo_no, can_edit_closed_wo: this.userPermissions.wo_access.can_close });
    modal.onDidDismiss(data => {
      this.closekeyboard();
      this.callTodaysFeedInBackground();
    });
    modal.present();
  }

  compareBroadcastDate(date) {
    let currentDate = new Date();
    let broadcast_date = new Date(date);

    let dd1 = ("0" + currentDate.getDate()).slice(-2);
    let mm1 = ("0" + ((currentDate.getMonth()) + 1)).slice(-2); //January is 0!
    let yyyy1 = currentDate.getFullYear();

    let dd2 = ("0" + broadcast_date.getDate()).slice(-2);
    let mm2 = ("0" + ((broadcast_date.getMonth()) + 1)).slice(-2); //January is 0!
    let yyyy2 = broadcast_date.getFullYear();

    currentDate = new Date(yyyy1 + '-' + mm1 + '-' + dd1);
    broadcast_date = new Date(yyyy2 + '-' + mm2 + '-' + dd2);

    if (currentDate > broadcast_date) {
      return true;
    }
    else {
      return false;
    }
  }

  confirmCancelBroadcast(id, i, j) {
    this.alert = this.alertCtrl.create({
      message: cancelBroadcastConfirmMsg,
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
            this.cancelBroadcast(id, i, j);
          }
        }
      ]
    });
    this.alert.present();
  }

  cancelBroadcast(id, i, j) {
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
          let objData = { "feed": { 'broadcast_start': "", 'broadcast_end': "" } };
          url = createBroadcastUrl + "/" + id;
          console.log("dates=" + JSON.stringify(objData));

          this.foundRepos[i].value[j].cancelInProgress = true;
          this.commonMethod.putDataWithoutLoder(url, objData, accessToken).subscribe(
            data => {
              this.googleAnalytics.trackPostEvents(GoogleAnalyticsProvider.ACTION_POST_BROADCAST_DELETE, 'Broadcast is canceled')
              let foundRepos = data.json();
              console.log(foundRepos);
              /* below line commented because we are calling api in background to update page */
              //this.foundRepos[i].value[j].cancelInProgress=false;
              this.closekeyboard();
              this.callTodaysFeedInBackground();
              this.updateBroadcastCount();

            },
            err => {
              this.foundRepos[i].value[j].cancelInProgress = false;
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
  createFeedQuick(fab?: FabContainer) {
    if (fab !== undefined) {
      fab.close();
    }
    this.googleAnalytics.fabButtonClick('Create New Post')
    this.fabButtonOpened = false;
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

  confirmMarkComplete(id, i, j) {
    this.alert = this.alertCtrl.create({
      message: makrCompleteFeedConfirmMsg,
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
            this.updateFeedStatus(id, i, j, 'true');
          }
        }
      ]
    });
    this.alert.present();
  }

  updateFeedStatus(id, i, j, status) {
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
          let objData = { "feed": { 'complete': status } };
          url = updateFeedStatusUrl + "/" + id;
          console.log("dates=" + JSON.stringify(objData));

          this.foundRepos[i].value[j].markCompleteInProgress = true;
          this.commonMethod.putDataWithoutLoder(url, objData, accessToken).subscribe(
            data => {
              let foundRepos = data.json();
              console.log(foundRepos);
              /* below line commented because we are calling api in background to update page */
              this.foundRepos[i].value[j].markCompleteInProgress = false;
              this.closekeyboard();
              this.callTodaysFeedInBackground();
              this.updateBroadcastCount();

            },
            err => {
              this.foundRepos[i].value[j].markCompleteInProgress = false;
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

  confirmReopenMarkComplete(id, i, j) {
    this.alert = this.alertCtrl.create({
      message: reopenMarkCompleteFeedConfirmMsg,
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
            this.updateFeedStatus(id, i, j, 'false');
          }
        }
      ]
    });
    this.alert.present();
  }

  closeOptions(i, j) {
    this.foundRepos[i].value[j].showSeelected = false;
  }

  openOptions(i, j) {
    this.foundRepos[i].value[j].showSeelected = true;
  }

  confirmCancelFollowUp(id, i, j) {
    this.alert = this.alertCtrl.create({
      message: cancelFollowUpConfirmMsg,
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
            this.cancelFollowUp(id, i, j);
          }
        }
      ]
    });
    this.alert.present();
  }

  createFollowUpConfirm(id) {
    this.alert = this.alertCtrl.create({
      message: createFollowUpConfirmMsg,
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
            // ------
            this.updateFollowUp(id);
          }
        }
      ]
    });
    this.alert.present();
  }

  updateFollowUp(id) {
    this.isPopupOpen = true;
    let modal = this.modalCtrl.create(createFollowUpPage, { id: id });
    modal.onDidDismiss(data => {
      this.isPopupOpen = false;
      this.closekeyboard();
      this.callTodaysFeedInBackground();
      this.updateBroadcastCount();
    });
    modal.present();
  }

  cancelFollowUp(id, i, j) {
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
          let objData = { "feed": { 'follow_up_start': "", 'follow_up_end': "" } };
          url = createFollowUpUrl + "/" + id;
          console.log("dates=" + JSON.stringify(objData));

          this.foundRepos[i].value[j].cancelFollowUpInProgress = true;
          this.commonMethod.putDataWithoutLoder(url, objData, accessToken).subscribe(
            data => {
              this.googleAnalytics.trackPostEvents(GoogleAnalyticsProvider.ACTION_POST_FOLLOWUP_DELETE, 'Follow up is canceled')
              let foundRepos = data.json();
              console.log(foundRepos);
              /* below line commented because we are calling api in background to update page */
              this.foundRepos[i].value[j].cancelFollowUpInProgress = false;
              this.closekeyboard();
              this.callTodaysFeedInBackground();
              this.updateBroadcastCount();

            },
            err => {
              this.foundRepos[i].value[j].cancelFollowUpInProgress = false;
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

  getFollowUpFeeds() {
    // let alertVar = this.alertCtrl.create({
    //   title: 'Error!',
    //   subTitle: 'Invalid Details!',
    //   buttons: ['OK']
    // });

    // this.nativeStorage.getItem('user_auth').then(
    //   accessToken => {

    //     if (this.commonMethod.checkNetwork()) {

    //       this.commonMethod.getDataWithoutLoder(getFollowUpUrl, accessToken).subscribe(
    //         data => {
    //           let res = data.json();
    //           this.followUpFeeds=res;
    //           //this.rolesData = res.roles;
    //         },
    //         err => {
    //           alertVar.present();
    //           console.error("Error : " + err);
    //         },
    //         () => {
    //           console.log('getData completed');
    //         }
    //       );

    //     }
    //     else {
    //      // this.commonMethod.showNetworkError();
    //     }

    //   },
    //   error => {
    //     return '';
    //   }
    // );
  }

  next() {
    this.slides.slideNext();
  }

  prev() {
    this.slides.slidePrev();
  }

  showContextOptions(feed_id, i, j, broadcast_start, follow_up_start) {

    this.foundRepos[i].value[j].showSeelected = true;
    let followUpLabel = "Follow Up";
    if (follow_up_start != '' && follow_up_start != null) {
      followUpLabel = "Cancel Follow Up";
    }
    let broadcastLabel = "Broadcast";
    if (broadcast_start != '' && broadcast_start != null) {
      broadcastLabel = "Cancel Broadcast";
    }

    let actionSheet = this.actionSheetCtrl.create({
      title: '',
      cssClass: 'feed_action_items',
      buttons: [
        {
          text: broadcastLabel,
          icon: 'ios-megaphone-outline',
          handler: () => {
            console.log('Broadcast clicked');
            this.foundRepos[i].value[j].showSeelected = false;
            if (broadcast_start != '' && broadcast_start != null) {
              this.confirmCancelBroadcast(feed_id, i, j);
            } else {
              this.createBroadCastConfirm(feed_id);
            }
          }
        }, {
          text: followUpLabel,
          icon: 'ios-calendar-outline',
          handler: () => {
            console.log('calendar clicked');
            this.foundRepos[i].value[j].showSeelected = false;
            if (follow_up_start != '' && follow_up_start != null) {
              this.confirmCancelFollowUp(feed_id, i, j);
            } else {
              this.createFollowUpConfirm(feed_id);
            }
          }
        }, {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            console.log('Cancel clicked');
            this.foundRepos[i].value[j].showSeelected = false;
          }
        }
      ]
    });
    actionSheet.present();
  }






}

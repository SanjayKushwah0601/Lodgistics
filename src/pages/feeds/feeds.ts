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
import { SelectDateForFilterPage } from '../selectDateForFilter/selectDateForFilter';

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
  public searchResultStartDate: any;
  public searchResultEndDate: any;

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
    this.searchQuery = "";
    this.keyboard.close();
    this.showFilter = false;
    this.toggleMove();
    this.callTodaysFeed();
  }


  editSearch() {
    let alert = this.alertCtrl.create({
      title: 'SELECT THE DATE RANGE',
      message: '<span class="close_icon_popup" (click)="closeSearch()">close</span><ul class="popup-list"><li class="active">Last 7 days</li><li (click)="closeSearch()">Last 14 days</li><li>Last 1 month</li></ul>',
      buttons: ['APPLY'],
      cssClass: 'edit_search'
    });
    alert.present();
  }

  toggleMove() {
    //this.state = (this.state === 'inactive' ? 'active' : 'inactive');
  }

  test() {
    // let json = '[{"id":21368,"title":"","body":"@FOOD &amp; BEVERAGE&nbsp;","created_at":"2018-07-31T02:38:06.088-04:00","updated_at":"2018-08-03T11:00:11.825-04:00","image_url":null,"image_width":null,"image_height":null,"work_order_id":4092,"room_number":null,"broadcast_start":"2018-08-09","broadcast_end":"2018-08-31","follow_up_start":null,"follow_up_end":null,"comments_count":1,"created_by":{"id":247,"name":"Animesh (GM)","role":"General Manager","title":"GM","avatar":"https://lodgistics-development-images.s3-us-east-2.amazonaws.com/uploads/user/avatar/247/zn178412.jpg?X-Amz-Expires=600&X-Amz-Date=20180806T102325Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJNDK35POEL43BOUQ/20180806/us-east-2/s3/aws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=29719c679bbab6196fe9ce594a480eaa0d4c6315ebc3574e84c0a65d08b28c68","avatar_img_url":"https://lodgistics-development-images.s3-us-east-2.amazonaws.com/uploads/user/avatar/247/zn178412.jpg?X-Amz-Expires=600&X-Amz-Date=20180806T102325Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJNDK35POEL43BOUQ/20180806/us-east-2/s3/aws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=29719c679bbab6196fe9ce594a480eaa0d4c6315ebc3574e84c0a65d08b28c68"},"mentioned_targets":[{"id":82,"type":"Department"}],"work_order_url":"https://dev.lodgistics.com/maintenance/work_orders?id=4092","work_order":{"id":4092,"property_id":8,"description":"@FOOD &amp; BEVERAGE&nbsp;","priority":"h","status":"working","due_to_date":"2021-01-01","assigned_to_id":247,"maintainable_type":"Room","maintainable_id":6,"opened_by_user_id":247,"created_at":"2018-08-03T10:52:06.772-04:00","updated_at":"2018-08-03T10:58:01.194-04:00","closed_by_user_id":null,"first_img_url":"","second_img_url":"","location_detail":"Room #106 / Keyhole","closed_at":null,"opened_at":"2018-08-03T10:52:06.763-04:00","maintenance_checklist_item_id":8212,"work_order_url":"https://dev.lodgistics.com/maintenance/work_orders?id=4092","closed":false},"created_by_system":false,"room_id":null,"completed_at":null,"completed_by":null},{"id":21429,"title":"HI","body":"Hi","created_at":"2018-08-03T09:00:31.486-04:00","updated_at":"2018-08-03T10:38:21.646-04:00","image_url":null,"image_width":0,"image_height":0,"work_order_id":4090,"room_number":null,"broadcast_start":null,"broadcast_end":null,"follow_up_start":"2018-08-06","follow_up_end":"2018-08-09","comments_count":0,"created_by":{"id":250,"name":"Gaurav (Admin)","role":"Admin","title":"Ops Manager","avatar":"https://lodgistics-development-images.s3-us-east-2.amazonaws.com/uploads/user/avatar/250/negris_avatar.jpg?X-Amz-Expires=600&X-Amz-Date=20180806T102325Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJNDK35POEL43BOUQ/20180806/us-east-2/s3/aws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=b089bf3a0aef8613245af8784ef7a2e4a98bca19d43a8dc6fdf651ba97c718aa","avatar_img_url":"https://lodgistics-development-images.s3-us-east-2.amazonaws.com/uploads/user/avatar/250/negris_avatar.jpg?X-Amz-Expires=600&X-Amz-Date=20180806T102325Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJNDK35POEL43BOUQ/20180806/us-east-2/s3/aws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=b089bf3a0aef8613245af8784ef7a2e4a98bca19d43a8dc6fdf651ba97c718aa"},"mentioned_targets":[],"work_order_url":"https://dev.lodgistics.com/maintenance/work_orders?id=4090","work_order":{"id":4090,"property_id":8,"description":"Hi","priority":"h","status":"open","due_to_date":"2021-01-01","assigned_to_id":247,"maintainable_type":"Room","maintainable_id":5,"opened_by_user_id":250,"created_at":"2018-08-03T09:59:35.604-04:00","updated_at":"2018-08-03T09:59:35.604-04:00","closed_by_user_id":null,"first_img_url":"","second_img_url":"","location_detail":"Room #105 / Door Locks","closed_at":null,"opened_at":"2018-08-03T09:59:35.595-04:00","maintenance_checklist_item_id":2,"work_order_url":"https://dev.lodgistics.com/maintenance/work_orders?id=4090","closed":false},"created_by_system":false,"room_id":null,"completed_at":null,"completed_by":null},{"id":21430,"title":"TITLE","body":"Hi","created_at":"2018-08-03T09:55:14.332-04:00","updated_at":"2018-08-03T09:55:14.332-04:00","image_url":null,"image_width":0,"image_height":0,"work_order_id":null,"room_number":null,"broadcast_start":null,"broadcast_end":null,"follow_up_start":null,"follow_up_end":null,"comments_count":0,"created_by":{"id":250,"name":"Gaurav (Admin)","role":"Admin","title":"Ops Manager","avatar":"https://lodgistics-development-images.s3-us-east-2.amazonaws.com/uploads/user/avatar/250/negris_avatar.jpg?X-Amz-Expires=600&X-Amz-Date=20180806T102325Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJNDK35POEL43BOUQ/20180806/us-east-2/s3/aws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=b089bf3a0aef8613245af8784ef7a2e4a98bca19d43a8dc6fdf651ba97c718aa","avatar_img_url":"https://lodgistics-development-images.s3-us-east-2.amazonaws.com/uploads/user/avatar/250/negris_avatar.jpg?X-Amz-Expires=600&X-Amz-Date=20180806T102325Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJNDK35POEL43BOUQ/20180806/us-east-2/s3/aws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=b089bf3a0aef8613245af8784ef7a2e4a98bca19d43a8dc6fdf651ba97c718aa"},"mentioned_targets":[],"work_order_url":null,"work_order":null,"created_by_system":false,"room_id":null,"completed_at":null,"completed_by":null},{"id":21428,"title":"HI","body":"Hi","created_at":"2018-08-03T09:00:18.306-04:00","updated_at":"2018-08-03T09:00:18.306-04:00","image_url":null,"image_width":0,"image_height":0,"work_order_id":null,"room_number":null,"broadcast_start":null,"broadcast_end":null,"follow_up_start":null,"follow_up_end":null,"comments_count":0,"created_by":{"id":250,"name":"Gaurav (Admin)","role":"Admin","title":"Ops Manager","avatar":"https://lodgistics-development-images.s3-us-east-2.amazonaws.com/uploads/user/avatar/250/negris_avatar.jpg?X-Amz-Expires=600&X-Amz-Date=20180806T102325Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJNDK35POEL43BOUQ/20180806/us-east-2/s3/aws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=b089bf3a0aef8613245af8784ef7a2e4a98bca19d43a8dc6fdf651ba97c718aa","avatar_img_url":"https://lodgistics-development-images.s3-us-east-2.amazonaws.com/uploads/user/avatar/250/negris_avatar.jpg?X-Amz-Expires=600&X-Amz-Date=20180806T102325Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJNDK35POEL43BOUQ/20180806/us-east-2/s3/aws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=b089bf3a0aef8613245af8784ef7a2e4a98bca19d43a8dc6fdf651ba97c718aa"},"mentioned_targets":[],"work_order_url":null,"work_order":null,"created_by_system":false,"room_id":null,"completed_at":null,"completed_by":null},{"id":21427,"title":"HI","body":"Hi","created_at":"2018-08-03T08:59:54.268-04:00","updated_at":"2018-08-03T08:59:54.268-04:00","image_url":null,"image_width":0,"image_height":0,"work_order_id":null,"room_number":null,"broadcast_start":null,"broadcast_end":null,"follow_up_start":null,"follow_up_end":null,"comments_count":0,"created_by":{"id":250,"name":"Gaurav (Admin)","role":"Admin","title":"Ops Manager","avatar":"https://lodgistics-development-images.s3-us-east-2.amazonaws.com/uploads/user/avatar/250/negris_avatar.jpg?X-Amz-Expires=600&X-Amz-Date=20180806T102325Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJNDK35POEL43BOUQ/20180806/us-east-2/s3/aws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=b089bf3a0aef8613245af8784ef7a2e4a98bca19d43a8dc6fdf651ba97c718aa","avatar_img_url":"https://lodgistics-development-images.s3-us-east-2.amazonaws.com/uploads/user/avatar/250/negris_avatar.jpg?X-Amz-Expires=600&X-Amz-Date=20180806T102325Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJNDK35POEL43BOUQ/20180806/us-east-2/s3/aws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=b089bf3a0aef8613245af8784ef7a2e4a98bca19d43a8dc6fdf651ba97c718aa"},"mentioned_targets":[],"work_order_url":null,"work_order":null,"created_by_system":false,"room_id":null,"completed_at":null,"completed_by":null},{"id":21426,"title":"HILTON HOTEL BOSTON AREA","body":"Description test @ALL @HOUSEKEEPING @FOOD & BEVERAGE @MAINTENANCE @FRONT DESK @3RD PARTY VENDORS @PURCHASING @TEST DEPT @Hugo (Chief Engineer) @Nikhil (Admin) @John B (Technician) @Abhishek (FD Manager) @Animesh (GM) @Mary Jane (HK Assistant) @Exe (Engineer) @Cormac (Engineer) @Joe M (Chef) @Peter K (F&B Manager) @Akanksha (Exex HK)","created_at":"2018-08-03T08:59:03.379-04:00","updated_at":"2018-08-03T08:59:03.379-04:00","image_url":"https://lodgistics-development-images.s3-us-east-2.amazonaws.com/uploads/engage/message/image/21426/964ba2fe-a93b-4735-8b72-f512679b2b34_250_1533301442826_538085.jpg?X-Amz-Expires=600&X-Amz-Date=20180806T102325Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJNDK35POEL43BOUQ/20180806/us-east-2/s3/aws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=0d30ce58603919d098628c6d9ec179163966f8c9a93aeae31eed860e06cce392","image_width":800,"image_height":523,"work_order_id":null,"room_number":null,"broadcast_start":"2018-08-15","broadcast_end":"2018-08-15","follow_up_start":"2018-08-23","follow_up_end":"2018-08-31","comments_count":0,"created_by":{"id":250,"name":"Gaurav (Admin)","role":"Admin","title":"Ops Manager","avatar":"https://lodgistics-development-images.s3-us-east-2.amazonaws.com/uploads/user/avatar/250/negris_avatar.jpg?X-Amz-Expires=600&X-Amz-Date=20180806T102325Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJNDK35POEL43BOUQ/20180806/us-east-2/s3/aws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=b089bf3a0aef8613245af8784ef7a2e4a98bca19d43a8dc6fdf651ba97c718aa","avatar_img_url":"https://lodgistics-development-images.s3-us-east-2.amazonaws.com/uploads/user/avatar/250/negris_avatar.jpg?X-Amz-Expires=600&X-Amz-Date=20180806T102325Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJNDK35POEL43BOUQ/20180806/us-east-2/s3/aws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=b089bf3a0aef8613245af8784ef7a2e4a98bca19d43a8dc6fdf651ba97c718aa"},"mentioned_targets":[{"id":249,"type":"User"},{"id":262,"type":"User"},{"id":263,"type":"User"},{"id":254,"type":"User"},{"id":253,"type":"User"},{"id":251,"type":"User"},{"id":247,"type":"User"},{"id":248,"type":"User"},{"id":252,"type":"User"},{"id":9,"type":"User"},{"id":19,"type":"User"},{"id":466,"type":"Department"},{"id":86,"type":"Department"},{"id":85,"type":"Department"},{"id":84,"type":"Department"},{"id":83,"type":"Department"},{"id":82,"type":"Department"},{"id":13,"type":"Department"},{"id":7,"type":"Department"}],"work_order_url":null,"work_order":null,"created_by_system":false,"room_id":null,"completed_at":null,"completed_by":null},{"id":21367,"title":"","body":"@HOUSEKEEPING","created_at":"2018-07-31T01:52:48.260-04:00","updated_at":"2018-08-03T08:58:07.290-04:00","image_url":null,"image_width":0,"image_height":0,"work_order_id":4086,"room_number":null,"broadcast_start":null,"broadcast_end":null,"follow_up_start":null,"follow_up_end":null,"comments_count":0,"created_by":{"id":247,"name":"Animesh (GM)","role":"General Manager","title":"GM","avatar":"https://lodgistics-development-images.s3-us-east-2.amazonaws.com/uploads/user/avatar/247/zn178412.jpg?X-Amz-Expires=600&X-Amz-Date=20180806T102325Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJNDK35POEL43BOUQ/20180806/us-east-2/s3/aws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=29719c679bbab6196fe9ce594a480eaa0d4c6315ebc3574e84c0a65d08b28c68","avatar_img_url":"https://lodgistics-development-images.s3-us-east-2.amazonaws.com/uploads/user/avatar/247/zn178412.jpg?X-Amz-Expires=600&X-Amz-Date=20180806T102325Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJNDK35POEL43BOUQ/20180806/us-east-2/s3/aws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=29719c679bbab6196fe9ce594a480eaa0d4c6315ebc3574e84c0a65d08b28c68"},"mentioned_targets":[{"id":13,"type":"Department"}],"work_order_url":"https://dev.lodgistics.com/maintenance/work_orders?id=4086","work_order":{"id":4086,"property_id":8,"description":"@HOUSEKEEPING","priority":"l","status":"open","due_to_date":null,"assigned_to_id":253,"maintainable_type":"PublicArea","maintainable_id":501,"opened_by_user_id":247,"created_at":"2018-08-03T08:58:06.507-04:00","updated_at":"2018-08-03T08:58:06.507-04:00","closed_by_user_id":null,"first_img_url":"","second_img_url":"","location_detail":"Public Area 'Breakfast Area' / Long text item","closed_at":null,"opened_at":"2018-08-03T08:58:06.500-04:00","maintenance_checklist_item_id":8258,"work_order_url":"https://dev.lodgistics.com/maintenance/work_orders?id=4086","closed":false},"created_by_system":false,"room_id":null,"completed_at":null,"completed_by":null},{"id":21423,"title":"HILTON GARDEN HOTEL BOSTON","body":"Hi@Akanksha (Exex HK) @Animesh (GM)@Abhishek (FD Manager)","created_at":"2018-08-03T06:58:39.269-04:00","updated_at":"2018-08-03T07:02:45.000-04:00","image_url":"https://lodgistics-development-images.s3-us-east-2.amazonaws.com/uploads/engage/message/image/21423/b42209ec-ffb7-495d-8ebe-ed26dbafb436_250_1533294232760_1533294142601.jpg?X-Amz-Expires=600&X-Amz-Date=20180806T102325Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJNDK35POEL43BOUQ/20180806/us-east-2/s3/aws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=49f3c00e34657bee42c74ea2831574ade62e1c3b54589e7f8ae7628bf793667a","image_width":800,"image_height":600,"work_order_id":4075,"room_number":null,"broadcast_start":"2018-08-17","broadcast_end":"2018-08-25","follow_up_start":"2018-08-16","follow_up_end":"2018-08-24","comments_count":2,"created_by":{"id":250,"name":"Gaurav (Admin)","role":"Admin","title":"Ops Manager","avatar":"https://lodgistics-development-images.s3-us-east-2.amazonaws.com/uploads/user/avatar/250/negris_avatar.jpg?X-Amz-Expires=600&X-Amz-Date=20180806T102325Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJNDK35POEL43BOUQ/20180806/us-east-2/s3/aws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=b089bf3a0aef8613245af8784ef7a2e4a98bca19d43a8dc6fdf651ba97c718aa","avatar_img_url":"https://lodgistics-development-images.s3-us-east-2.amazonaws.com/uploads/user/avatar/250/negris_avatar.jpg?X-Amz-Expires=600&X-Amz-Date=20180806T102325Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJNDK35POEL43BOUQ/20180806/us-east-2/s3/aws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=b089bf3a0aef8613245af8784ef7a2e4a98bca19d43a8dc6fdf651ba97c718aa"},"mentioned_targets":[{"id":248,"type":"User"},{"id":247,"type":"User"},{"id":249,"type":"User"}],"work_order_url":"https://dev.lodgistics.com/maintenance/work_orders?id=4075","work_order":{"id":4075,"property_id":8,"description":"Hi@Akanksha (Exex HK) @Animesh (GM)@Abhishek (FD Manager)","priority":"m","status":"closed","due_to_date":null,"assigned_to_id":-2,"maintainable_type":"Room","maintainable_id":2,"opened_by_user_id":247,"created_at":"2018-08-03T07:02:29.766-04:00","updated_at":"2018-08-03T07:02:45.197-04:00","closed_by_user_id":247,"first_img_url":"https://lodgistics-development-images.s3-us-east-2.amazonaws.com/uploads/engage/message/image/21423/b42209ec-ffb7-495d-8ebe-ed26dbafb436_250_1533294232760_1533294142601.jpg?X-Amz-Expires=600&X-Amz-Date=20180803T110208Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJNDK35POEL43BOUQ/20180803/us-east-2/s3/aws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=968e87905b0fe9a3fc781e5e0613297c1ffcac3d6b1b51e43c22a73b51e38f74","second_img_url":"","location_detail":"Room #102 / A long named area near the entrance of the room","closed_at":"2018-08-03T07:02:44.876-04:00","opened_at":"2018-08-03T07:02:29.758-04:00","maintenance_checklist_item_id":8240,"work_order_url":"https://dev.lodgistics.com/maintenance/work_orders?id=4075","closed":true},"created_by_system":false,"room_id":null,"completed_at":null,"completed_by":null},{"id":21422,"title":"TITLE","body":"Description@Akanksha (Exex HK)","created_at":"2018-08-03T06:44:50.460-04:00","updated_at":"2018-08-03T06:44:50.460-04:00","image_url":null,"image_width":0,"image_height":0,"work_order_id":null,"room_number":null,"broadcast_start":null,"broadcast_end":null,"follow_up_start":null,"follow_up_end":null,"comments_count":0,"created_by":{"id":250,"name":"Gaurav (Admin)","role":"Admin","title":"Ops Manager","avatar":"https://lodgistics-development-images.s3-us-east-2.amazonaws.com/uploads/user/avatar/250/negris_avatar.jpg?X-Amz-Expires=600&X-Amz-Date=20180806T102325Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJNDK35POEL43BOUQ/20180806/us-east-2/s3/aws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=b089bf3a0aef8613245af8784ef7a2e4a98bca19d43a8dc6fdf651ba97c718aa","avatar_img_url":"https://lodgistics-development-images.s3-us-east-2.amazonaws.com/uploads/user/avatar/250/negris_avatar.jpg?X-Amz-Expires=600&X-Amz-Date=20180806T102325Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJNDK35POEL43BOUQ/20180806/us-east-2/s3/aws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=b089bf3a0aef8613245af8784ef7a2e4a98bca19d43a8dc6fdf651ba97c718aa"},"mentioned_targets":[{"id":249,"type":"User"}],"work_order_url":null,"work_order":null,"created_by_system":false,"room_id":null,"completed_at":null,"completed_by":null},{"id":21421,"title":"TEST IS THE PROTOTYPE TO CONFIRM ORDERS","body":"test is the prototype to confirm orders @Gaurav (Admin)","created_at":"2018-08-03T06:37:45.827-04:00","updated_at":"2018-08-03T06:37:45.827-04:00","image_url":null,"image_width":0,"image_height":0,"work_order_id":null,"room_number":null,"broadcast_start":null,"broadcast_end":null,"follow_up_start":null,"follow_up_end":null,"comments_count":0,"created_by":{"id":247,"name":"Animesh (GM)","role":"General Manager","title":"GM","avatar":"https://lodgistics-development-images.s3-us-east-2.amazonaws.com/uploads/user/avatar/247/zn178412.jpg?X-Amz-Expires=600&X-Amz-Date=20180806T102325Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJNDK35POEL43BOUQ/20180806/us-east-2/s3/aws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=29719c679bbab6196fe9ce594a480eaa0d4c6315ebc3574e84c0a65d08b28c68","avatar_img_url":"https://lodgistics-development-images.s3-us-east-2.amazonaws.com/uploads/user/avatar/247/zn178412.jpg?X-Amz-Expires=600&X-Amz-Date=20180806T102325Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJNDK35POEL43BOUQ/20180806/us-east-2/s3/aws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=29719c679bbab6196fe9ce594a480eaa0d4c6315ebc3574e84c0a65d08b28c68"},"mentioned_targets":[{"id":250,"type":"User"}],"work_order_url":null,"work_order":null,"created_by_system":false,"room_id":null,"completed_at":null,"completed_by":null},{"id":21415,"title":"","body":"@Gaurav (Admin)&nbsp;<div>Animes created this post... from web</div>","created_at":"2018-08-03T03:02:23.611-04:00","updated_at":"2018-08-03T06:15:33.534-04:00","image_url":null,"image_width":null,"image_height":null,"work_order_id":4073,"room_number":null,"broadcast_start":"2018-08-08","broadcast_end":"2018-08-17","follow_up_start":null,"follow_up_end":null,"comments_count":2,"created_by":{"id":247,"name":"Animesh (GM)","role":"General Manager","title":"GM","avatar":"https://lodgistics-development-images.s3-us-east-2.amazonaws.com/uploads/user/avatar/247/zn178412.jpg?X-Amz-Expires=600&X-Amz-Date=20180806T102325Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJNDK35POEL43BOUQ/20180806/us-east-2/s3/aws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=29719c679bbab6196fe9ce594a480eaa0d4c6315ebc3574e84c0a65d08b28c68","avatar_img_url":"https://lodgistics-development-images.s3-us-east-2.amazonaws.com/uploads/user/avatar/247/zn178412.jpg?X-Amz-Expires=600&X-Amz-Date=20180806T102325Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJNDK35POEL43BOUQ/20180806/us-east-2/s3/aws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=29719c679bbab6196fe9ce594a480eaa0d4c6315ebc3574e84c0a65d08b28c68"},"mentioned_targets":[{"id":250,"type":"User"}],"work_order_url":"https://dev.lodgistics.com/maintenance/work_orders?id=4073","work_order":{"id":4073,"property_id":8,"description":"@Gaurav (Admin)&nbsp;<div>Animes created this post... from web</div>","priority":"h","status":"open","due_to_date":null,"assigned_to_id":250,"maintainable_type":"Room","maintainable_id":5,"opened_by_user_id":250,"created_at":"2018-08-03T03:05:15.940-04:00","updated_at":"2018-08-03T03:05:15.940-04:00","closed_by_user_id":null,"first_img_url":"","second_img_url":"","location_detail":"Room #105 / A long named area near the entrance of the room","closed_at":null,"opened_at":"2018-08-03T03:05:15.932-04:00","maintenance_checklist_item_id":8240,"work_order_url":"https://dev.lodgistics.com/maintenance/work_orders?id=4073","closed":false},"created_by_system":false,"room_id":null,"completed_at":null,"completed_by":null},{"id":21420,"title":"","body":"@Gaurav (Admin)&nbsp;<div><span style=\"font-size: 24px;\">Phone Numbers\r\n</span></div><div>+91 8855887673\r\n</div><div><ul><li>020 32505165&nbsp;<br></li></ul></div><div><span style=\"font-weight: bold; font-style: italic; text-decoration-line: underline;\">Cuisines\r\n</span></div><div><span style=\"background-color: rgb(255, 0, 0);\">North Indian, Chinese, Fast Food\r\n</span></div>","created_at":"2018-08-03T03:50:13.694-04:00","updated_at":"2018-08-03T03:50:13.694-04:00","image_url":null,"image_width":null,"image_height":null,"work_order_id":null,"room_number":null,"broadcast_start":null,"broadcast_end":null,"follow_up_start":null,"follow_up_end":null,"comments_count":0,"created_by":{"id":247,"name":"Animesh (GM)","role":"General Manager","title":"GM","avatar":"https://lodgistics-development-images.s3-us-east-2.amazonaws.com/uploads/user/avatar/247/zn178412.jpg?X-Amz-Expires=600&X-Amz-Date=20180806T102325Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJNDK35POEL43BOUQ/20180806/us-east-2/s3/aws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=29719c679bbab6196fe9ce594a480eaa0d4c6315ebc3574e84c0a65d08b28c68","avatar_img_url":"https://lodgistics-development-images.s3-us-east-2.amazonaws.com/uploads/user/avatar/247/zn178412.jpg?X-Amz-Expires=600&X-Amz-Date=20180806T102325Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJNDK35POEL43BOUQ/20180806/us-east-2/s3/aws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=29719c679bbab6196fe9ce594a480eaa0d4c6315ebc3574e84c0a65d08b28c68"},"mentioned_targets":[{"id":250,"type":"User"}],"work_order_url":null,"work_order":null,"created_by_system":false,"room_id":null,"completed_at":null,"completed_by":null},{"id":21419,"title":"","body":"@Animesh (GM)","created_at":"2018-08-03T03:45:50.734-04:00","updated_at":"2018-08-03T03:46:14.925-04:00","image_url":null,"image_width":0,"image_height":0,"work_order_id":null,"room_number":null,"broadcast_start":"2018-08-09","broadcast_end":"2018-08-10","follow_up_start":null,"follow_up_end":null,"comments_count":0,"created_by":{"id":250,"name":"Gaurav (Admin)","role":"Admin","title":"Ops Manager","avatar":"https://lodgistics-development-images.s3-us-east-2.amazonaws.com/uploads/user/avatar/250/negris_avatar.jpg?X-Amz-Expires=600&X-Amz-Date=20180806T102325Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJNDK35POEL43BOUQ/20180806/us-east-2/s3/aws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=b089bf3a0aef8613245af8784ef7a2e4a98bca19d43a8dc6fdf651ba97c718aa","avatar_img_url":"https://lodgistics-development-images.s3-us-east-2.amazonaws.com/uploads/user/avatar/250/negris_avatar.jpg?X-Amz-Expires=600&X-Amz-Date=20180806T102325Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJNDK35POEL43BOUQ/20180806/us-east-2/s3/aws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=b089bf3a0aef8613245af8784ef7a2e4a98bca19d43a8dc6fdf651ba97c718aa"},"mentioned_targets":[{"id":247,"type":"User"}],"work_order_url":null,"work_order":null,"created_by_system":false,"room_id":null,"completed_at":null,"completed_by":null},{"id":21418,"title":"","body":"@Gaurav (Admin)&nbsp; hi from web","created_at":"2018-08-03T03:44:11.212-04:00","updated_at":"2018-08-03T03:44:11.212-04:00","image_url":null,"image_width":null,"image_height":null,"work_order_id":null,"room_number":null,"broadcast_start":null,"broadcast_end":null,"follow_up_start":null,"follow_up_end":null,"comments_count":0,"created_by":{"id":247,"name":"Animesh (GM)","role":"General Manager","title":"GM","avatar":"https://lodgistics-development-images.s3-us-east-2.amazonaws.com/uploads/user/avatar/247/zn178412.jpg?X-Amz-Expires=600&X-Amz-Date=20180806T102325Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJNDK35POEL43BOUQ/20180806/us-east-2/s3/aws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=29719c679bbab6196fe9ce594a480eaa0d4c6315ebc3574e84c0a65d08b28c68","avatar_img_url":"https://lodgistics-development-images.s3-us-east-2.amazonaws.com/uploads/user/avatar/247/zn178412.jpg?X-Amz-Expires=600&X-Amz-Date=20180806T102325Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJNDK35POEL43BOUQ/20180806/us-east-2/s3/aws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=29719c679bbab6196fe9ce594a480eaa0d4c6315ebc3574e84c0a65d08b28c68"},"mentioned_targets":[{"id":250,"type":"User"}],"work_order_url":null,"work_order":null,"created_by_system":false,"room_id":null,"completed_at":null,"completed_by":null},{"id":21283,"title":"CREATING SECOND POST USING THE BUTTON","body":"Will it or will it not is the question!! ?!! 🙂 only has image.","created_at":"2018-07-19T17:33:38.426-04:00","updated_at":"2018-08-03T02:54:57.000-04:00","image_url":"https://lodgistics-development-images.s3-us-east-2.amazonaws.com/uploads/engage/message/image/21283/ef709d9a-6787-467a-acd5-49dcf008ae86_9_1532036300836_2Q__.jpeg?X-Amz-Expires=600&X-Amz-Date=20180806T102325Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJNDK35POEL43BOUQ/20180806/us-east-2/s3/aws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=d13b6380296ea29416a09d347da102d286cf63a47ac93d28885d457d7ed19456","image_width":800,"image_height":600,"work_order_id":4048,"room_number":null,"broadcast_start":null,"broadcast_end":null,"follow_up_start":null,"follow_up_end":null,"comments_count":2,"created_by":{"id":9,"name":"Nikhil (Admin)","role":"Admin","title":"GM","avatar":"https://lodgistics-development-images.s3-us-east-2.amazonaws.com/uploads/user/avatar/9/Logo_only.png?X-Amz-Expires=600&X-Amz-Date=20180806T102325Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJNDK35POEL43BOUQ/20180806/us-east-2/s3/aws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=70b4f22114debe66d367fa06e7980ced4f32482475de31612a64e4fb2b450245","avatar_img_url":"https://lodgistics-development-images.s3-us-east-2.amazonaws.com/uploads/user/avatar/9/Logo_only.png?X-Amz-Expires=600&X-Amz-Date=20180806T102325Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJNDK35POEL43BOUQ/20180806/us-east-2/s3/aws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=70b4f22114debe66d367fa06e7980ced4f32482475de31612a64e4fb2b450245"},"mentioned_targets":[],"work_order_url":"https://dev.lodgistics.com/maintenance/work_orders?id=4048","work_order":{"id":4048,"property_id":8,"description":"Will it or will it not is the question!! ?!! 🙂 only has image.<br />Hi<br />Hey <br />Hello ","priority":"h","status":"closed","due_to_date":"2021-01-01","assigned_to_id":247,"maintainable_type":"Room","maintainable_id":1,"opened_by_user_id":250,"created_at":"2018-07-20T03:48:55.910-04:00","updated_at":"2018-08-03T02:54:56.578-04:00","closed_by_user_id":250,"first_img_url":"","second_img_url":"","location_detail":"Room #101 / Door Locks","closed_at":"2018-08-03T02:54:56.578-04:00","opened_at":"2018-07-20T03:48:55.901-04:00","maintenance_checklist_item_id":2,"work_order_url":"https://dev.lodgistics.com/maintenance/work_orders?id=4048","closed":true},"created_by_system":false,"room_id":null,"completed_at":"2018-07-19T17:38:33.395-04:00","completed_by":{"id":9,"name":"Nikhil (Admin)","role":"Admin","title":"GM","avatar":"https://lodgistics-development-images.s3-us-east-2.amazonaws.com/uploads/user/avatar/9/Logo_only.png?X-Amz-Expires=600&X-Amz-Date=20180806T102325Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJNDK35POEL43BOUQ/20180806/us-east-2/s3/aws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=70b4f22114debe66d367fa06e7980ced4f32482475de31612a64e4fb2b450245","avatar_img_url":"https://lodgistics-development-images.s3-us-east-2.amazonaws.com/uploads/user/avatar/9/Logo_only.png?X-Amz-Expires=600&X-Amz-Date=20180806T102325Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJNDK35POEL43BOUQ/20180806/us-east-2/s3/aws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=70b4f22114debe66d367fa06e7980ced4f32482475de31612a64e4fb2b450245"}},{"id":21381,"title":"HELLO","body":"Hiiiii @HOUSEKEEPING","created_at":"2018-08-01T07:26:26.908-04:00","updated_at":"2018-08-03T02:48:47.000-04:00","image_url":null,"image_width":0,"image_height":0,"work_order_id":4070,"room_number":null,"broadcast_start":"2018-08-01","broadcast_end":"2018-08-01","follow_up_start":null,"follow_up_end":null,"comments_count":1,"created_by":{"id":247,"name":"Animesh (GM)","role":"General Manager","title":"GM","avatar":"https://lodgistics-development-images.s3-us-east-2.amazonaws.com/uploads/user/avatar/247/zn178412.jpg?X-Amz-Expires=600&X-Amz-Date=20180806T102325Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJNDK35POEL43BOUQ/20180806/us-east-2/s3/aws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=29719c679bbab6196fe9ce594a480eaa0d4c6315ebc3574e84c0a65d08b28c68","avatar_img_url":"https://lodgistics-development-images.s3-us-east-2.amazonaws.com/uploads/user/avatar/247/zn178412.jpg?X-Amz-Expires=600&X-Amz-Date=20180806T102325Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJNDK35POEL43BOUQ/20180806/us-east-2/s3/aws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=29719c679bbab6196fe9ce594a480eaa0d4c6315ebc3574e84c0a65d08b28c68"},"mentioned_targets":[{"id":13,"type":"Department"}],"work_order_url":"https://dev.lodgistics.com/maintenance/work_orders?id=4070","work_order":{"id":4070,"property_id":8,"description":"Hiiiii @HOUSEKEEPING","priority":"h","status":"closed","due_to_date":"2021-01-01","assigned_to_id":247,"maintainable_type":"Room","maintainable_id":3,"opened_by_user_id":250,"created_at":"2018-08-03T02:47:44.953-04:00","updated_at":"2018-08-03T02:48:47.327-04:00","closed_by_user_id":247,"first_img_url":"","second_img_url":"","location_detail":"Room #103 / Another decently long name","closed_at":"2018-08-03T02:48:46.909-04:00","opened_at":"2018-08-03T02:47:44.945-04:00","maintenance_checklist_item_id":8241,"work_order_url":"https://dev.lodgistics.com/maintenance/work_orders?id=4070","closed":true},"created_by_system":false,"room_id":null,"completed_at":null,"completed_by":null},{"id":21380,"title":"HI","body":"Hi","created_at":"2018-08-01T07:25:16.065-04:00","updated_at":"2018-08-03T02:46:49.000-04:00","image_url":null,"image_width":0,"image_height":0,"work_order_id":4066,"room_number":null,"broadcast_start":"2018-08-01","broadcast_end":"2018-08-01","follow_up_start":null,"follow_up_end":null,"comments_count":1,"created_by":{"id":247,"name":"Animesh (GM)","role":"General Manager","title":"GM","avatar":"https://lodgistics-development-images.s3-us-east-2.amazonaws.com/uploads/user/avatar/247/zn178412.jpg?X-Amz-Expires=600&X-Amz-Date=20180806T102325Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJNDK35POEL43BOUQ/20180806/us-east-2/s3/aws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=29719c679bbab6196fe9ce594a480eaa0d4c6315ebc3574e84c0a65d08b28c68","avatar_img_url":"https://lodgistics-development-images.s3-us-east-2.amazonaws.com/uploads/user/avatar/247/zn178412.jpg?X-Amz-Expires=600&X-Amz-Date=20180806T102325Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJNDK35POEL43BOUQ/20180806/us-east-2/s3/aws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=29719c679bbab6196fe9ce594a480eaa0d4c6315ebc3574e84c0a65d08b28c68"},"mentioned_targets":[],"work_order_url":"https://dev.lodgistics.com/maintenance/work_orders?id=4066","work_order":{"id":4066,"property_id":8,"description":"Hi hello hey 👋 ","priority":"m","status":"closed","due_to_date":"2021-01-01","assigned_to_id":247,"maintainable_type":"Room","maintainable_id":1,"opened_by_user_id":247,"created_at":"2018-08-01T10:13:22.027-04:00","updated_at":"2018-08-03T02:46:48.599-04:00","closed_by_user_id":250,"first_img_url":"https://lodgistics-development-images.s3.us-east-2.amazonaws.com/photos/upload/14111152-9523-4bcd-b32a-1c594b798b88_247_1533132973838_cdv_photo_004.jpg","second_img_url":"","location_detail":"Room #101 / A long named area near the entrance of the room","closed_at":"2018-08-03T02:46:48.599-04:00","opened_at":"2018-08-01T10:13:22.016-04:00","maintenance_checklist_item_id":8240,"work_order_url":"https://dev.lodgistics.com/maintenance/work_orders?id=4066","closed":true},"created_by_system":false,"room_id":null,"completed_at":null,"completed_by":null},{"id":21402,"title":"","body":"@ALL","created_at":"2018-08-02T06:05:00.011-04:00","updated_at":"2018-08-03T02:45:24.824-04:00","image_url":null,"image_width":0,"image_height":0,"work_order_id":4069,"room_number":null,"broadcast_start":null,"broadcast_end":null,"follow_up_start":null,"follow_up_end":null,"comments_count":0,"created_by":{"id":247,"name":"Animesh (GM)","role":"General Manager","title":"GM","avatar":"https://lodgistics-development-images.s3-us-east-2.amazonaws.com/uploads/user/avatar/247/zn178412.jpg?X-Amz-Expires=600&X-Amz-Date=20180806T102325Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJNDK35POEL43BOUQ/20180806/us-east-2/s3/aws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=29719c679bbab6196fe9ce594a480eaa0d4c6315ebc3574e84c0a65d08b28c68","avatar_img_url":"https://lodgistics-development-images.s3-us-east-2.amazonaws.com/uploads/user/avatar/247/zn178412.jpg?X-Amz-Expires=600&X-Amz-Date=20180806T102325Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJNDK35POEL43BOUQ/20180806/us-east-2/s3/aws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=29719c679bbab6196fe9ce594a480eaa0d4c6315ebc3574e84c0a65d08b28c68"},"mentioned_targets":[{"id":7,"type":"Department"}],"work_order_url":"https://dev.lodgistics.com/maintenance/work_orders?id=4069","work_order":{"id":4069,"property_id":8,"description":"@ALL","priority":"","status":"open","due_to_date":"2021-01-01","assigned_to_id":247,"maintainable_type":"Room","maintainable_id":2,"opened_by_user_id":250,"created_at":"2018-08-03T02:45:23.335-04:00","updated_at":"2018-08-03T02:45:23.335-04:00","closed_by_user_id":null,"first_img_url":"","second_img_url":"","location_detail":"Room #102 / Fire Alarm exit plan panel","closed_at":null,"opened_at":"2018-08-03T02:45:23.327-04:00","maintenance_checklist_item_id":8216,"work_order_url":"https://dev.lodgistics.com/maintenance/work_orders?id=4069","closed":false},"created_by_system":false,"room_id":null,"completed_at":null,"completed_by":null},{"id":21406,"title":"","body":"@TEST DEPT","created_at":"2018-08-02T07:45:11.119-04:00","updated_at":"2018-08-03T02:44:02.000-04:00","image_url":null,"image_width":0,"image_height":0,"work_order_id":4067,"room_number":null,"broadcast_start":null,"broadcast_end":null,"follow_up_start":null,"follow_up_end":null,"comments_count":1,"created_by":{"id":247,"name":"Animesh (GM)","role":"General Manager","title":"GM","avatar":"https://lodgistics-development-images.s3-us-east-2.amazonaws.com/uploads/user/avatar/247/zn178412.jpg?X-Amz-Expires=600&X-Amz-Date=20180806T102325Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJNDK35POEL43BOUQ/20180806/us-east-2/s3/aws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=29719c679bbab6196fe9ce594a480eaa0d4c6315ebc3574e84c0a65d08b28c68","avatar_img_url":"https://lodgistics-development-images.s3-us-east-2.amazonaws.com/uploads/user/avatar/247/zn178412.jpg?X-Amz-Expires=600&X-Amz-Date=20180806T102325Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJNDK35POEL43BOUQ/20180806/us-east-2/s3/aws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=29719c679bbab6196fe9ce594a480eaa0d4c6315ebc3574e84c0a65d08b28c68"},"mentioned_targets":[{"id":466,"type":"Department"}],"work_order_url":"https://dev.lodgistics.com/maintenance/work_orders?id=4067","work_order":{"id":4067,"property_id":8,"description":"@TEST DEPT","priority":"l","status":"closed","due_to_date":"2021-01-01","assigned_to_id":250,"maintainable_type":"Room","maintainable_id":1,"opened_by_user_id":247,"created_at":"2018-08-02T08:02:26.000-04:00","updated_at":"2018-08-03T02:44:01.528-04:00","closed_by_user_id":250,"first_img_url":"","second_img_url":"","location_detail":"Room #101 / A long named area near the entrance of the room","closed_at":"2018-08-03T02:44:01.528-04:00","opened_at":"2018-08-02T08:02:25.991-04:00","maintenance_checklist_item_id":8240,"work_order_url":"https://dev.lodgistics.com/maintenance/work_orders?id=4067","closed":true},"created_by_system":false,"room_id":null,"completed_at":null,"completed_by":null},{"id":21408,"title":"","body":"The Hotel Hesperia is the right choice for visitors who are searching for a combination of charm, peace and quiet, and a convenient position from which to explore Venice. It is a small, comfortable hotel, situated on the Canale di Cannaregio. ... The hotel provides an internet point, and a Wi-Fi service. @Akanksha (Exex HK) @Gaurav (Admin) @Abhishek (FD Manager)","created_at":"2018-08-02T10:13:14.845-04:00","updated_at":"2018-08-03T02:43:44.000-04:00","image_url":null,"image_width":0,"image_height":0,"work_order_id":4068,"room_number":null,"broadcast_start":null,"broadcast_end":null,"follow_up_start":null,"follow_up_end":null,"comments_count":2,"created_by":{"id":247,"name":"Animesh (GM)","role":"General Manager","title":"GM","avatar":"https://lodgistics-development-images.s3-us-east-2.amazonaws.com/uploads/user/avatar/247/zn178412.jpg?X-Amz-Expires=600&X-Amz-Date=20180806T102325Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJNDK35POEL43BOUQ/20180806/us-east-2/s3/aws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=29719c679bbab6196fe9ce594a480eaa0d4c6315ebc3574e84c0a65d08b28c68","avatar_img_url":"https://lodgistics-development-images.s3-us-east-2.amazonaws.com/uploads/user/avatar/247/zn178412.jpg?X-Amz-Expires=600&X-Amz-Date=20180806T102325Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJNDK35POEL43BOUQ/20180806/us-east-2/s3/aws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=29719c679bbab6196fe9ce594a480eaa0d4c6315ebc3574e84c0a65d08b28c68"},"mentioned_targets":[{"id":248,"type":"User"},{"id":250,"type":"User"},{"id":249,"type":"User"}],"work_order_url":"https://dev.lodgistics.com/maintenance/work_orders?id=4068","work_order":{"id":4068,"property_id":8,"description":"The Hotel Hesperia is the right choice for visitors who are searching for a combination of charm, peace and quiet, and a convenient position from which to explore Venice. It is a small, comfortable hotel, situated on the Canale di Cannaregio. ... The hotel provides an internet point, and a Wi-Fi service. @Akanksha (Exex HK) @Gaurav (Admin) @Abhishek (FD Manager)","priority":"h","status":"closed","due_to_date":"2021-01-01","assigned_to_id":247,"maintainable_type":"Room","maintainable_id":1,"opened_by_user_id":247,"created_at":"2018-08-03T02:23:53.317-04:00","updated_at":"2018-08-03T02:43:44.430-04:00","closed_by_user_id":250,"first_img_url":"https://lodgistics-development-images.s3.us-east-2.amazonaws.com/photos/upload/27ae9b4e-1fa4-4ce0-9d58-c8347735f6ad_247_1533277718469_cdv_photo_001.jpg","second_img_url":"","location_detail":"Room #101 / A long named area near the entrance of the room","closed_at":"2018-08-03T02:43:44.017-04:00","opened_at":"2018-08-03T02:23:53.308-04:00","maintenance_checklist_item_id":8240,"work_order_url":"https://dev.lodgistics.com/maintenance/work_orders?id=4068","closed":true},"created_by_system":false,"room_id":null,"completed_at":null,"completed_by":null}]'
    let json = [
      {
        "id": 21451,
        "title": "HI",
        "body": "hi",
        "created_at": "2018-08-07T04:31:57.188-04:00",
        "updated_at": "2018-08-07T04:31:57.188-04:00",
        "image_url": null,
        "image_width": 0,
        "image_height": 0,
        "work_order_id": null,
        "room_number": null,
        "broadcast_start": null,
        "broadcast_end": null,
        "follow_up_start": null,
        "follow_up_end": null,
        "comments_count": 0,
        "created_by": {
          "id": 247,
          "name": "Animesh (GM)",
          "role": "General Manager",
          "title": "GM",
          "avatar": "https://lodgistics-development-images.s3-us-east-2.amazonaws.com/uploads/user/avatar/247/zn178412.jpg?X-Amz-Expires=600&X-Amz-Date=20180807T084857Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJNDK35POEL43BOUQ/20180807/us-east-2/s3/aws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=40c8d82200cddc074d656a53bf7c13feb38da76d7971dd2b76b7bfe889ffb5b5",
          "avatar_img_url": "https://lodgistics-development-images.s3-us-east-2.amazonaws.com/uploads/user/avatar/247/zn178412.jpg?X-Amz-Expires=600&X-Amz-Date=20180807T084857Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJNDK35POEL43BOUQ/20180807/us-east-2/s3/aws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=40c8d82200cddc074d656a53bf7c13feb38da76d7971dd2b76b7bfe889ffb5b5"
        },
        "mentioned_targets": [
          {
            "id": 250,
            "type": "User"
          }
        ],
        "work_order_url": null,
        "work_order": null,
        "created_by_system": false,
        "room_id": null,
        "completed_at": null,
        "completed_by": null
      },
      {
        "id": 21368,
        "title": "",
        "body": "@FOOD & BEVERAGE ",
        "created_at": "2018-07-31T02:38:06.088-04:00",
        "updated_at": "2018-08-03T11:00:11.825-04:00",
        "image_url": null,
        "image_width": null,
        "image_height": null,
        "work_order_id": 4092,
        "room_number": null,
        "broadcast_start": "2018-08-09",
        "broadcast_end": "2018-08-31",
        "follow_up_start": null,
        "follow_up_end": null,
        "comments_count": 1,
        "created_by": {
          "id": 247,
          "name": "Animesh (GM)",
          "role": "General Manager",
          "title": "GM",
          "avatar": "https://lodgistics-development-images.s3-us-east-2.amazonaws.com/uploads/user/avatar/247/zn178412.jpg?X-Amz-Expires=600&X-Amz-Date=20180806T102325Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJNDK35POEL43BOUQ/20180806/us-east-2/s3/aws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=29719c679bbab6196fe9ce594a480eaa0d4c6315ebc3574e84c0a65d08b28c68",
          "avatar_img_url": "https://lodgistics-development-images.s3-us-east-2.amazonaws.com/uploads/user/avatar/247/zn178412.jpg?X-Amz-Expires=600&X-Amz-Date=20180806T102325Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJNDK35POEL43BOUQ/20180806/us-east-2/s3/aws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=29719c679bbab6196fe9ce594a480eaa0d4c6315ebc3574e84c0a65d08b28c68"
        },
        "mentioned_targets": [
          {
            "id": 82,
            "type": "Department"
          }
        ],
        "work_order_url": "https://dev.lodgistics.com/maintenance/work_orders?id=4092",
        "work_order": {
          "id": 4092,
          "property_id": 8,
          "description": "@FOOD & BEVERAGE ",
          "priority": "h",
          "status": "working",
          "due_to_date": "2021-01-01",
          "assigned_to_id": 247,
          "maintainable_type": "Room",
          "maintainable_id": 6,
          "opened_by_user_id": 247,
          "created_at": "2018-08-03T10:52:06.772-04:00",
          "updated_at": "2018-08-03T10:58:01.194-04:00",
          "closed_by_user_id": null,
          "first_img_url": "",
          "second_img_url": "",
          "location_detail": "Room #106 / Keyhole",
          "closed_at": null,
          "opened_at": "2018-08-03T10:52:06.763-04:00",
          "maintenance_checklist_item_id": 8212,
          "work_order_url": "https://dev.lodgistics.com/maintenance/work_orders?id=4092",
          "closed": false
        },
        "created_by_system": false,
        "room_id": null,
        "completed_at": null,
        "completed_by": null
      },
      {
        "id": 21426,
        "title": "HILTON HOTEL BOSTON AREA",
        "body": "Description test @ALL @HOUSEKEEPING @FOOD & BEVERAGE @MAINTENANCE @FRONT DESK @3RD PARTY VENDORS @PURCHASING @TEST DEPT @Hugo (Chief Engineer) @Nikhil (Admin) @John B (Technician) @Abhishek (FD Manager) @Animesh (GM) @Mary Jane (HK Assistant) @Exe (Engineer) @Cormac (Engineer) @Joe M (Chef) @Peter K (F&B Manager) @Akanksha (Exex HK)",
        "created_at": "2018-08-03T08:59:03.379-04:00",
        "updated_at": "2018-08-03T08:59:03.379-04:00",
        "image_url": "https://lodgistics-development-images.s3-us-east-2.amazonaws.com/uploads/engage/message/image/21426/964ba2fe-a93b-4735-8b72-f512679b2b34_250_1533301442826_538085.jpg?X-Amz-Expires=600&X-Amz-Date=20180806T102325Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJNDK35POEL43BOUQ/20180806/us-east-2/s3/aws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=0d30ce58603919d098628c6d9ec179163966f8c9a93aeae31eed860e06cce392",
        "image_width": 800,
        "image_height": 523,
        "work_order_id": null,
        "room_number": null,
        "broadcast_start": "2018-08-15",
        "broadcast_end": "2018-08-15",
        "follow_up_start": "2018-08-23",
        "follow_up_end": "2018-08-31",
        "comments_count": 0,
        "created_by": {
          "id": 250,
          "name": "Gaurav (Admin)",
          "role": "Admin",
          "title": "Ops Manager",
          "avatar": "https://lodgistics-development-images.s3-us-east-2.amazonaws.com/uploads/user/avatar/250/negris_avatar.jpg?X-Amz-Expires=600&X-Amz-Date=20180806T102325Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJNDK35POEL43BOUQ/20180806/us-east-2/s3/aws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=b089bf3a0aef8613245af8784ef7a2e4a98bca19d43a8dc6fdf651ba97c718aa",
          "avatar_img_url": "https://lodgistics-development-images.s3-us-east-2.amazonaws.com/uploads/user/avatar/250/negris_avatar.jpg?X-Amz-Expires=600&X-Amz-Date=20180806T102325Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJNDK35POEL43BOUQ/20180806/us-east-2/s3/aws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=b089bf3a0aef8613245af8784ef7a2e4a98bca19d43a8dc6fdf651ba97c718aa"
        },
        "mentioned_targets": [
          {
            "id": 249,
            "type": "User"
          },
          {
            "id": 262,
            "type": "User"
          },
          {
            "id": 263,
            "type": "User"
          },
          {
            "id": 254,
            "type": "User"
          },
          {
            "id": 253,
            "type": "User"
          },
          {
            "id": 251,
            "type": "User"
          },
          {
            "id": 247,
            "type": "User"
          },
          {
            "id": 248,
            "type": "User"
          },
          {
            "id": 252,
            "type": "User"
          },
          {
            "id": 9,
            "type": "User"
          },
          {
            "id": 19,
            "type": "User"
          },
          {
            "id": 466,
            "type": "Department"
          },
          {
            "id": 86,
            "type": "Department"
          },
          {
            "id": 85,
            "type": "Department"
          },
          {
            "id": 84,
            "type": "Department"
          },
          {
            "id": 83,
            "type": "Department"
          },
          {
            "id": 82,
            "type": "Department"
          },
          {
            "id": 13,
            "type": "Department"
          },
          {
            "id": 7,
            "type": "Department"
          }
        ],
        "work_order_url": null,
        "work_order": null,
        "created_by_system": false,
        "room_id": null,
        "completed_at": null,
        "completed_by": null
      },
      {
        "id": 21367,
        "title": "",
        "body": "@HOUSEKEEPING",
        "created_at": "2018-07-31T01:52:48.260-04:00",
        "updated_at": "2018-08-03T08:58:07.290-04:00",
        "image_url": null,
        "image_width": 0,
        "image_height": 0,
        "work_order_id": 4086,
        "room_number": null,
        "broadcast_start": null,
        "broadcast_end": null,
        "follow_up_start": null,
        "follow_up_end": null,
        "comments_count": 0,
        "created_by": {
          "id": 247,
          "name": "Animesh (GM)",
          "role": "General Manager",
          "title": "GM",
          "avatar": "https://lodgistics-development-images.s3-us-east-2.amazonaws.com/uploads/user/avatar/247/zn178412.jpg?X-Amz-Expires=600&X-Amz-Date=20180806T102325Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJNDK35POEL43BOUQ/20180806/us-east-2/s3/aws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=29719c679bbab6196fe9ce594a480eaa0d4c6315ebc3574e84c0a65d08b28c68",
          "avatar_img_url": "https://lodgistics-development-images.s3-us-east-2.amazonaws.com/uploads/user/avatar/247/zn178412.jpg?X-Amz-Expires=600&X-Amz-Date=20180806T102325Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJNDK35POEL43BOUQ/20180806/us-east-2/s3/aws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=29719c679bbab6196fe9ce594a480eaa0d4c6315ebc3574e84c0a65d08b28c68"
        },
        "mentioned_targets": [
          {
            "id": 13,
            "type": "Department"
          }
        ],
        "work_order_url": "https://dev.lodgistics.com/maintenance/work_orders?id=4086",
        "work_order": {
          "id": 4086,
          "property_id": 8,
          "description": "@HOUSEKEEPING",
          "priority": "l",
          "status": "open",
          "due_to_date": null,
          "assigned_to_id": 253,
          "maintainable_type": "PublicArea",
          "maintainable_id": 501,
          "opened_by_user_id": 247,
          "created_at": "2018-08-03T08:58:06.507-04:00",
          "updated_at": "2018-08-03T08:58:06.507-04:00",
          "closed_by_user_id": null,
          "first_img_url": "",
          "second_img_url": "",
          "location_detail": "Public Area 'Breakfast Area' / Long text item",
          "closed_at": null,
          "opened_at": "2018-08-03T08:58:06.500-04:00",
          "maintenance_checklist_item_id": 8258,
          "work_order_url": "https://dev.lodgistics.com/maintenance/work_orders?id=4086",
          "closed": false
        },
        "created_by_system": false,
        "room_id": null,
        "completed_at": null,
        "completed_by": null
      },
      {
        "id": 21415,
        "title": "",
        "body": "@Gaurav (Admin) <div>Animes created this post... from web</div>",
        "created_at": "2018-08-03T03:02:23.611-04:00",
        "updated_at": "2018-08-03T06:15:33.534-04:00",
        "image_url": null,
        "image_width": null,
        "image_height": null,
        "work_order_id": 4073,
        "room_number": null,
        "broadcast_start": "2018-08-08",
        "broadcast_end": "2018-08-17",
        "follow_up_start": null,
        "follow_up_end": null,
        "comments_count": 2,
        "created_by": {
          "id": 247,
          "name": "Animesh (GM)",
          "role": "General Manager",
          "title": "GM",
          "avatar": "https://lodgistics-development-images.s3-us-east-2.amazonaws.com/uploads/user/avatar/247/zn178412.jpg?X-Amz-Expires=600&X-Amz-Date=20180806T102325Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJNDK35POEL43BOUQ/20180806/us-east-2/s3/aws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=29719c679bbab6196fe9ce594a480eaa0d4c6315ebc3574e84c0a65d08b28c68",
          "avatar_img_url": "https://lodgistics-development-images.s3-us-east-2.amazonaws.com/uploads/user/avatar/247/zn178412.jpg?X-Amz-Expires=600&X-Amz-Date=20180806T102325Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJNDK35POEL43BOUQ/20180806/us-east-2/s3/aws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=29719c679bbab6196fe9ce594a480eaa0d4c6315ebc3574e84c0a65d08b28c68"
        },
        "mentioned_targets": [
          {
            "id": 250,
            "type": "User"
          }
        ],
        "work_order_url": "https://dev.lodgistics.com/maintenance/work_orders?id=4073",
        "work_order": {
          "id": 4073,
          "property_id": 8,
          "description": "@Gaurav (Admin) <div>Animes created this post... from web</div>",
          "priority": "h",
          "status": "open",
          "due_to_date": null,
          "assigned_to_id": 250,
          "maintainable_type": "Room",
          "maintainable_id": 5,
          "opened_by_user_id": 250,
          "created_at": "2018-08-03T03:05:15.940-04:00",
          "updated_at": "2018-08-03T03:05:15.940-04:00",
          "closed_by_user_id": null,
          "first_img_url": "",
          "second_img_url": "",
          "location_detail": "Room #105 / A long named area near the entrance of the room",
          "closed_at": null,
          "opened_at": "2018-08-03T03:05:15.932-04:00",
          "maintenance_checklist_item_id": 8240,
          "work_order_url": "https://dev.lodgistics.com/maintenance/work_orders?id=4073",
          "closed": false
        },
        "created_by_system": false,
        "room_id": null,
        "completed_at": null,
        "completed_by": null
      },
      {
        "id": 21283,
        "title": "CREATING SECOND POST USING THE BUTTON",
        "body": "Will it or will it not is the question!! ?!! 🙂 only has image.",
        "created_at": "2018-07-19T17:33:38.426-04:00",
        "updated_at": "2018-08-03T02:54:57.000-04:00",
        "image_url": "https://lodgistics-development-images.s3-us-east-2.amazonaws.com/uploads/engage/message/image/21283/ef709d9a-6787-467a-acd5-49dcf008ae86_9_1532036300836_2Q__.jpeg?X-Amz-Expires=600&X-Amz-Date=20180806T102325Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJNDK35POEL43BOUQ/20180806/us-east-2/s3/aws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=d13b6380296ea29416a09d347da102d286cf63a47ac93d28885d457d7ed19456",
        "image_width": 800,
        "image_height": 600,
        "work_order_id": 4048,
        "room_number": null,
        "broadcast_start": null,
        "broadcast_end": null,
        "follow_up_start": null,
        "follow_up_end": null,
        "comments_count": 2,
        "created_by": {
          "id": 9,
          "name": "Nikhil (Admin)",
          "role": "Admin",
          "title": "GM",
          "avatar": "https://lodgistics-development-images.s3-us-east-2.amazonaws.com/uploads/user/avatar/9/Logo_only.png?X-Amz-Expires=600&X-Amz-Date=20180806T102325Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJNDK35POEL43BOUQ/20180806/us-east-2/s3/aws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=70b4f22114debe66d367fa06e7980ced4f32482475de31612a64e4fb2b450245",
          "avatar_img_url": "https://lodgistics-development-images.s3-us-east-2.amazonaws.com/uploads/user/avatar/9/Logo_only.png?X-Amz-Expires=600&X-Amz-Date=20180806T102325Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJNDK35POEL43BOUQ/20180806/us-east-2/s3/aws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=70b4f22114debe66d367fa06e7980ced4f32482475de31612a64e4fb2b450245"
        },
        "mentioned_targets": [
        ],
        "work_order_url": "https://dev.lodgistics.com/maintenance/work_orders?id=4048",
        "work_order": {
          "id": 4048,
          "property_id": 8,
          "description": "Will it or will it not is the question!! ?!! 🙂 only has image.<br />Hi<br />Hey <br />Hello ",
          "priority": "h",
          "status": "closed",
          "due_to_date": "2021-01-01",
          "assigned_to_id": 247,
          "maintainable_type": "Room",
          "maintainable_id": 1,
          "opened_by_user_id": 250,
          "created_at": "2018-07-20T03:48:55.910-04:00",
          "updated_at": "2018-08-03T02:54:56.578-04:00",
          "closed_by_user_id": 250,
          "first_img_url": "",
          "second_img_url": "",
          "location_detail": "Room #101 / Door Locks",
          "closed_at": "2018-08-03T02:54:56.578-04:00",
          "opened_at": "2018-07-20T03:48:55.901-04:00",
          "maintenance_checklist_item_id": 2,
          "work_order_url": "https://dev.lodgistics.com/maintenance/work_orders?id=4048",
          "closed": true
        },
        "created_by_system": false,
        "room_id": null,
        "completed_at": "2018-07-19T17:38:33.395-04:00",
        "completed_by": {
          "id": 9,
          "name": "Nikhil (Admin)",
          "role": "Admin",
          "title": "GM",
          "avatar": "https://lodgistics-development-images.s3-us-east-2.amazonaws.com/uploads/user/avatar/9/Logo_only.png?X-Amz-Expires=600&X-Amz-Date=20180806T102325Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJNDK35POEL43BOUQ/20180806/us-east-2/s3/aws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=70b4f22114debe66d367fa06e7980ced4f32482475de31612a64e4fb2b450245",
          "avatar_img_url": "https://lodgistics-development-images.s3-us-east-2.amazonaws.com/uploads/user/avatar/9/Logo_only.png?X-Amz-Expires=600&X-Amz-Date=20180806T102325Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJNDK35POEL43BOUQ/20180806/us-east-2/s3/aws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=70b4f22114debe66d367fa06e7980ced4f32482475de31612a64e4fb2b450245"
        }
      },
      {
        "id": 21408,
        "title": "",
        "body": "The Hotel Hesperia is the right choice for visitors who are searching for a combination of charm, peace and quiet, and a convenient position from which to explore Venice. It is a small, comfortable hotel, situated on the Canale di Cannaregio. ... The hotel provides an internet point, and a Wi-Fi service. @Akanksha (Exex HK) @Gaurav (Admin) @Abhishek (FD Manager)",
        "created_at": "2018-08-02T10:13:14.845-04:00",
        "updated_at": "2018-08-03T02:43:44.000-04:00",
        "image_url": null,
        "image_width": 0,
        "image_height": 0,
        "work_order_id": 4068,
        "room_number": null,
        "broadcast_start": null,
        "broadcast_end": null,
        "follow_up_start": null,
        "follow_up_end": null,
        "comments_count": 2,
        "created_by": {
          "id": 247,
          "name": "Animesh (GM)",
          "role": "General Manager",
          "title": "GM",
          "avatar": "https://lodgistics-development-images.s3-us-east-2.amazonaws.com/uploads/user/avatar/247/zn178412.jpg?X-Amz-Expires=600&X-Amz-Date=20180806T102325Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJNDK35POEL43BOUQ/20180806/us-east-2/s3/aws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=29719c679bbab6196fe9ce594a480eaa0d4c6315ebc3574e84c0a65d08b28c68",
          "avatar_img_url": "https://lodgistics-development-images.s3-us-east-2.amazonaws.com/uploads/user/avatar/247/zn178412.jpg?X-Amz-Expires=600&X-Amz-Date=20180806T102325Z&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJNDK35POEL43BOUQ/20180806/us-east-2/s3/aws4_request&X-Amz-SignedHeaders=host&X-Amz-Signature=29719c679bbab6196fe9ce594a480eaa0d4c6315ebc3574e84c0a65d08b28c68"
        },
        "mentioned_targets": [
          {
            "id": 248,
            "type": "User"
          },
          {
            "id": 250,
            "type": "User"
          },
          {
            "id": 249,
            "type": "User"
          }
        ],
        "work_order_url": "https://dev.lodgistics.com/maintenance/work_orders?id=4068",
        "work_order": {
          "id": 4068,
          "property_id": 8,
          "description": "The Hotel Hesperia is the right choice for visitors who are searching for a combination of charm, peace and quiet, and a convenient position from which to explore Venice. It is a small, comfortable hotel, situated on the Canale di Cannaregio. ... The hotel provides an internet point, and a Wi-Fi service. @Akanksha (Exex HK) @Gaurav (Admin) @Abhishek (FD Manager)",
          "priority": "h",
          "status": "closed",
          "due_to_date": "2021-01-01",
          "assigned_to_id": 247,
          "maintainable_type": "Room",
          "maintainable_id": 1,
          "opened_by_user_id": 247,
          "created_at": "2018-08-03T02:23:53.317-04:00",
          "updated_at": "2018-08-03T02:43:44.430-04:00",
          "closed_by_user_id": 250,
          "first_img_url": "https://lodgistics-development-images.s3.us-east-2.amazonaws.com/photos/upload/27ae9b4e-1fa4-4ce0-9d58-c8347735f6ad_247_1533277718469_cdv_photo_001.jpg",
          "second_img_url": "",
          "location_detail": "Room #101 / A long named area near the entrance of the room",
          "closed_at": "2018-08-03T02:43:44.017-04:00",
          "opened_at": "2018-08-03T02:23:53.308-04:00",
          "maintenance_checklist_item_id": 8240,
          "work_order_url": "https://dev.lodgistics.com/maintenance/work_orders?id=4068",
          "closed": true
        },
        "created_by_system": false,
        "room_id": null,
        "completed_at": null,
        "completed_by": null
      }
    ];

    for (let i = 0; i < json.length; i++) {
      this.updateHtmlTest(json[i].body, json[i].mentioned_targets)
    }
  }

  updateHtmlTest(val, mentioned_targets) {

    let allChatMentions = [];
    if (mentioned_targets != '' && mentioned_targets != null) {
      allChatMentions = mentioned_targets;
    }

    let newValue = this.commonMethod.getTextValueWithNamesNew(allChatMentions, this.members, val);
    if (newValue.text != "" && newValue.text.length > this.textLengthValue) {
      // val = newValue.text.substring(0, this.textLengthValue);
      var newValueWrap = this.commonMethod.getTextValueWithNamesNew(allChatMentions, this.members, newValue.text.substring(0, this.textLengthValue));
      // var newValueWrap = this.commonMethod.getTextValueNew(allChatMentions, this.members, val);
      if (newValueWrap.html != "") {
        val = newValueWrap.html + "....";
      }
    } else if (newValue.html != "") {
      if (newValue.html != "") {
        val = newValue.html;
      }
    }
    // this.foundRepos[i].value[j].showMore = true;
    // let htmlStr="<span '(click)=showMore("+i+","+j+")'>Read More</span>";
    val = val.replace(/text-decoration-line/g, "text-decoration");
    return val;
    //return val.length > this.textLengthValue ? val.substring(0, this.textLengthValue)  : val; 


  }

  updateHtml(val, mentioned_targets, i, j) {

    let allChatMentions = [];
    if (mentioned_targets != '' && mentioned_targets != null) {
      allChatMentions = mentioned_targets;
    }

    let newValue = this.commonMethod.getTextValueWithNamesNew(allChatMentions, this.members, val);
    if (newValue.text != "" && newValue.text.length > this.textLengthValue) {
      val = newValue.text.substring(0, this.textLengthValue);
      // var newValueWrap = this.commonMethod.getTextValueWithNamesNew(allChatMentions, this.members, newValue.text.substring(0, this.textLengthValue));
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

              // this.foundRepos[i].value[j].follow_up_start = objData.feed.follow_up_start;
              // this.foundRepos[i].value[j].follow_up_end = objData.feed.follow_up_end;
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



  openDateFilter(selectedDate) {
    //alert("openDateFilter"+d);
    this.isPopupOpen = true;
    let modal = this.modalCtrl.create(SelectDateForFilterPage, { selectedDate: selectedDate });
    modal.onDidDismiss(data => {
      this.isPopupOpen = false;
      console.log(data.date);
      this.searchFeedDataForDates(data.date);
      this.closekeyboard();
    });
    modal.present();

  }

  searchFeedDataForDates(date) {
    if (date) {
      //this.checkLoaderMinTime();
      console.log("callFeedsForDateSelectBackground");
      //this.apiCallStatus = true;
      let todayDate = new Date(date);
      this.searchResultEndDate = todayDate;
      let dd1 = ("0" + todayDate.getDate()).slice(-2);
      let mm1 = ("0" + ((todayDate.getMonth()) + 1)).slice(-2); //January is 0!
      let yyyy1 = todayDate.getFullYear();
      console.log(date);
      console.log(todayDate);
      let end_date = yyyy1 + '-' + mm1 + '-' + dd1;
      this.getSelectedDateData(end_date);
    }
  }

  getSelectedDateData(end_date) {

    let alertVar = this.alertCtrl.create({
      title: 'Error!',
      subTitle: 'Invalid Details!',
      buttons: ['OK']
    });

    let todayDate = new Date();
    if (!(this.searchResultStartDate >= this.searchResultEndDate)) {
      todayDate.setDate(todayDate.getDate() + 1);
    }
    this.searchResultStartDate = todayDate;
    let dd1 = ("0" + todayDate.getDate()).slice(-2);
    let mm1 = ("0" + ((todayDate.getMonth()) + 1)).slice(-2); //January is 0!
    let yyyy1 = todayDate.getFullYear();
    let start_date = yyyy1 + '-' + mm1 + '-' + dd1;

    if (this.searchResultStartDate >= this.searchResultEndDate) {
      let tempDate = JSON.parse(JSON.stringify(end_date));
      end_date = JSON.parse(JSON.stringify(start_date));
      start_date = JSON.parse(JSON.stringify(tempDate));
    }

    this.nativeStorage.getItem('user_auth').then(
      accessToken => {

        if (this.commonMethod.checkNetwork()) {

          this.commonMethod.getData(getFeedsUrl + '?start_date=' + start_date + "T00:00:00" + this.timeZoneOffset + '&end_date=' + end_date + "T00:00:00" + this.timeZoneOffset, accessToken).subscribe(
            data => {
              // foundRepos
              this.commonMethod.hideLoader();
              this.showFilter = true;
              let tempResponse = data.json();
              let tempArray1 = [];
              this.foundRepos = [];
              let currentDate = '';

              for (let i = 0; i < tempResponse.length; i++) {

                let obj = JSON.parse(JSON.stringify(tempResponse[i]));
                let serverDate = new Date(obj.updated_at);
                let dd = ("0" + serverDate.getDate()).slice(-2);
                let mm = ("0" + ((serverDate.getMonth()) + 1)).slice(-2); //January is 0!
                let yyyy = serverDate.getFullYear();
                let sDate = yyyy + '-' + mm + '-' + dd;
                tempArray1.push(obj);
                if (currentDate == '') {
                  currentDate = JSON.parse(JSON.stringify(sDate));
                }
                if (currentDate != sDate || tempResponse.length == (i + 1)) {
                  currentDate = JSON.parse(JSON.stringify(sDate));
                  this.foundRepos.push({ date: sDate, value: tempArray1 });
                  tempArray1 = [];
                }
              }

              //this.foundRepos = [{ date: today, value: tempArray1 }];

              // this.nativeStorage.setItem('feedData', { data: this.foundRepos, lastDate: yesterday, updateAfter: this.updateAfter.toString(), lastFeedDate: this.lastFeedDate }).then(
              //   () => console.log('feedData Stored!'),
              //   error => console.error('Error storing feedData', error)
              // );


            },
            err => {
              this.commonMethod.hideLoader();
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

  closeDateFilter() {
    this.navCtrl.setRoot(FeedsPage);
  }


}

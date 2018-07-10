import { Component, ViewChild, trigger, transition, style, animate, state, NgZone } from '@angular/core';
import { NavController, AlertController, Platform, Content, ModalController, FabContainer } from 'ionic-angular';
import { srviceMethodsCall } from '../../services/serviceMethods';
import { getWoListUrl } from '../../services/configURLs';
import { closeWoUrl } from '../../services/configURLs';
import { NativeStorage } from '@ionic-native/native-storage';
import { Keyboard } from '@ionic-native/keyboard';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { FeedsPage } from '../feeds/feeds';
import { MyMentionPage } from '../myMention/myMention';
import { ChattingPage } from '../chatting/chatting';
import { CreateWorkOrderPage } from '../createWorkOrder/createWorkOrder';
import { TranslationService } from '../../providers/translation.service';
import { BroadcastListPage } from '../broadcastList/broadcastList';
import { TaskChecklistPage } from '../taskChecklist/taskChecklist';
import { SendMessagePage } from '../sendMessage/sendMessage';
import { CreateFeedsPage } from '../createFeeds/createFeeds';
import 'web-animations-js/web-animations.min';

@Component({
  selector: 'page-workOrder',
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
  templateUrl: 'workOrder.html',
  providers: [srviceMethodsCall, NativeStorage, Keyboard, TranslationService, SQLite, FabContainer]
})

export class WorkOrderPage {
  @ViewChild(Content) content: Content;

  public foundRepos = [];
  public woData = [];
  public lastUpdatesAt: Date;
  public touchtime = 0;
  public members = [];
  public feedNotificationCount = 0;
  public messagesNotificationCount = 0;
  public woNotificationCount = 0;
  public interval: any;
  public showLabels = false;
  public showPreviousSelected = "";
  public showFilterData: any = false;
  public searchQuery: string = '';
  public showFilter: any = false;
  public userId = "";
  public selectedTab = "h";
  public total = { high: 0, medium: 0, low: 0 };
  public showLoaderTodays = false;
  public broadcast_count = 0;
  public userPermissions: any;
  public fabButtonOpened = false;

  constructor(public navCtrl: NavController, public commonMethod: srviceMethodsCall, public alertCtrl: AlertController, public nativeStorage: NativeStorage, public keyboard: Keyboard, public translationservice: TranslationService, private sqlite: SQLite, public zone: NgZone, public modalCtrl: ModalController, public platform: Platform, public fabContainer: FabContainer) {

    this.getAllMembersFromDb();

    this.userPermissions = {
      "wo_access": {
        "view_listing": false,
        "can_create": false,
        "view_all": false,
        "can_close": false
      }
    };
    this.platform.ready().then(() => {

      this.commonMethod.getUserPermissions().then(
        permissions => {
          this.userPermissions = permissions;
          if (!this.userPermissions.wo_access.can_create) {
            this.showFilter = true;
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

  }

  getAllMembersFromDb() {
    this.sqlite.create({
      name: 'data.db',
      location: 'default'
    }).then((db: SQLiteObject) => {

      db.executeSql("SELECT * FROM members", {}).then((allMembers) => {
        console.log("SELECT MEMBERS FROM DB: " + JSON.stringify(allMembers));

        if (allMembers.rows.length > 0) {
          for (let i = 0; i < allMembers.rows.length; i++) {
            let tempUserInfo = {
              "id": allMembers.rows.item(i).user_id,
              "name": allMembers.rows.item(i).name,
              "image": allMembers.rows.item(i).image
            };

            this.members.push(tempUserInfo);
          }
        }

      }, (error1) => {
        console.log("SELECT MEMBERS ERROR: " + JSON.stringify(error1));
      });

    }).catch(e => console.log(e));
  }

  getWoData() {

    this.nativeStorage.getItem('user_notifications').then(
      notifications => {
        let feedCount = notifications.feed_count;
        let messageCount = notifications.message_count;
        let woCount = 0;

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
          this.showLoaderTodays = true;
          this.commonMethod.getDataWithoutLoder(getWoListUrl, accessToken).subscribe(
            data => {
              this.total = { high: 0, medium: 0, low: 0 };
              this.showLabels = true;
              this.foundRepos = data.json();

              if (this.foundRepos.length > 0) {
                for (let i = 0; i < this.foundRepos.length; i++) {
                  let name = "N/A";
                  let assignTo = "N/A";

                  if (this.foundRepos[i].priority == 'h') {
                    this.total.high += 1;
                  }
                  else if (this.foundRepos[i].priority == 'm') {
                    this.total.medium += 1;
                  }
                  else if (this.foundRepos[i].priority == 'l') {
                    this.total.low += 1;
                  }

                  for (let j = 0; j < this.members.length; j++) {
                    if (this.members[j].id == this.foundRepos[i].opened_by_user_id) {
                      name = this.members[j].name;
                    }
                    if (this.members[j].id == this.foundRepos[i].assigned_to_id) {
                      assignTo = this.members[j].name;
                    }
                  }
                  if (this.foundRepos[i].assigned_to_id <= 0 || this.foundRepos[i].assigned_to_id == "" || this.foundRepos[i].assigned_to_id == null) {
                    assignTo = "UNASSIGNED";
                  }


                  this.foundRepos[i].due_days = this.getDays(new Date(this.foundRepos[i].opened_at), new Date());
                  this.foundRepos[i].created_by_name = name;
                  this.foundRepos[i].assign_to_name = assignTo;
                }
              }
              this.selectPriority(this.selectedTab);
              //this.commonMethod.hideLoader();
              console.log(this.foundRepos);
              this.showLoaderTodays = false;
              //alert(this.foundRepos); 
            },
            err => {
              this.showLoaderTodays = false;
              //this.commonMethod.hideLoader();
              alertVar.present();
              console.error("Error : " + err);
            },
            () => {
              console.log('getData completed');
            }
          );
        }
        else {
          this.showLoaderTodays = false;
          this.commonMethod.showNetworkError();
        }
      },
      error => {
        return '';
      }
    );
  }

  //TODO: Need to move this function into utility folder. 
  updateHtml(val, mentioned_user_ids) {
    //return "<span style='color:#02B9E7'>@Abhishek</span> " + val.replace(/text-decoration-line/g, "text-decoration");

    let allChatMentions = [];
    if (mentioned_user_ids != '' && mentioned_user_ids != null) {
      allChatMentions = mentioned_user_ids;
    }

    // let mentionStr = this.commonMethod.getMentionString(allChatMentions, this.members);
    // if (mentionStr != "") {
    //   val = mentionStr + val;
    // }

    let newValue = this.commonMethod.getTextValue(allChatMentions, this.members, val);
    if (newValue != "") {
      val = newValue;
    }

    return val.replace(/text-decoration-line/g, "text-decoration");
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

  openTaskChecklistPage() {
    this.navCtrl.setRoot(TaskChecklistPage);
  }

  translate(sourceText, langCode, j) {

    sourceText = sourceText.replace(/\n/g, "<br/>");

    //alert(i);
    //alert(j);
    //alert(this.foundRepos[i].value[j].id);

    if (this.touchtime == 0) {
      this.touchtime = new Date().getTime();
    } else {
      if (((new Date().getTime()) - this.touchtime) < 400) {
        //alert("double clicked");

        this.touchtime = 0;


        if (this.foundRepos[j].content.temp_data != undefined && this.foundRepos[j].content.temp_data != "") {
          this.foundRepos[j].content.content_data = this.foundRepos[j].content.temp_data;
          this.foundRepos[j].content.temp_data = "";
        }
        else {
          this.commonMethod.showLoader();
          this.translationservice.translateText(sourceText, langCode).subscribe(data => {
            this.foundRepos[j].content.temp_data = this.foundRepos[j].content.content_data;
            this.foundRepos[j].content.content_data = data.translatedText;
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

      } else {
        this.touchtime = 0;
      }
    }
  }

  doRefresh(refresher) {
    refresher.complete();
    this.getWoData();
  }

  ionViewDidEnter() {
    this.nativeStorage.setItem('lastPage', { "pageName": WorkOrderPage.name, "index": this.navCtrl.getActive().index });
    console.log("page loaded");
    this.getWoData();
  }

  ionViewWillLeave() {
    console.log("Looks like I'm about to leave :(, clear notification Interval");
    window.clearInterval(this.interval);
  }

  showDate(index) {
    if (index == 0 || this.foundRepos.length <= 0) {
      return true;
    }

    //console.log("index"+index);
    //console.log(JSON.stringify(this.foundRepos));
    //console.log("this.foundRepos[index - 1].created_at"+this.foundRepos[index - 1].created_at);
    //console.log(this.foundRepos[index].created_at);

    let oldDate = new Date(this.foundRepos[index - 1].created_at);
    let newDate = new Date(this.foundRepos[index].created_at);

    let dd1 = ("0" + oldDate.getDate()).slice(-2);
    let mm1 = ("0" + ((oldDate.getMonth()) + 1)).slice(-2); //January is 0!
    let yyyy1 = oldDate.getFullYear();

    let dd2 = ("0" + newDate.getDate()).slice(-2);
    let mm2 = ("0" + ((newDate.getMonth()) + 1)).slice(-2); //January is 0!
    let yyyy2 = newDate.getFullYear();

    if (yyyy1 + '-' + mm1 + '-' + dd1 != yyyy2 + '-' + mm2 + '-' + dd2) {
      return true;
    }
    else {
      return false;
    }
  }

  /**
   * 
   * @param workOrderId 
   */
  editWorkOrder(workOrderId) {
    let modal = this.modalCtrl.create(CreateWorkOrderPage, { wo_no: workOrderId });
    modal.onDidDismiss(data => {
      this.getWoData();
    });
    modal.present();
  }

  openOptions(i) {
    if (this.showPreviousSelected == "0" || this.showPreviousSelected != '') {
      this.woData[this.showPreviousSelected].showOption = false;
    }

    this.showPreviousSelected = i;
    this.woData[i].showOption = true;
  }

  searchData() {
    //this.showFilterData = true;
    this.keyboard.close();
    // if the value is an empty string don't filter the items
    // if (this.searchQuery.trim() != '') {

    //   this.keyboard.close();
    //   this.foundRepos = [];

    //   if (this.searchQuery == "no" || this.searchQuery == "No") {
    //     this.foundRepos = [];
    //   }
    //   else {
    //     this.foundRepos = [];
    //   }
    // }
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
    this.showFilterData = false;
    this.toggleMove();
    //this.getWoData();
    this.selectPriority(this.selectedTab);
    let thisObj = this;
    setTimeout(function () {
      thisObj.content.resize();
    }, 1000);
  }

  toggleMove() {
    //this.state = (this.state === 'inactive' ? 'active' : 'inactive');
  }

  selectTab(status) {
    this.selectedTab = status;
    this.selectPriority(status);
  }

  selectPriority(status) {
    let temp = [];
    if (this.foundRepos.length > 0) {
      for (let i = 0; i < this.foundRepos.length; i++) {
        if (this.foundRepos[i].priority == status) {

          temp.push(this.foundRepos[i]);
        }
      }
    }
    this.woData = temp;
  }

  broadcastList() {
    let modal = this.modalCtrl.create(BroadcastListPage);
    modal.onDidDismiss(data => {
      //this.callTodaysFeedInBackground();
    });
    modal.present();
  }

  searchItems() {
    let val = this.searchQuery;
    //this.selectPriority(this.selectedTab);
    this.woData = this.foundRepos;
    // this.searchQuery=val;
    if (val && val.trim() != '') {
      let temp = [];
      for (let i = 0; i < this.woData.length; i++) {
        if (this.woData[i].description.toLowerCase().indexOf(val.toLowerCase()) > -1) {
          temp.push(this.woData[i]);
        }
        else if (this.woData[i].id.toString().toLowerCase().indexOf(val.toLowerCase()) > -1) {
          temp.push(this.woData[i]);
        }
        else if (this.woData[i].location_detail.toLowerCase().indexOf(val.toLowerCase()) > -1) {
          temp.push(this.woData[i]);
        }
      }
      this.woData = temp;
    } else {
      this.selectPriority(this.selectedTab);
    }
    this.content.resize();
  }

  getDays(date1, date2) {
    let dt1 = new Date(date1);
    let dt2 = new Date(date2);
    return Math.floor((Date.UTC(dt2.getFullYear(), dt2.getMonth(), dt2.getDate()) - Date.UTC(dt1.getFullYear(), dt1.getMonth(), dt1.getDate())) / (1000 * 60 * 60 * 24));
  }

  createWorkOrder() {
    let modal = this.modalCtrl.create(CreateWorkOrderPage, { id: '', value: '', image_url: '', mentioned_user_ids: '' });
    modal.onDidDismiss(data => {
      this.getWoData();
    });
    modal.present();
  }

  closeWoCall(id, i) {
    let alertVar = this.alertCtrl.create({
      title: 'Error!',
      subTitle: 'Invalid Details!',
      buttons: ['OK']
    });
    let objData = {};
    this.nativeStorage.getItem('user_auth').then(
      accessToken => {
        if (this.commonMethod.checkNetwork()) {
          this.woData[i].closeInProgress = true;
          this.commonMethod.putDataWithoutLoder(closeWoUrl + "/" + id + "/close", objData, accessToken).subscribe(
            data => {
              this.closeWo(i);
              this.woData[i].closeInProgress = false;
              this.getWoData();
            },
            err => {
              this.woData[i].closeInProgress = false;
              console.log("Error 1: " + JSON.stringify(err.json()));
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

  closeWo(i) {
    this.woData[i].showOption = false;
    this.showPreviousSelected = "";
  }


  createFeedQuick(fab?: FabContainer) {
    if (fab !== undefined) {
      fab.close();
    }
    this.fabButtonOpened = false;
    this.createFeed();
  }

  createWorkOrderQuick(fab?: FabContainer) {
    if (fab !== undefined) {
      fab.close();
    }
    this.fabButtonOpened = false;
    this.createWorkOrder();
  }

  sendMessage(fab?: FabContainer) {
    if (fab !== undefined) {
      fab.close();
    }
    this.fabButtonOpened = false;
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

  createFeed() {
    //console.log('create feed call');
    this.navCtrl.push(CreateFeedsPage);
  }
  closekeyboard() {
    this.keyboard.close();
  }


}



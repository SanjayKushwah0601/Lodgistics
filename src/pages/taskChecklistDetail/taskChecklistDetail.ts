import { Component, ViewChild, trigger, transition, style, animate, state, NgZone } from '@angular/core';
import { NavController, AlertController, Platform, NavParams, Content, ModalController, Navbar, Events, ActionSheetController } from 'ionic-angular';
import { srviceMethodsCall } from '../../services/serviceMethods';
import { NativeStorage } from '@ionic-native/native-storage';
import { Keyboard } from '@ionic-native/keyboard';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { FeedsPage } from '../feeds/feeds';
import { MyMentionPage } from '../myMention/myMention';
import { ChattingPage } from '../chatting/chatting';
import { WorkOrderPage } from '../workOrder/workOrder';
import { getTaskChecklistDetailsUrl } from '../../services/configURLs';
import { completeTaskListItemUrl } from '../../services/configURLs';
import { finishTaskListUrl } from '../../services/configURLs';
import { markAllChecklistForPmMsg } from '../../providers/appConfig';
import { AddCommentPage } from '../addComment/addComment';
import { TaskChecklistPage } from '../taskChecklist/taskChecklist';
import { ProfilePage } from '../profile/profile';
import { MyVideosPage } from '../myVideos/myVideos';
import { CreateFeedsPage } from '../createFeeds/createFeeds';
import { startTaskChecklistUrl, getTaskListDetailsUrl } from '../../services/configURLs';
import 'web-animations-js/web-animations.min';
import { UtilMethods } from '../../services/utilMethods';

@Component({
  selector: 'page-taskChecklistDetail',
  animations: [
    trigger(
      'enterAnimation', [
        transition(':enter', [
          style({ transform: 'translateX(100%)', opacity: 0 }),
          animate('300ms', style({ transform: 'translateX(0)', opacity: 1 }))
        ]),
        transition(':leave', [
          style({ transform: 'translateX(0)', opacity: 1 }),
          animate('0ms', style({ transform: 'translateX(0%)', opacity: 0 }))
        ])
      ]
    )
  ],
  templateUrl: 'taskChecklistDetail.html',
  providers: [UtilMethods, srviceMethodsCall, NativeStorage, Keyboard, SQLite]
})

export class TaskChecklistDetailPage {
  @ViewChild(Navbar) navbar: Navbar;
  @ViewChild(Content) content: Content;

  public showDetails = false;
  public foundRepos = [];
  public feedNotificationCount = 0;
  public messagesNotificationCount = 0;
  public interval: any;
  public userPermissions: any;
  public isPopupOpen = false;
  public alert: any;
  public taskListData: any;
  public pageTitle = "";
  public animateItems = [];
  public reviewMode = false;
  public finishedByName = "";
  public canUpdateReview = false;
  public reviewerNotes = "";
  public showFooter = true;
  public spinner = false;

  constructor(public navCtrl: NavController, public commonMethod: srviceMethodsCall, public alertCtrl: AlertController, public nativeStorage: NativeStorage, public keyboard: Keyboard, private sqlite: SQLite, public zone: NgZone, public modalCtrl: ModalController, public platform: Platform, public params: NavParams, public events: Events, public actionSheetCtrl: ActionSheetController, public utilMethods: UtilMethods) {

    this.userPermissions = {
      "wo_access": {
        "view_listing": false,
        "can_create": false,
        "can_close": false
      }
    };

    let type = this.params.get('type') ? this.params.get('type') : '';
    if (type == "start_resume") {
      let id = this.params.get('id') ? this.params.get('id') : '';
      let name = this.params.get('name') ? this.params.get('name') : '';
      let task_list_record_id = this.params.get('task_list_record_id') ? this.params.get('task_list_record_id') : '';
      this.start(id, task_list_record_id, name);
    } else if (type == "view_review") {

      let id = this.params.get('id') ? this.params.get('id') : '';
      let name = this.params.get('name') ? this.params.get('name') : '';
      let task_list_record_id = this.params.get('task_list_record_id') ? this.params.get('task_list_record_id') : '';
      let finishedByName = this.params.get('finished_by_name') ? this.params.get('finished_by_name') : '';

      this.review(id, task_list_record_id, name, finishedByName);

    } else {
      this.taskListData = this.params.get('listData') ? this.params.get('listData') : '';
      this.pageTitle = this.params.get('name') ? this.params.get('name') : '';
      this.reviewMode = this.params.get('review') ? this.params.get('review') : false;
      this.finishedByName = this.params.get('finished_by_name') ? this.params.get('finished_by_name') : '';
      this.canUpdateReview = (this.params.get('permission_to') && this.params.get('permission_to') == 'review' && this.taskListData.status != 'reviewed') ? true : false;

      if (this.taskListData) {

        this.reviewerNotes = this.taskListData.reviewer_notes;
        //this.canUpdateReview=true;

        let that = this;
        for (let i = 0; i < that.taskListData.categories.length; i++) {
          setTimeout(function () {
            that.animateItems.push(that.taskListData.categories[i]);
          }, 500 * (i + 1));
        }
      }

    }

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

      // if (this.taskListData) {

      //   this.reviewerNotes=this.taskListData.reviewer_notes;
      //   //this.canUpdateReview=true;

      //   let that = this;
      //   for (let i = 0; i < that.taskListData.categories.length; i++) {
      //       setTimeout(function () {
      //         that.animateItems.push(that.taskListData.categories[i]);
      //       }, 500 * (i+1));
      //   }
      // }



    });








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
    //this.nativeStorage.setItem('lastPage', { "pageName": TaskChecklistDetailPage.name, "index": this.navCtrl.getActive().index });
    console.log("page loaded");
    // this.getRoomChecklistItems();

    this.navbar.backButtonClick = (e: UIEvent) => {
      // Print this event to the console
      console.log(e);

      // Navigate to another page
      this.events.publish('hide:keyboard');
      this.keyboard.close();
      setTimeout(() => {
        // this.navCtrl.pop();
        this.nativeStorage.getItem("lastPage")
          .then(
            pageDetail => {
              if (pageDetail.pageName) {
                if (pageDetail.pageName == MyMentionPage.name) {
                  this.navCtrl.setRoot(MyMentionPage);
                } else if (pageDetail.pageName == FeedsPage.name) {
                  this.navCtrl.setRoot(FeedsPage);
                } else if (pageDetail.pageName == ProfilePage.name) {
                  this.navCtrl.pop({});
                } else if (pageDetail.pageName == MyVideosPage.name) {
                  //this.navCtrl.setRoot(ProfilePage);
                  this.navCtrl.pop({});
                } else if (pageDetail.pageName == CreateFeedsPage.name) {
                  this.navCtrl.push(CreateFeedsPage)
                } else if (pageDetail.pageName == WorkOrderPage.name) {
                  this.navCtrl.setRoot(WorkOrderPage);
                } else if (pageDetail.pageName == TaskChecklistPage.name || pageDetail.pageName == TaskChecklistDetailPage.name) {
                  this.navCtrl.setRoot(TaskChecklistPage);
                } else {
                  this.navCtrl.setRoot(ChattingPage);
                }
              }
              else {
                this.navCtrl.setRoot(ChattingPage);
              }
            }),
          error => {
            this.navCtrl.setRoot(ChattingPage);
          };
        //this.navCtrl.setRoot(ChattingPage);
      },
        100);

    }

  }

  ionViewWillLeave() {
    this.showFooter = false;
    console.log("Looks like I'm about to leave :(, clear notification Interval");
    window.clearInterval(this.interval);
  }

  confirmMarkAll(categoryName, main_index, sub_index, item_id) {
    this.alert = this.alertCtrl.create({
      //message: markAllChecklistForPmMsg,
      message: "Do you want to mark all items for " + categoryName + " as complete?",
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
            this.markCompleteItem(main_index, sub_index, item_id, 'category', '');
          }
        }
      ]
    });
    this.alert.present();
  }

  closekeyboard() {
    this.keyboard.close();
  }

  completeItem(name, main_index, sub_index, item_id) {
    this.markCompleteItem(main_index, sub_index, item_id, 'item', '');
  }

  addComment(main_index, sub_index, item_id, commentText) {
    this.closeOption(main_index, sub_index);
    let modal = this.modalCtrl.create(AddCommentPage, { comment: commentText });
    modal.onDidDismiss(data => {
      if (data.msg != "undefined" && data.msg != null && data.msg != "") {
        this.markCompleteItem(main_index, sub_index, item_id, 'item', data.msg);
      }
      this.closekeyboard();
      this.isPopupOpen = false;
    });
    this.isPopupOpen = true;
    modal.present();
  }

  showTaskDetail() {
    this.showDetails = true;
  }
  hideTaskDetail() {
    this.showDetails = false;
  }

  getTotalCompleted(res) {
    let total = 0;
    if (res.length > 0) {
      for (let i = 0; i < res.length; i++) {
        if (res[i].completed_at) {
          total += 1;
        }
      }
    }
    return total;
  }

  markCompleteItem(main_index, sub_index, item_id, field, commentText) {

    let alertVar = this.alertCtrl.create({
      title: 'Error!',
      subTitle: 'Invalid Details!',
      buttons: ['OK']
    });

    let objData = {};
    if (commentText != '') {
      commentText = this.utilMethods.nlToBr(commentText);
      objData = { id: item_id, task_item_record: { status: '', comment: commentText.trim() } };
    } else {
      objData = { id: item_id, task_item_record: { status: 'completed', } };
    }

    this.nativeStorage.getItem('user_auth').then(

      accessToken => {

        if (this.commonMethod.checkNetwork()) {

          let url = completeTaskListItemUrl + "/" + item_id + "/complete";

          if (field != 'category') {
            url += "?category=no";
            if (commentText == '') {
              this.animateItems[main_index].item_records[sub_index].inProgress = true;
            }
          } else {
            url += "?category=yes";
            if (commentText == '') {
              this.animateItems[main_index].inProgress = true;
            }
          }

          this.commonMethod.postDataWithoutLoder(url, objData, accessToken).subscribe(
            data => {
              //let res=data.json();
              //this.animateItems[main_index].item_records[sub_index].completed_at = new Date();
              //alert(data.json());
              if (field != 'category' && commentText == '') {
                this.animateItems[main_index].item_records[sub_index].completed_at = new Date();
                // let allDone=true;
                // for(let k=0;k<this.animateItems[main_index].item_records.length;k++)
                // {
                //   if(this.animateItems[main_index].item_records[k].completed_at=="null" || this.animateItems[main_index].item_records[k].completed_at==null || this.animateItems[main_index].item_records[k].completed_at==""){
                //     allDone=false;
                //   }
                // }
                // if(allDone==true)
                // {
                //   this.animateItems[main_index].completed_at = new Date();
                // }
              }
              else if (commentText == '') {
                for (let k = 0; k < this.animateItems[main_index].item_records.length; k++) {
                  this.animateItems[main_index].item_records[k].completed_at = new Date();
                }
                //this.animateItems[main_index].completed_at = new Date();
              }
              else if (commentText != '') {
                let thisObj = this;
                this.zone.run(() => {
                  thisObj.animateItems[main_index].item_records[sub_index].comment = commentText.trim();
                });
              }

              if (field != 'category') {
                this.animateItems[main_index].item_records[sub_index].inProgress = false;
              } else {
                this.animateItems[main_index].inProgress = false;
              }
            },
            err => {
              if (field != 'category') {
                this.animateItems[main_index].item_records[sub_index].inProgress = false;
              } else {
                this.animateItems[main_index].inProgress = false;
              }
              //this.commonMethod.hideLoader();
              console.log("Error 1: " + JSON.stringify(err.json()));
              let res = err.json();

              if (typeof (res.error) !== undefined) {
                let alertVarErr = this.alertCtrl.create({
                  title: 'Error!',
                  subTitle: res.error ? res.error : 'Invalid Details!',
                  buttons: ['OK']
                });
                alertVarErr.present();
              }
              else {
                let alertVarErr = this.alertCtrl.create({
                  title: 'Error!',
                  subTitle: 'Invalid Details!',
                  buttons: ['OK']
                });
                alertVarErr.present();
              }

            },
            () => {
              if (field != 'category') {
                this.animateItems[main_index].item_records[sub_index].inProgress = false;
              } else {
                this.animateItems[main_index].inProgress = false;
              }
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


  }


  finish(id) {
    this.alert = this.alertCtrl.create({
      message: "Do you want to finish this?",
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
            this.markFinish(id);
          }
        }
      ]
    });
    this.alert.present();
  }

  markFinish(id) {

    let alertVar = this.alertCtrl.create({
      title: 'Error!',
      subTitle: 'Invalid Details!',
      buttons: ['OK']
    });

    let objData = { id: id };

    this.nativeStorage.getItem('user_auth').then(

      accessToken => {

        if (this.commonMethod.checkNetwork()) {

          this.commonMethod.postData(finishTaskListUrl + "/" + id + "/finish", objData, accessToken).subscribe(
            data => {
              //let res=data.json();
              this.navCtrl.setRoot(TaskChecklistPage);
              //alert(data.json());
            },
            err => {
              this.commonMethod.hideLoader();
              console.log("Error 1: " + JSON.stringify(err.json()));
              let res = err.json();

              if (typeof (res.error) !== undefined) {
                let alertVarErr = this.alertCtrl.create({
                  title: 'Error!',
                  subTitle: res.error ? res.error : 'Invalid Details!',
                  buttons: ['OK']
                });
                alertVarErr.present();
              }
              else {
                let alertVarErr = this.alertCtrl.create({
                  title: 'Error!',
                  subTitle: 'Invalid Details!',
                  buttons: ['OK']
                });
                alertVarErr.present();
              }

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

  reviewComplete(id) {
    this.alert = this.alertCtrl.create({
      message: "Mark review completed for this checklist for " + this.finishedByName + "?",
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
            this.reviewFinish(id, true);
          }
        }
      ]
    });
    this.alert.present();
  }

  reviewFinish(id, isReviewFinih) {

    let alertVar = this.alertCtrl.create({
      title: 'Error!',
      subTitle: 'Invalid Details!',
      buttons: ['OK']
    });

    let finalStatus = "";
    if (isReviewFinih) {
      finalStatus = "reviewed";
    }

    this.reviewerNotes = this.utilMethods.nlToBr(this.reviewerNotes);
    let objData = { id: id, status: finalStatus, notes: this.reviewerNotes };

    this.nativeStorage.getItem('user_auth').then(

      accessToken => {

        if (this.commonMethod.checkNetwork()) {

          this.commonMethod.postData(finishTaskListUrl + "/" + id + "/review", objData, accessToken).subscribe(
            data => {
              //let res=data.json();
              if (isReviewFinih) {
                this.navCtrl.setRoot(TaskChecklistPage);
                //alert(data.json());
              }
            },
            err => {
              this.commonMethod.hideLoader();
              console.log("Error 1: " + JSON.stringify(err.json()));
              let res = err.json();

              if (typeof (res.error) !== undefined) {
                let alertVarErr = this.alertCtrl.create({
                  title: 'Error!',
                  subTitle: res.error ? res.error : 'Invalid Details!',
                  buttons: ['OK']
                });
                alertVarErr.present();
              }
              else {
                let alertVarErr = this.alertCtrl.create({
                  title: 'Error!',
                  subTitle: 'Invalid Details!',
                  buttons: ['OK']
                });
                alertVarErr.present();
              }

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

  addReviewComment(id) {
    let modal = this.modalCtrl.create(AddCommentPage, { comment: this.reviewerNotes });
    modal.onDidDismiss(data => {
      if (data.msg != "undefined" && data.msg != null && data.msg != "") {
        this.reviewerNotes = data.msg;
        this.reviewFinish(id, false);
      }
      this.closekeyboard();
      this.isPopupOpen = false;
    });
    this.isPopupOpen = true;
    modal.present();
  }

  /**
   * Method will be called on lond press on any checklist details click
   * 
   * @param mainIndex position of the work order in the list
   * @param subIndex 
   * @param itemId 
   * @param commentText 
   */
  showContextOptions(mainIndex, subIndex, itemId, commentText) {
    let actionSheet = this.actionSheetCtrl.create({
      title: '',
      cssClass: 'feed_action_items',
    });
    actionSheet.addButton({
      text: 'Comment',
      icon: 'ios-text-outline',
      handler: () => {
        console.log('ActionSheet Comment');
        this.addComment(mainIndex, subIndex, itemId, commentText)
      }
    });
    actionSheet.addButton({ text: 'Cancel', 'role': 'cancel' });
    actionSheet.present();
  }

  openOptions(id, j, k) {
    this.animateItems[j].item_records[k].showOption = true;
  }
  closeOption(j, k) {
    this.animateItems[j].item_records[k].showOption = false;
  }

  openOptionsMain(id, j) {
    this.animateItems[j].showOption = true;
  }
  closeOptionMain(j) {
    this.animateItems[j].showOption = false;
  }

  confirmResetAll(categoryName, main_index, sub_index, item_id) {
    this.alert = this.alertCtrl.create({
      //message: markAllChecklistForPmMsg,
      message: "Do you want to mark all items for " + categoryName + " as reset?",
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
            this.markResetItem(main_index, sub_index, item_id, 'category');
          }
        }
      ]
    });
    this.alert.present();
  }

  resetItem(name, main_index, sub_index, item_id) {

    this.alert = this.alertCtrl.create({
      //message: markAllChecklistForPmMsg,
      message: "Do you want to mark items for " + name + " as reset?",
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
            this.markResetItem(main_index, sub_index, item_id, 'item');
          }
        }
      ]
    });
    this.alert.present();
  }

  markResetItem(main_index, sub_index, item_id, field) {

    let alertVar = this.alertCtrl.create({
      title: 'Error!',
      subTitle: 'Invalid Details!',
      buttons: ['OK']
    });

    let objData = { id: item_id };

    this.nativeStorage.getItem('user_auth').then(

      accessToken => {

        if (this.commonMethod.checkNetwork()) {

          let url = completeTaskListItemUrl + "/" + item_id + "/reset";

          if (field != 'category') {
            url += "?category=no";
            this.animateItems[main_index].item_records[sub_index].inProgress = true;
          } else {
            url += "?category=yes";
            this.animateItems[main_index].inProgress = true;
          }

          this.commonMethod.postDataWithoutLoder(url, objData, accessToken).subscribe(
            data => {
              if (field != 'category') {
                this.animateItems[main_index].item_records[sub_index].completed_at = '';
              }
              else {
                for (let k = 0; k < this.animateItems[main_index].item_records.length; k++) {
                  this.animateItems[main_index].item_records[k].completed_at = '';
                }
              }
              if (field != 'category') {
                this.animateItems[main_index].item_records[sub_index].inProgress = false;
              } else {
                this.animateItems[main_index].inProgress = false;
              }
            },
            err => {
              if (field != 'category') {
                this.animateItems[main_index].item_records[sub_index].inProgress = false;
              } else {
                this.animateItems[main_index].inProgress = false;
              }
              //this.commonMethod.hideLoader();
              console.log("Error 1: " + JSON.stringify(err.json()));
              let res = err.json();

              if (typeof (res.error) !== undefined) {
                let alertVarErr = this.alertCtrl.create({
                  title: 'Error!',
                  subTitle: res.error ? res.error : 'Invalid Details!',
                  buttons: ['OK']
                });
                alertVarErr.present();
              }
              else {
                let alertVarErr = this.alertCtrl.create({
                  title: 'Error!',
                  subTitle: 'Invalid Details!',
                  buttons: ['OK']
                });
                alertVarErr.present();
              }

            },
            () => {
              if (field != 'category') {
                this.animateItems[main_index].item_records[sub_index].inProgress = false;
              } else {
                this.animateItems[main_index].inProgress = false;
              }
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


  }


  start(id, task_list_record_id, name) {
    this.spinner = true;

    let objData = {};
    if (task_list_record_id && task_list_record_id > 0) {
      let objData = { "task_list_record_id": task_list_record_id };
    }
    let alertVar = this.alertCtrl.create({
      title: 'Error!',
      subTitle: 'Invalid Details!',
      buttons: ['OK']
    });
    this.nativeStorage.getItem('user_auth').then(
      accessToken => {
        if (this.commonMethod.checkNetwork()) {

          this.spinner = true;
          this.commonMethod.postDataWithoutLoder(startTaskChecklistUrl + "/" + id + "/start_resume", objData, accessToken).subscribe(
            data => {
              let foundRepos = data.json();
              console.log(foundRepos);
              this.spinner = false;
              //this.commonMethod.hideLoader();

              this.taskListData = foundRepos;
              this.pageTitle = name;
              this.reviewMode = false;
              this.finishedByName = '';
              this.canUpdateReview = false;

              this.reviewerNotes = this.taskListData.reviewer_notes;
              //this.canUpdateReview=true;

              let that = this;
              for (let i = 0; i < that.taskListData.categories.length; i++) {
                setTimeout(function () {
                  that.animateItems.push(that.taskListData.categories[i]);
                }, 500 * (i + 1));
              }

              //this.viewDetails(foundRepos,name,false,'','');
              // viewDetails(res,name,review,finished_by_name,permissionTo) {
              //  this.navCtrl.push(TaskChecklistDetailPage,{listData:res,name:name,review:review,finished_by_name:finished_by_name,permission_to:permissionTo});
              //}

            },
            err => {
              this.spinner = false;
              //this.commonMethod.hideLoader();
              console.log("Error 1: " + JSON.stringify(err.json()));
              let res = err.json();

              if (typeof (res.error) !== undefined) {
                let alertVarErr = this.alertCtrl.create({
                  title: 'Error!',
                  subTitle: res.error ? res.error : 'Invalid Details!',
                  buttons: ['OK']
                });
                alertVarErr.present();
              }
              else {
                let alertVarErr = this.alertCtrl.create({
                  title: 'Error!',
                  subTitle: 'Invalid Details!',
                  buttons: ['OK']
                });
                alertVarErr.present();
              }
            },
            () => {
              this.spinner = false;
              //this.commonMethod.hideLoader();
              console.log('getData completed');
            }
          );
        }
        else {
          this.spinner = false;
          this.commonMethod.showNetworkError();
        }
      },
      error => {
        return '';
      }
    );
  }

  review(id, task_list_record_id, name, finished_by_name) {
    let alertVar = this.alertCtrl.create({
      title: 'Error!',
      subTitle: 'Invalid Details!',
      buttons: ['OK']
    });
    this.nativeStorage.getItem('user_auth').then(
      accessToken => {
        if (this.commonMethod.checkNetwork()) {

          this.spinner = true;
          this.commonMethod.getDataWithoutLoder(getTaskListDetailsUrl + "/" + task_list_record_id, accessToken).subscribe(
            data => {
              let foundRepos = data.json();
              console.log(foundRepos);
              //this.commonMethod.hideLoader();
              //this.viewDetails(foundRepos,name,true,finished_by_name,permission_to);
              this.spinner = false;

              this.taskListData = foundRepos;
              this.pageTitle = foundRepos.task_list.name;
              this.reviewMode = true;
              this.finishedByName = foundRepos.finished_by.name;
              let permissionTo = (this.params.get('permission_to') && this.params.get('permission_to') == 'review' && this.taskListData.status != 'reviewed') ? true : false;
              this.canUpdateReview = permissionTo;
              this.reviewerNotes = this.taskListData.reviewer_notes;
              //this.canUpdateReview=true;

              let that = this;
              for (let i = 0; i < that.taskListData.categories.length; i++) {
                setTimeout(function () {
                  that.animateItems.push(that.taskListData.categories[i]);
                }, 500 * (i + 1));
              }


            },
            err => {
              this.spinner = false;
              //this.commonMethod.hideLoader();
              console.log("Error 1: " + JSON.stringify(err.json()));
              let res = err.json();

              if (typeof (res.error) !== undefined) {
                let alertVarErr = this.alertCtrl.create({
                  title: 'Error!',
                  subTitle: res.error ? res.error : 'Invalid Details!',
                  buttons: ['OK']
                });
                alertVarErr.present();
              }
              else {
                let alertVarErr = this.alertCtrl.create({
                  title: 'Error!',
                  subTitle: 'Invalid Details!',
                  buttons: ['OK']
                });
                alertVarErr.present();
              }
            },
            () => {
              this.spinner = false;
              //this.commonMethod.hideLoader();
              console.log('getData completed');
            }
          );
        }
        else {
          this.spinner = false;
          this.commonMethod.showNetworkError();
        }
      },
      error => {
        return '';
      }
    );
  }


}



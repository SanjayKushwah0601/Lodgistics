import { Component, ViewChild, NgZone, trigger, transition, style, animate, state } from '@angular/core';
import { NavController, AlertController, Platform, Content, ModalController, FabContainer } from 'ionic-angular';
import { srviceMethodsCall } from '../../services/serviceMethods';
import { getTaskChecklistUrl } from '../../services/configURLs';
import { NativeStorage } from '@ionic-native/native-storage';
import { Keyboard } from '@ionic-native/keyboard';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { FeedsPage } from '../feeds/feeds';
import { ChattingPage } from '../chatting/chatting';
import { WorkOrderPage } from '../workOrder/workOrder';
import { getTaskListActivitiesUrl, getTaskListDetailsUrl } from '../../services/configURLs';
import { BroadcastListPage } from '../broadcastList/broadcastList';
import { MyMentionPage } from '../myMention/myMention';
import { TaskChecklistDetailPage } from '../taskChecklistDetail/taskChecklistDetail';
import { startTaskChecklistUrl } from '../../services/configURLs';
import { SendMessagePage } from '../sendMessage/sendMessage';
import { CreateWorkOrderPage } from '../createWorkOrder/createWorkOrder';
import { CreateFeedsPage } from '../createFeeds/createFeeds';
import 'web-animations-js/web-animations.min';

@Component({
  selector: 'page-taskChecklist',
  animations: [
    trigger(
      'enterAnimation', [
        transition(':enter', [
          style({ transform: 'translateX(100%)', opacity: 1 }),
          animate('210ms', style({ transform: 'translateX(0)', opacity: 1 }))
        ]),
        transition(':leave', [
          style({ transform: 'translateX(0)', opacity: 0 }),
          animate('0ms', style({ transform: 'translateX(0%)', opacity: 0 }))
        ])
      ]
    ),
    trigger(
      'activityAnimation', [
        transition(':enter', [
          style({ transform: 'translateY(100%)', opacity: 0 }),
          animate('210ms', style({ transform: 'translateY(0)', opacity: 1 }))
        ]),
        transition(':leave', [
          style({ transform: 'translateX(0)', opacity: 1 }),
          animate('0ms', style({ transform: 'translateX(0%)', opacity: 0 }))
        ])
      ]
    ),
    trigger(
      'activityAnimationButtonUp', [
        transition(':enter', [
          style({ transform: 'translateY(100%)', opacity: 0 }),
          animate('210ms', style({ transform: 'translateY(0)', opacity: 1 }))
        ]),
        transition(':leave', [
          style({ transform: 'translateX(0)', opacity: 1 }),
          animate('0ms', style({ transform: 'translateX(0%)', opacity: 0 }))
        ])
      ]
    ),
    trigger(
      'activityAnimationButtonDown', [
        transition(':enter', [
          style({ transform: 'translateY(0%)', opacity: 1 }),
          animate('210ms', style({ transform: 'translateY(100%)', opacity: 0 }))
        ]),
        transition(':leave', [
          style({ transform: 'translateX(0)', opacity: 1 }),
          animate('0ms', style({ transform: 'translateX(0%)', opacity: 0 }))
        ])
      ]
    ),
    trigger(
      'upenterAnimation', [
        transition(':enter', [
          style({ transform: 'translateY(500%)', opacity: 1 }),
          animate('210ms', style({ transform: 'translateX(0)', opacity: 1 }))
        ]),
        transition(':leave', [
          style({ transform: 'translateX(0)', opacity: 0 }),
          animate('0ms', style({ transform: 'translateX(0%)', opacity: 0 }))
        ])
      ]
    ),
    trigger(
          'downenterAnimation', [
            transition(':enter', [
              style({ transform: 'translateY(-500%)', opacity: 1 }),
              animate('210ms', style({ transform: 'translateX(0)', opacity: 1 }))
            ]),
            transition(':leave', [
              style({ transform: 'translateX(0)', opacity: 0 }),
              animate('0ms', style({ transform: 'translateY(0%)', opacity: 0 }))
            ])
          ]
        )
  ],
  templateUrl: 'taskChecklist.html',
  providers: [srviceMethodsCall, NativeStorage, Keyboard, SQLite, FabContainer]
})

export class TaskChecklistPage {
  @ViewChild(Content) content: Content;
  public cdTimeline =false;
  public scrollHeightClass='close_activity_btn';
  public foundRepos = [];
  public tempFoundRepos = [];
  public feedNotificationCount = 0;
  public messagesNotificationCount = 0;
  public woNotificationCount = 0;
  public interval: any;
  public showLabels=false;
  public userPermissions:any;
  public isPopupOpen = false;
  public animateItems= [];
  public taskListData = [];
  public foundResponseTaskList = [];
  public broadcast_count=0;
  public lastDate="";
  public showLoadMoreLable=false;
  public timeOutVar=[];
  public firstbutton=true;
  public spinner = false;
  public showEmptyMsgForActivity=false;
  public isChecklistDataLoaded=false;
  public fabButtonOpened=false;

  constructor(public navCtrl: NavController, public commonMethod: srviceMethodsCall, public alertCtrl: AlertController, public nativeStorage: NativeStorage, public keyboard: Keyboard, private sqlite: SQLite, public zone: NgZone, public modalCtrl: ModalController, public platform: Platform, public fabContainer:FabContainer) {

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

  getCheckListItems(loaderMsg) {
    let alertVar = this.alertCtrl.create({
      title: 'Error!',
      subTitle: 'Invalid Details!',
      buttons: ['OK']
    });

    this.nativeStorage.getItem('user_auth').then(
      accessToken => {
        console.log("access token details  : " + JSON.stringify(accessToken));
        
        if (this.commonMethod.checkNetwork()) {

          this.commonMethod.getDataWithLoaderMsg(getTaskChecklistUrl, accessToken,loaderMsg).subscribe(
            data => {
              this.foundRepos = [];
              //this.tempFoundRepos=[];  // To check activity on full page
             this.tempFoundRepos = data.json();
             this.isChecklistDataLoaded=true;
             if( this.tempFoundRepos.length<=0 )
             {
               this.goToContainer(true);
               this.getActivityData();
             }
            
              if(this.tempFoundRepos.length<=0)
              {
                this.showLabels=true;
              }
              this.commonMethod.hideLoader();
              //this.foundRepos = data.json();
              for (let i = 0; i < this.tempFoundRepos.length; i++) {
                let that = this;
                if (this.tempFoundRepos[i] != "undefined" && this.tempFoundRepos[i] != null) {
                  //this.foundRepos.push(this.tempFoundRepos[i]);
                  setTimeout(function () {
                    that.foundRepos.push(that.tempFoundRepos[i]);
                  }, 500 * (i+1));

                }
              }
              console.log(this.foundRepos);
              //alert(this.foundRepos); 
            },
            err => {
              this.commonMethod.hideLoader();
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
  
  goToContainer(cdTimeline) { //alert("hello");
  this.firstbutton = false;
  for(let i=0;i<this.timeOutVar.length;i++)
  {
    clearTimeout(this.timeOutVar[i]);
  }
    this.cdTimeline = cdTimeline;
    // alert("hi");
    if (this.cdTimeline) {
      this.scrollHeightClass = 'open_activity_btn';
    } else {
      this.scrollHeightClass = 'close_activity_btn';
      this.foundResponseTaskList=[];
      this.taskListData=[];
    }

  }

  /* functions for footer */
  openChatPage() {
    this.navCtrl.setRoot(ChattingPage);
  }
  openFeedPage() {
    this.navCtrl.setRoot(FeedsPage);
  }
  openWOPage() {
    this.navCtrl.setRoot(WorkOrderPage);
  }
  openMyMentionPage() {
    this.navCtrl.setRoot(MyMentionPage);
  }

  showDate(index) {
    if (index == 0) {
      return true;
    }

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

  ionViewDidEnter() {
    console.log("page loaded");
    this.foundRepos = [];
    this.goToContainer(false);
    this.firstbutton=true;
    this.nativeStorage.setItem('lastPage', { "pageName": TaskChecklistPage.name, "index": this.navCtrl.getActive().index });

    /* To manage shwo tow loader with create WO popup */
    let loaderMsg='Fetching your Checklists...';
    if( this.navCtrl.getActive().name=="TaskChecklistPage")
    {
      loaderMsg="Please wait...";
    }
    console.log("view="+this.navCtrl.getActive().name+" --"+loaderMsg);

    this.getCheckListItems(loaderMsg);
  }

  doInfinite() {
        this.spinner = true;
        let alertVar = this.alertCtrl.create({
          title: 'Error!',
          subTitle: 'Invalid Details!',
          buttons: ['OK']
        });
        this.nativeStorage.getItem('user_auth').then(
          accessToken => {
            console.log("access token details  : " + JSON.stringify(accessToken));
            if (this.commonMethod.checkNetwork()) {
              this.commonMethod.getDataWithoutLoder(getTaskListActivitiesUrl+"?finished_after="+this.lastDate+"&limit=10", accessToken).subscribe(
                data => {
                  this.spinner = false;
                  this.foundResponseTaskList = data.json();
                 // infiniteScroll.complete();
                  this.commonMethod.hideLoader();

                    if( this.foundResponseTaskList.length<=0 )
                    {
                      this.showLoadMoreLable=false;
                    }
                    if(this.foundResponseTaskList.length<10)
                    {
                      this.lastDate="";
                    }

                  
                     let today = new Date();
                      
                      let dd2 = ("0" + today.getDate()).slice(-2);
                      let mm2 = ("0" + ((today.getMonth()) + 1)).slice(-2); //January is 0!
                      let yyyy2 = today.getFullYear();
                      
                      let tDate = yyyy2 + '-' + mm2 + '-' + dd2;
    
                      let yesterday = new Date();
                      yesterday.setDate(today.getDate() - 1);
                      let dd3 = ("0" + yesterday.getDate()).slice(-2);
                      let mm3 = ("0" + ((yesterday.getMonth()) + 1)).slice(-2); //January is 0!
                      let yyyy3 = yesterday.getFullYear();
                      
                      let yDate = yyyy3 + '-' + mm3 + '-' + dd3;
    
                      console.log(tDate,yDate);
                      for (let i = 0; i < this.foundResponseTaskList.length; i++) {

                        if(this.foundResponseTaskList.length==i+1 && this.foundResponseTaskList.length==10)
                        { 
                          this.lastDate=this.foundResponseTaskList[i].finished_at;
                        }


                      let dateType="";
                      let dateType1="";
                      let serverDate = new Date(this.foundResponseTaskList[i].finished_at);
                      let dd = ("0" + serverDate.getDate()).slice(-2);
                      let mm = ("0" + ((serverDate.getMonth()) + 1)).slice(-2); //January is 0!
                      let yyyy = serverDate.getFullYear();
                      
                      let sDate = yyyy + '-' + mm + '-' + dd;
              
                      if(tDate == sDate){
                        dateType="today";
                      }else if(yDate == sDate){
                        dateType="yesterday";
                      }else{
                      dateType="";
                      }
                      this.foundResponseTaskList[i].dateType=dateType;

                      if(this.foundResponseTaskList[i].reviewed_at != '' && this.foundResponseTaskList[i].reviewed_at != null && this.foundResponseTaskList[i].reviewed_at != 'null'){

                        let serverDate1 = new Date(this.foundResponseTaskList[i].reviewed_at);
                        let dd4 = ("0" + serverDate.getDate()).slice(-2);
                        let mm4 = ("0" + ((serverDate.getMonth()) + 1)).slice(-2); //January is 0!
                        let yyyy4 = serverDate.getFullYear();
                        let sDate1 = yyyy4 + '-' + mm4 + '-' + dd4;
                                               if(tDate == sDate1){
                                                 dateType1="today";
                                               }else if(yDate == sDate1){
                                                 dateType1="yesterday";
                                               }else{
                                               dateType1="fulldate";
                                               }
                      }
                      this.foundResponseTaskList[i].dateType1=dateType1;

                      let that=this;
                      this.timeOutVar.push(setTimeout(function () {
                        that.taskListData.push(that.foundResponseTaskList[i]);
                        console.log(sDate,tDate,yDate);
                        if(that.foundResponseTaskList.length==i+1)
                        {
                          that.showLoadMoreLable=true;
                        }
                      }, 500 * (i+1)));
    
                  
                  }
                  console.log("activities"+this.taskListData);
                  //alert(this.foundRepos); 
                },
                err => {
                 // infiniteScroll.complete();
                  this.spinner = false;
                  this.commonMethod.hideLoader();
                  alertVar.present();
                  console.error("Error : " + err);
                },
                () => {
                  console.log('getData completed');
                }
              );
            }
            else {
              this.spinner = false;
             // infiniteScroll.complete();
              this.commonMethod.showNetworkError();
            }
          },
          error => {
            return '';
          }
        );
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

      start(id,task_list_record_id,name)
      {
        // let objData = {};
        // if(task_list_record_id && task_list_record_id>0)
        // {
        //   let objData = {"task_list_record_id":task_list_record_id};
        // }

        this.navCtrl.push(TaskChecklistDetailPage,{id:id,name:name,task_list_record_id:task_list_record_id,type:'start_resume'});


        // let alertVar = this.alertCtrl.create({
        //   title: 'Error!',
        //   subTitle: 'Invalid Details!',
        //   buttons: ['OK']
        // });
        // this.nativeStorage.getItem('user_auth').then(
        //   accessToken => {
        //     if (this.commonMethod.checkNetwork()) {

        //       this.commonMethod.postData(startTaskChecklistUrl+"/"+id+"/start_resume", objData, accessToken).subscribe(
        //         data => {
        //           let foundRepos = data.json();
        //           console.log(foundRepos);
        //           this.commonMethod.hideLoader();
        //           this.viewDetails(foundRepos,name,false,'','');
        //         },
        //         err => {
        //           this.commonMethod.hideLoader();
        //           console.log("Error 1: " + JSON.stringify(err.json()));
        //           let res = err.json();

        //           if (typeof (res.error) !== undefined) {
        //             let alertVarErr = this.alertCtrl.create({
        //               title: 'Error!',
        //               subTitle: res.error ? res.error : 'Invalid Details!',
        //               buttons: ['OK']
        //             });
        //             alertVarErr.present();
        //           }
        //           else {
        //             let alertVarErr = this.alertCtrl.create({
        //               title: 'Error!',
        //               subTitle: 'Invalid Details!',
        //               buttons: ['OK']
        //             });
        //             alertVarErr.present();
        //           }
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

      // viewDetails(res,name,review,finished_by_name,permissionTo) {
      //   this.navCtrl.push(TaskChecklistDetailPage,{listData:res,name:name,review:review,finished_by_name:finished_by_name,permission_to:permissionTo});
      // }

      // hideComment(index){
      //   this.foundRepos[index].show_comment=false;
      // }

      // showComment(index) {

      //   let prompt = this.alertCtrl.create({
      //     title: 'Add comment',
      //     inputs: [
      //       {
      //         name: 'title',
      //         placeholder: 'Type your comment...'
      //       },
      //     ],
      //     buttons: [
      //       {
      //         text: 'Cancel',
      //         handler: data => {
      //           console.log('Cancel clicked');
      //         }
      //       },
      //       {
      //         text: 'Save',
      //         handler: data => {
      //           console.log('Saved clicked');
      //         }
      //       }
      //     ]
      //   });
      //   prompt.present();
      // }

      getActivityData(){

        this.spinner = true;
        this.foundResponseTaskList=[];
        this.taskListData=[];
        this.showLoadMoreLable=false;
        this.lastDate="";
        this.showEmptyMsgForActivity=false;

        let alertVar = this.alertCtrl.create({
          title: 'Error!',
          subTitle: 'Invalid Details!',
          buttons: ['OK']
        });
        this.nativeStorage.getItem('user_auth').then(
          accessToken => {
            console.log("access token details  : " + JSON.stringify(accessToken));
            
            if (this.commonMethod.checkNetwork()) {
              this.commonMethod.getDataWithoutLoder(getTaskListActivitiesUrl+"?limit=10", accessToken).subscribe(
                data => {
                  this.spinner = false;
                  this.foundResponseTaskList = data.json();
                
                  if(this.foundResponseTaskList.length<=0)
                  {
                    this.showLoadMoreLable=false;
                    this.showEmptyMsgForActivity=true;
                  }
                  if(this.foundResponseTaskList.length<10)
                  {
                    this.lastDate="";
                  }
                  this.commonMethod.hideLoader();
                  
    
                     let today = new Date();
                      
                      let dd2 = ("0" + today.getDate()).slice(-2);
                      let mm2 = ("0" + ((today.getMonth()) + 1)).slice(-2); //January is 0!
                      let yyyy2 = today.getFullYear();
                      
                      let tDate = yyyy2 + '-' + mm2 + '-' + dd2;
    
                      let yesterday = new Date();
                      yesterday.setDate(today.getDate() - 1);
                      let dd3 = ("0" + yesterday.getDate()).slice(-2);
                      let mm3 = ("0" + ((yesterday.getMonth()) + 1)).slice(-2); //January is 0!
                      let yyyy3 = yesterday.getFullYear();
                      
                      let yDate = yyyy3 + '-' + mm3 + '-' + dd3;
    
                      console.log(tDate,yDate);
                      for (let i = 0; i < this.foundResponseTaskList.length; i++) {

                      if(this.foundResponseTaskList.length==i+1 && this.foundResponseTaskList.length==10)
                      { 
                        this.lastDate=this.foundResponseTaskList[i].finished_at;
                      }

                      let dateType="";
                      let dateType1="";
                      let serverDate = new Date(this.foundResponseTaskList[i].finished_at);
                      let dd = ("0" + serverDate.getDate()).slice(-2);
                      let mm = ("0" + ((serverDate.getMonth()) + 1)).slice(-2); //January is 0!
                      let yyyy = serverDate.getFullYear();
                      
                      let sDate = yyyy + '-' + mm + '-' + dd;
                      if(tDate == sDate){
                        dateType="today";
                      }else if(yDate == sDate){
                        dateType="yesterday";
                      }else{
                      dateType="";
                      }
                      this.foundResponseTaskList[i].dateType=dateType;
                      
                      if(this.foundResponseTaskList[i].reviewed_at != '' && this.foundResponseTaskList[i].reviewed_at != null && this.foundResponseTaskList[i].reviewed_at != 'null'){

                        let serverDate1 = new Date(this.foundResponseTaskList[i].reviewed_at);
                        let dd4 = ("0" + serverDate.getDate()).slice(-2);
                        let mm4 = ("0" + ((serverDate.getMonth()) + 1)).slice(-2); //January is 0!
                        let yyyy4 = serverDate.getFullYear();
                        let sDate1 = yyyy4 + '-' + mm4 + '-' + dd4;
                                               if(tDate == sDate1){
                                                 dateType1="today";
                                               }else if(yDate == sDate1){
                                                 dateType1="yesterday";
                                               }else{
                                               dateType1="fulldate";
                                               }
                      }
                      this.foundResponseTaskList[i].dateType1=dateType1;

                      let that=this;
                      this.timeOutVar.push(setTimeout(function () {
                        that.taskListData.push(that.foundResponseTaskList[i]);
                        console.log(sDate,tDate,yDate);
                        if(that.foundResponseTaskList.length==i+1)
                        {
                          that.showLoadMoreLable=true;
                        }
                      }, 500 * (i+1)));
    
                  
                  }
                  console.log("activities"+this.taskListData);
                  //alert(this.foundRepos); 
                },
                err => {
                  this.spinner = false;
                  this.commonMethod.hideLoader();
                  alertVar.present();
                  console.error("Error : " + err);
                },
                () => {
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

      review(id,task_list_record_id,name,finished_by_name,permission_to)
      {
        this.navCtrl.push(TaskChecklistDetailPage,{id:id,name:name,task_list_record_id:task_list_record_id,finished_by_name:finished_by_name,permission_to:permission_to,type:'view_review'});

        // let alertVar = this.alertCtrl.create({
        //   title: 'Error!',
        //   subTitle: 'Invalid Details!',
        //   buttons: ['OK']
        // });
        // this.nativeStorage.getItem('user_auth').then(
        //   accessToken => {
        //     if (this.commonMethod.checkNetwork()) {

        //       this.commonMethod.getData(getTaskListDetailsUrl+"/"+task_list_record_id, accessToken).subscribe(
        //         data => {
        //           let foundRepos = data.json();
        //           console.log(foundRepos);
        //           this.commonMethod.hideLoader();
        //           this.viewDetails(foundRepos,name,true,finished_by_name,permission_to);
        //         },
        //         err => {
        //           this.commonMethod.hideLoader();
        //           console.log("Error 1: " + JSON.stringify(err.json()));
        //           let res = err.json();

        //           if (typeof (res.error) !== undefined) {
        //             let alertVarErr = this.alertCtrl.create({
        //               title: 'Error!',
        //               subTitle: res.error ? res.error : 'Invalid Details!',
        //               buttons: ['OK']
        //             });
        //             alertVarErr.present();
        //           }
        //           else {
        //             let alertVarErr = this.alertCtrl.create({
        //               title: 'Error!',
        //               subTitle: 'Invalid Details!',
        //               buttons: ['OK']
        //             });
        //             alertVarErr.present();
        //           }
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

      createFeedQuick(fab?: FabContainer){
        if (fab !== undefined) {
          fab.close();
        }
        this.fabButtonOpened=false;
        this.createFeed();
      }
    
      createWorkOrderQuick(fab?: FabContainer){
        if (fab !== undefined) {
          fab.close();
        }
        this.fabButtonOpened=false;
        this.createWorkOrder('','','','','');
      }
    
      sendMessage(fab?: FabContainer){
        if (fab !== undefined) {
          fab.close();
        }
        this.fabButtonOpened=false;
        let modal = this.modalCtrl.create(SendMessagePage);
        modal.onDidDismiss(data => {
          this.closekeyboard();
        });
        modal.present();
      }
    
      openFabButton(){
        if(this.fabButtonOpened==false){
            this.fabButtonOpened=true;
        }else{
            this.fabButtonOpened=false;
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



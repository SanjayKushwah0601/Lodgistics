import { Component, ViewChild, trigger, transition, style, animate, state, NgZone } from '@angular/core';
import { NavController, AlertController, Platform, Content, ModalController, FabContainer } from 'ionic-angular';
import { srviceMethodsCall } from '../../services/serviceMethods';
import { getMyMentionsUrl } from '../../services/configURLs';
import { NativeStorage } from '@ionic-native/native-storage';
import { Keyboard } from '@ionic-native/keyboard';
import { Toast } from '@ionic-native/toast';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { FeedsPage } from '../feeds/feeds';
import { FeedDetailPage } from '../feedDetail/feedDetail';
import { ChattingPage } from '../chatting/chatting';
import { TranslationService } from '../../providers/translation.service';
import { GroupChatPage } from '../groupChat/groupChat';
import { WorkOrderPage } from '../workOrder/workOrder';
import { deleteMentionUrl } from '../../services/configURLs';
import { getGroupsOnlyUrl } from '../../services/configURLs';
import { addEditGroupUrl } from '../../services/configURLs';
import { getPrivateOnlyUrl } from '../../services/configURLs';
import { createAcknowledgementUrl } from '../../services/configURLs';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { viewWorkOrderUrl } from '../../services/configURLs';
import { clearAllMentionsMsg } from '../../providers/appConfig'
import { clearAllMentionsUrl } from '../../services/configURLs';
import { snoozeMentionUrl } from '../../services/configURLs';
import { unsnoozeMentionUrl } from '../../services/configURLs';
import { BroadcastListPage } from '../broadcastList/broadcastList';
import { TaskChecklistPage } from '../taskChecklist/taskChecklist';
import { SendMessagePage } from '../sendMessage/sendMessage';
import { CreateWorkOrderPage } from '../createWorkOrder/createWorkOrder';
import { CreateFeedsPage } from '../createFeeds/createFeeds';
import 'web-animations-js/web-animations.min';
import { GoogleAnalyticsProvider } from '../../providers/google-analytics/google-analytics';

@Component({
  selector: 'page-myMention',
  animations: [
    trigger('outAnimation', [
      // state('inactive', style({
      //   backgroundColor: '#eee',
      //   transform: 'scale(1)'
      // })),
      // state('active',   style({
      //   backgroundColor: '#cfd8dc',
      //   transform: 'scale(1.1)'
      // })),
      transition('active => inactive', [
        style({ transform: 'translateX(0)', opacity: 0 }),
        animate('0.2s 0.1s ease-out')
      ]),
      transition('inactive => active', [
        style({ transform: 'translateX(100%)', opacity: 1 }),
        animate('0.2s 0.1s ease-out')
      ])
    ])
  ],
  templateUrl: 'myMention.html',
  providers: [srviceMethodsCall, NativeStorage, Keyboard, TranslationService, Toast, SQLite, InAppBrowser, FabContainer]
})

export class MyMentionPage {
  @ViewChild(Content) content: Content;

  public foundRepos = [];
  public lastUpdatesAt: Date;
  public touchtime = 0;
  public members = [];
  public groupReponse: any;
  public chanelCreateData: any;
  public currentPage = 1;
  public tempFoundRepos = [];
  public limit = 15;
  public showPageLoader = true;
  public viewWOUrl = "";
  public feedNotificationCount = 0;
  public messagesNotificationCount = 0;
  public woNotificationCount = 0;
  public interval: any;
  public allDeletedMsg = "";
  public snoozeAllStatus = true;
  public showLabels = false;
  public userPermissions: any;
  public isPopupOpen = false;
  public spinner = false;
  public fabButtonOpened = false;

  constructor(public googleAnalytics: GoogleAnalyticsProvider, public navCtrl: NavController, public commonMethod: srviceMethodsCall, public alertCtrl: AlertController, public nativeStorage: NativeStorage, public keyboard: Keyboard, public translationservice: TranslationService, private toast: Toast, private sqlite: SQLite, private iab: InAppBrowser, public zone: NgZone, public modalCtrl: ModalController, public platform: Platform, public fabContainer: FabContainer) {

    this.viewWOUrl = viewWorkOrderUrl;
    this.getAllMembersFromDb();

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
          thisObj.woNotificationCount = count.wo_count ? count.wo_count : 0;
        },
        error => {
          return false;
        }
      );

    }, 1000);

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

        debugger
        this.nativeStorage.getItem('mentionable')
          .then((data) => {
            debugger
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
              console.log(data)
            }
          }).catch((err) => {
          })

      }, (error1) => {
        console.log("SELECT MEMBERS ERROR: " + JSON.stringify(error1));
      });

    }).catch(e => console.log(e));
  }

  callMyMentions() {
    this.lastUpdatesAt = new Date();
    let alertVar = this.alertCtrl.create({
      title: 'Error!',
      subTitle: 'Invalid Details!',
      buttons: ['OK']
    });

    this.nativeStorage.getItem('user_auth').then(
      accessToken => {
        console.log("access token details  : " + JSON.stringify(accessToken));
        this.spinner = true;
        this.showPageLoader = true;
        this.currentPage = 1;
        if (this.commonMethod.checkNetwork()) {
          this.commonMethod.getDataWithoutLoder(getMyMentionsUrl, accessToken).subscribe(
            data => {
              this.showLabels = true;
              this.foundRepos = [];
              this.tempFoundRepos = data.json();
              this.snoozeAllStatus = true;
              for (let i = 0; i < this.tempFoundRepos.length; i++) {
                this.tempFoundRepos[i].state = "active";
                if (this.tempFoundRepos[i].snoozed == false) {
                  this.snoozeAllStatus = false;
                }
              }
              //this.commonMethod.hideLoader();
              //this.foundRepos = data.json();
              for (let i = 0; i < this.limit; i++) {
                if (this.tempFoundRepos[i] != "undefined" && this.tempFoundRepos[i] != null) {
                  this.foundRepos.push(this.tempFoundRepos[i]);
                }
              }
              console.log(this.foundRepos);
              this.spinner = false;
              //alert(this.foundRepos); 
            },
            err => {
              //this.commonMethod.hideLoader();
              this.spinner = false;
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

  openDetail(comment_id, id, index) {


    let objData = { status: 'checked' };
    let alertVar = this.alertCtrl.create({
      title: 'Error!',
      subTitle: 'Invalid Details!',
      buttons: ['OK']
    });

    this.nativeStorage.getItem('user_auth').then(
      accessToken => {

        if (this.commonMethod.checkNetwork()) {
          this.commonMethod.showLoader();
          this.commonMethod.putData(deleteMentionUrl + "/" + this.foundRepos[index].mention_id, objData, accessToken).subscribe(
            data => {
              this.foundRepos.splice(index, 1);
              this.commonMethod.hideLoader();
              if (id == null) {
                this.navCtrl.push(FeedDetailPage, { feed_id: comment_id });

              } else {
                this.navCtrl.push(FeedDetailPage, { feed_id: id, feed_comment_id: comment_id });
              }
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
  openGroupCaht(id, index) {

    if (this.foundRepos[index].content.content_type == "private_chat") {
      this.openPrivateChat(this.foundRepos[index].content.content_type_id, this.foundRepos[index].content.content_id, this.foundRepos[index].created_at, index);
    }
    else {

      this.sqlite.create({
        name: 'data.db',
        location: 'default'
      }).then((db: SQLiteObject) => {

        db.executeSql("SELECT chat_groups.*,chat_group_users.user_id FROM chat_groups LEFT JOIN chat_group_users ON chat_group_users.group_id=chat_groups.id WHERE chat_groups.id='" + id + "'", {}).then((allData) => {
          console.log("SELECT chat_groups.*,chat_group_users.user_id FROM chat_groups LEFT JOIN chat_group_users ON chat_group_users.group_id=chat_groups.id WHERE chat_groups.id='" + id + "'" + JSON.stringify(allData));

          if (allData.rows.length > 0) {
            this.goToGroupChat(id, index);
          }
          else {

            console.log("Group data not available!");
            /* Start DB code */
            let insertChatGroupsData = "";
            let updateChatGroupsData = "";
            let updateImageChatGroupsData = "";
            let updateChatGroupsQuery = "Update chat_groups SET name = (case ";
            let updateImageChatGroupsQuery = "Update chat_groups SET image_url = (case ";
            let tempVal = 0;
            let insertChatGroupUsersData = "";
            let updateChatGroupUsersGroupIdData = "";
            let updateChatGroupUsersUserIdData = "Else group_id End), user_id = (case ";
            let insertChatGroupUsersQuery = 'INSERT INTO chat_group_users (group_id, user_id, is_admin, deleted_at, created_at) VALUES ';
            let updateChatGroupUsersQuery = "UPDATE chat_group_users SET group_id = (case ";
            let insertChatGroupsQuery = 'INSERT INTO chat_groups (id, name, hotel_token, created_by_id, deleted_at, created_at, updated_at, image_url) VALUES ';
            let alertVar = this.alertCtrl.create({
              title: 'Error!',
              subTitle: 'Invalid Details!',
              buttons: ['OK']
            });

            this.nativeStorage.getItem('user_auth').then(
              accessToken => {

                if (this.commonMethod.checkNetwork()) {

                  this.commonMethod.getData(getGroupsOnlyUrl + "?chat_id=" + id, accessToken).subscribe(
                    data => {
                      this.groupReponse = data.json();
                      this.sqlite.create({
                        name: 'data.db',
                        location: 'default'
                      }).then((db: SQLiteObject) => {

                        let allExistingIds = [];
                        db.executeSql("SELECT * FROM chat_groups", []).then((dataSQL) => {
                          console.log("GROUPS TABLE DATA: " + JSON.stringify(dataSQL));

                          if (dataSQL.rows.length > 0) {
                            for (let i = 0; i < dataSQL.rows.length; i++) {
                              allExistingIds.push({
                                id: dataSQL.rows.item(i).id
                              });
                            }
                          }

                          for (let i = 0; i < this.groupReponse.length; i++) {
                            let insertFlag = true;
                            for (let j = 0; j < allExistingIds.length; j++) {
                              if (this.groupReponse[i].chat.id == allExistingIds[j].id) {
                                insertFlag = false;
                              }
                            }

                            if (insertFlag == true) {
                              insertChatGroupsData = insertChatGroupsData + "('" + this.groupReponse[i].chat.id + "','" + this.groupReponse[i].chat.name + "','','" + this.groupReponse[i].chat.owner_id + "','','" + this.groupReponse[i].chat.created_at + "','','" + this.groupReponse[i].chat.image_url + "'),";
                            }
                            else {
                              updateChatGroupsData = updateChatGroupsData + "when id = " + this.groupReponse[i].chat.id + " then '" + this.groupReponse[i].chat.name + "' ";
                              updateImageChatGroupsData = updateImageChatGroupsData + "when id = " + this.groupReponse[i].chat.id + " then '" + this.groupReponse[i].chat.image_url + "' ";

                              if (i == this.groupReponse.length - 1) {
                                console.log("Update  chat_groups Data == " + updateChatGroupsQuery + updateChatGroupsData + " Else name End)");
                                if (updateChatGroupsData != "") {
                                  db.executeSql(updateChatGroupsQuery + updateChatGroupsData + " Else name End)", {}).then((data1) => {
                                    console.log("UPDATED: " + JSON.stringify(data1));
                                  }, (error1) => {
                                    console.log("UPDATED ERROR: " + JSON.stringify(error1));
                                  });
                                  db.executeSql(updateImageChatGroupsQuery + updateImageChatGroupsData + " Else image_url End)", {}).then((data1) => {
                                    console.log("UPDATED: " + JSON.stringify(data1));
                                  }, (error1) => {
                                    console.log("UPDATED ERROR: " + JSON.stringify(error1));
                                  });

                                }
                              }
                            }

                            /* Group users DB code start */
                            // db.executeSql('CREATE TABLE IF NOT EXISTS chat_group_users(group_id INTEGER, user_id INTEGER, is_admin INTEGER, deleted_at TEXT, created_at TEXT)', {})
                            //   .then((dbUserRes) => {
                            //     console.log("GROUP USER TABLE CREATED: " + JSON.stringify(dbUserRes));

                            let allExistingUserIds = [];
                            db.executeSql("SELECT * FROM chat_group_users WHERE group_id='" + this.groupReponse[i].chat.id + "'", []).then((dataUserSQL) => {
                              console.log("GROUP USER TABLE DATA: " + JSON.stringify(dataUserSQL));
                              tempVal = tempVal + 1;
                              if (dataUserSQL.rows.length > 0) {
                                for (let k = 0; k < dataUserSQL.rows.length; k++) {
                                  allExistingUserIds.push({
                                    user_id: dataUserSQL.rows.item(k).user_id
                                  });
                                }
                              }

                              for (let k = 0; k < this.groupReponse[i].chat.users.length; k++) {
                                let insertUserFlag = true;
                                for (let l = 0; l < allExistingUserIds.length; l++) {
                                  if (this.groupReponse[i].chat.users[k].id == allExistingUserIds[l].user_id) {
                                    insertUserFlag = false;
                                  }
                                }
                                if (insertUserFlag == true) {
                                  insertChatGroupUsersData = insertChatGroupUsersData + "('" + this.groupReponse[i].chat.id + "','" + this.groupReponse[i].chat.users[k].id + "','0','','" + this.groupReponse[i].chat.users[k].joined_at + "'),";
                                  console.log("insertChatGroupUsersData  " + insertChatGroupUsersData);
                                }
                                else {

                                  updateChatGroupUsersGroupIdData = updateChatGroupUsersGroupIdData + "when user_id='" + this.groupReponse[i].chat.users[k].id + "' AND group_id='" + this.groupReponse[i].chat.id + "' then '" + this.groupReponse[i].chat.id + "' ";
                                  updateChatGroupUsersUserIdData = updateChatGroupUsersUserIdData + "when user_id='" + this.groupReponse[i].chat.users[k].id + "' AND group_id='" + this.groupReponse[i].chat.id + "' then '" + this.groupReponse[i].chat.users[k].id + "' ";
                                }

                              }

                              if (tempVal == this.groupReponse.length) {
                                if (insertChatGroupUsersData != "") {
                                  db.executeSql(insertChatGroupUsersQuery + insertChatGroupUsersData.substring(0, insertChatGroupUsersData.length - 1), {}).then((dataUser1) => {
                                    console.log("Data  == GROUP USER INSERTED: " + JSON.stringify(dataUser1));

                                    if (insertChatGroupsData != "") {
                                      db.executeSql(insertChatGroupsQuery + insertChatGroupsData.substring(0, insertChatGroupsData.length - 1), {}).then((data1) => {
                                        console.log("Data  == GROUPS INSERTED: " + JSON.stringify(data1));
                                        //this.commonMethod.hideLoader();
                                        this.goToGroupChat(id, index);
                                      }, (error1) => {
                                        console.log("Data  == GROUPS INSERT ERROR: " + JSON.stringify(error1));
                                      });
                                    }

                                  }, (errorUser1) => {
                                    console.log("Data  == GROUP USER INSERT ERROR: " + JSON.stringify(errorUser1));
                                  });
                                } else if (updateChatGroupUsersGroupIdData == "") {
                                  this.commonMethod.hideLoader();
                                }
                                if (updateChatGroupUsersGroupIdData != "") {
                                  console.log("chat_group_users Data  == " + updateChatGroupUsersQuery + updateChatGroupUsersGroupIdData + updateChatGroupUsersUserIdData + "Else user_id End)");
                                  db.executeSql(updateChatGroupUsersQuery + updateChatGroupUsersGroupIdData + updateChatGroupUsersUserIdData + "Else user_id End)", {}).then((dataUser1) => {

                                    if (insertChatGroupsData != "") {
                                      db.executeSql(insertChatGroupsQuery + insertChatGroupsData.substring(0, insertChatGroupsData.length - 1), {}).then((data1) => {
                                        console.log("Data  == GROUPS INSERTED: " + JSON.stringify(data1));
                                        //this.commonMethod.hideLoader();
                                        this.goToGroupChat(id, index);
                                      }, (error1) => {
                                        console.log("Data  == GROUPS INSERT ERROR: " + JSON.stringify(error1));
                                      });
                                    }

                                    console.log(" 1 GROUP USER UPDATED: " + JSON.stringify(dataUser1) + "  " + i + "  " + this.groupReponse.length);
                                  }, (errorUser1) => {
                                    console.log("GROUP USER UPDATED ERROR: " + JSON.stringify(errorUser1));
                                  });
                                }
                              }
                            }, (errorUser) => {
                              console.log("1 ERROR: " + JSON.stringify(errorUser));
                            });

                            /* Group SQL code end  */

                          }

                        }, (error) => {
                          console.log("2 ERROR: " + JSON.stringify(error));
                        });



                        // }, (error) => {
                        //   console.error("Unable to execute sql", error);
                        // }).catch(e => console.log('Executed SQL Error= ' + JSON.stringify(e)));
                      }).catch(e => console.log(e));

                      // this.commonMethod.hideLoader();        

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

            /* End DB code */

          }
        }, (error1) => {
          console.log("SELECT MEMBERS ERROR: " + JSON.stringify(error1));
        });

      }).catch(e => console.log(e));

    }
  }

  goToGroupChat(id, index) {
    let groupInfoData = {
      "id": id,
      "name": "",
      "image_url": "",
      "created_at": "",
      "owner_id": "",
      "message_date": "",
      "message_id": "",
      "highlight_message": true,
      "reply_on_message": true,
      "users": []
    };
    this.sqlite.create({
      name: 'data.db',
      location: 'default'
    }).then((db: SQLiteObject) => {

      db.executeSql("SELECT chat_groups.*,chat_group_users.user_id FROM chat_groups LEFT JOIN chat_group_users ON chat_group_users.group_id=chat_groups.id WHERE chat_groups.id='" + id + "'", {}).then((allData) => {
        console.log("SELECT chat_groups.*,chat_group_users.user_id FROM chat_groups LEFT JOIN chat_group_users ON chat_group_users.group_id=chat_groups.id WHERE chat_groups.id='" + id + "'" + JSON.stringify(allData));

        if (allData.rows.length > 0) {
          for (let i = 0; i < allData.rows.length; i++) {
            if (i == 0) {
              groupInfoData = {
                "id": allData.rows.item(i).id,
                "name": allData.rows.item(i).name,
                "image_url": allData.rows.item(i).image_url,
                "created_at": allData.rows.item(i).created_at,
                "owner_id": allData.rows.item(i).created_by_id,
                "message_date": this.foundRepos[index].created_at,
                "message_id": this.foundRepos[index].content.content_id,
                "highlight_message": true,
                "reply_on_message": true,
                "users": []
              };
            }
            groupInfoData.users.push({ "id": allData.rows.item(i).user_id });
          }

          let objData = { status: 'checked' };
          let alertVar = this.alertCtrl.create({
            title: 'Error!',
            subTitle: 'Invalid Details!',
            buttons: ['OK']
          });

          this.nativeStorage.getItem('user_auth').then(
            accessToken => {

              if (this.commonMethod.checkNetwork()) {

                this.commonMethod.putData(deleteMentionUrl + "/" + this.foundRepos[index].mention_id, objData, accessToken).subscribe(
                  data => {
                    this.foundRepos.splice(index, 1);
                    this.commonMethod.hideLoader();
                    this.navCtrl.push(GroupChatPage, { groupInfo: groupInfoData });
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
        else {
          this.commonMethod.hideLoader();
          alert("Group data not available!");
        }
      }, (error1) => {
        console.log("SELECT MEMBERS ERROR: " + JSON.stringify(error1));
      });

    }).catch(e => console.log(e));
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

    let newValue = this.commonMethod.getTextValueNew(allChatMentions, this.members, val);
    if (newValue != "") {
      val = newValue;
    }

    return val.replace(/text-decoration-line/g, "text-decoration");
  }

  /* functions for footer */
  openChatPage() {
    this.googleAnalytics.bottomTabClick('Open Chat Page')
    this.navCtrl.setRoot(ChattingPage);
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

  logSwipe(index) {
    //console.log(e);
    let objData = { status: 'checked' };
    let alertVar = this.alertCtrl.create({
      title: 'Error!',
      subTitle: 'Invalid Details!',
      buttons: ['OK']
    });

    this.nativeStorage.getItem('user_auth').then(
      accessToken => {

        if (this.commonMethod.checkNetwork()) {

          this.tempFoundRepos[index].dismissInProgress = true;
          this.foundRepos[index].dismissInProgress = true;
          this.commonMethod.putDataWithoutLoder(deleteMentionUrl + "/" + this.foundRepos[index].mention_id, objData, accessToken).subscribe(
            data => {
              this.foundRepos[index].dismissInProgress = false;
              this.tempFoundRepos[index].dismissInProgress = false;
              this.foundRepos.splice(index, 1);
              this.tempFoundRepos.splice(index, 1);

              this.toast.show('Item has been deleted', '1000', 'bottom').subscribe(
                toast => {
                  console.log(toast);
                });

              if (this.foundRepos.length == 0 && this.tempFoundRepos.length > 0) {
                this.callMyMentions();
              }
            },
            err => {
              this.foundRepos[index].dismissInProgress = false;
              this.tempFoundRepos[index].dismissInProgress = false;
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

  openPrivateChat(id, message_id, message_date, index) {
    //alert(id);
    //alert(message_id);
    //alert(message_date);


    let alertVar = this.alertCtrl.create({
      title: 'Error!',
      subTitle: 'Invalid Details!',
      buttons: ['OK']
    });
    this.nativeStorage.getItem('user_auth').then(
      accessToken => {

        if (this.commonMethod.checkNetwork()) {
          this.commonMethod.showLoader();
          this.commonMethod.getData(getPrivateOnlyUrl + "?chat_id=" + id + "&is_private=true", accessToken).subscribe(
            data => {
              this.chanelCreateData = data.json();
              console.log(this.chanelCreateData);
              // this.navCtrl.setRoot(ChattingPage);
              let privateInfoData = {
                "private_chat": true,
                "id": this.chanelCreateData[0].chat.id,
                "name": this.chanelCreateData[0].target_user.name,
                "created_at": this.chanelCreateData[0].chat.created_at,
                "owner_id": this.chanelCreateData[0].chat.owner_id,
                "message_date": message_date,
                "message_id": message_id,
                "highlight_message": true,
                "reply_on_message": true,
                "users": []
              };
              privateInfoData.users.push({ "id": this.chanelCreateData[0].chat.users[0].id });
              privateInfoData.users.push({ "id": this.chanelCreateData[0].chat.users[1].id });

              console.log(JSON.stringify(privateInfoData));
              this.commonMethod.hideLoader();

              let objData = { status: 'checked' };
              let alertVar = this.alertCtrl.create({
                title: 'Error!',
                subTitle: 'Invalid Details!',
                buttons: ['OK']
              });

              this.nativeStorage.getItem('user_auth').then(
                accessToken => {

                  if (this.commonMethod.checkNetwork()) {

                    this.commonMethod.putData(deleteMentionUrl + "/" + this.foundRepos[index].mention_id, objData, accessToken).subscribe(
                      data => {
                        this.foundRepos.splice(index, 1);
                        this.commonMethod.hideLoader();
                        this.navCtrl.push(GroupChatPage, { groupInfo: privateInfoData });
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

  doRefresh(refresher) {
    refresher.complete();
    this.callMyMentions();
  }

  acknowledgeMention(content_id, created_by, mention_type, index) {

    let alertVar = this.alertCtrl.create({
      title: 'Error!',
      subTitle: 'Invalid Details!',
      buttons: ['OK']
    });

    let acknowledeable_type = "ChatMessage";
    if (mention_type == "feed_mention" || mention_type == "feed") {
      acknowledeable_type = "Engage::Message";
    }

    let objData = { 'acknowledgement': { 'target_user_id': created_by, 'acknowledeable_id': content_id, 'acknowledeable_type': acknowledeable_type } };

    this.nativeStorage.getItem('user_auth').then(

      accessToken => {

        if (this.commonMethod.checkNetwork()) {
          this.foundRepos[index].inProgress = true;
          this.commonMethod.postDataWithoutLoder(createAcknowledgementUrl, objData, accessToken).subscribe(
            data => {
              //let res=data.json();
              this.foundRepos[index].acknowledged_by_me = true;
              this.foundRepos[index].inProgress = false;
              //alert(data.json());
            },
            err => {
              //this.commonMethod.hideLoader();
              this.foundRepos[index].inProgress = false;
              console.log("Error 1: " + JSON.stringify(err.json()));

            },
            () => {
              //this.commonMethod.hideLoader();
              this.foundRepos[index].inProgress = false;
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

  ionViewDidEnter() {
    console.log("page loaded");
    this.nativeStorage.setItem('lastPage', { "pageName": MyMentionPage.name, "index": this.navCtrl.getActive().index });
    this.callMyMentions();
  }

  doInfinite(infiniteScroll) {
    infiniteScroll.complete();
    if (this.showPageLoader == true) {
      this.showPageLoader = false;
      console.log("i=" + this.currentPage * this.limit + " limit=" + this.limit * (this.currentPage + 1));
      for (let i = (this.currentPage * this.limit); i < (this.limit * (this.currentPage + 1)); i++) {
        if (this.tempFoundRepos[i] != "undefined" && this.tempFoundRepos[i] != null) {
          this.foundRepos.push(this.tempFoundRepos[i]);
        }
      }
      this.currentPage++;
      this.showPageLoader = true;
    }
  }

  openWorkOrderPage(id, url) {
    this.nativeStorage.getItem('user_auth').then(
      accessToken => {

        let token = accessToken.access_token ? accessToken.access_token : '';
        let property_token = accessToken.property_token ? accessToken.property_token : '';
        //let url = viewWorkOrderUrl + "?authorization=" + token+"&property_token="+property_token+"&id="+id;
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

    //this.navCtrl.setRoot(WebHomePage, {id:id});
  }

  ionViewWillLeave() {
    console.log("Looks like I'm about to leave :(, clear notification Interval");
    window.clearInterval(this.interval);
  }

  clearAll() {
    let alert = this.alertCtrl.create({
      message: clearAllMentionsMsg,
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
            this.deleteAllMentions();
          }
        }
      ]
    });
    alert.present();
  }

  deleteAllMentions() {
    this.foundRepos = this.tempFoundRepos;
    let tempObj = JSON.parse(JSON.stringify(this.foundRepos));
    let total = tempObj.length;

    let objData = {};
    let alertVar = this.alertCtrl.create({
      title: 'Error!',
      subTitle: 'Invalid Details!',
      buttons: ['OK']
    });
    this.nativeStorage.getItem('user_auth').then(
      accessToken => {
        if (this.commonMethod.checkNetwork()) {
          this.commonMethod.putDataWithoutLoder(clearAllMentionsUrl, objData, accessToken).subscribe(
            data => {
              for (let i = 0; i < total; i++) {
                setTimeout(() => {
                  this.foundRepos.splice(0, 1);
                  this.tempFoundRepos.splice(0, 1);
                  tempObj[0].state = tempObj[0].state === 'active' ? 'inactive' : 'active';
                  tempObj.splice(0, 1);
                  if (i == (total - 1)) {
                    this.zone.run(() => {
                      this.allDeletedMsg = "All the mentions have been cleared!";
                      this.foundRepos = [];
                    });
                  }
                }, i * 200);
              }
            },
            err => {
              //this.commonMethod.hideLoader();
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
          //this.commonMethod.showNetworkError();
        }
      },
      error => {
        return '';
      }
    );
  }

  snoozeAll() {
    let alertVar = this.alertCtrl.create({
      title: 'Error!',
      subTitle: 'Invalid Details!',
      buttons: ['OK']
    });
    let objData = {};
    this.nativeStorage.getItem('user_auth').then(
      accessToken => {
        if (this.commonMethod.checkNetwork()) {
          this.commonMethod.putData(snoozeMentionUrl, objData, accessToken).subscribe(
            data => {
              this.callMyMentions();
              //alert(data.json());
            },
            err => {
              this.commonMethod.hideLoader();
              console.log("Error 1: " + JSON.stringify(err.json()));
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

  snooze(index) {
    let alertVar = this.alertCtrl.create({
      title: 'Error!',
      subTitle: 'Invalid Details!',
      buttons: ['OK']
    });
    let objData = { 'mention_ids': [this.foundRepos[index].mention_id] };
    this.nativeStorage.getItem('user_auth').then(
      accessToken => {
        if (this.commonMethod.checkNetwork()) {
          this.tempFoundRepos[index].snoozeInProgress = true;
          this.foundRepos[index].snoozeInProgress = true;
          this.commonMethod.putDataWithoutLoder(snoozeMentionUrl, objData, accessToken).subscribe(
            data => {
              this.foundRepos[index].snoozed = true;
              this.tempFoundRepos[index].snoozed = true;
              this.foundRepos[index].snoozeInProgress = false;
              this.tempFoundRepos[index].snoozeInProgress = false;
              this.isAllSnooze();
              //alert(data.json());
            },
            err => {
              this.foundRepos[index].snoozeInProgress = false;
              this.tempFoundRepos[index].snoozeInProgress = false;
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

  unsnoozeAll() {
    let alertVar = this.alertCtrl.create({
      title: 'Error!',
      subTitle: 'Invalid Details!',
      buttons: ['OK']
    });
    let objData = {};
    this.nativeStorage.getItem('user_auth').then(
      accessToken => {
        if (this.commonMethod.checkNetwork()) {
          this.commonMethod.putData(unsnoozeMentionUrl, objData, accessToken).subscribe(
            data => {
              this.callMyMentions();
              //alert(data.json());
            },
            err => {
              this.commonMethod.hideLoader();
              console.log("Error 1: " + JSON.stringify(err.json()));
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

  unsnooze(index) {
    let alertVar = this.alertCtrl.create({
      title: 'Error!',
      subTitle: 'Invalid Details!',
      buttons: ['OK']
    });
    let objData = { 'mention_ids': [this.foundRepos[index].mention_id] };
    this.nativeStorage.getItem('user_auth').then(
      accessToken => {
        if (this.commonMethod.checkNetwork()) {
          this.foundRepos[index].unsnoozeInProgress = true;
          this.tempFoundRepos[index].unsnoozeInProgress = true;
          this.commonMethod.putDataWithoutLoder(unsnoozeMentionUrl, objData, accessToken).subscribe(
            data => {
              this.foundRepos[index].snoozed = false;
              this.tempFoundRepos[index].snoozed = false;
              this.foundRepos[index].unsnoozeInProgress = false;
              this.tempFoundRepos[index].unsnoozeInProgress = false;
              this.isAllSnooze();
              //alert(data.json());
            },
            err => {
              this.foundRepos[index].unsnoozeInProgress = false;
              this.tempFoundRepos[index].unsnoozeInProgress = false;
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

  isAllSnooze() {
    this.snoozeAllStatus = true;
    for (let i = 0; i < this.tempFoundRepos.length; i++) {
      if (this.tempFoundRepos[i].snoozed == false) {
        this.snoozeAllStatus = false;
      }
    }
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
    this.createFeed();
  }

  createWorkOrderQuick(fab?: FabContainer) {
    if (fab !== undefined) {
      fab.close();
    }
    this.fabButtonOpened = false;
    this.createWorkOrder('', '', '', '', '');
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



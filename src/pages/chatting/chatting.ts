import { Component, ViewChild } from '@angular/core';
import { NavController, AlertController, Content, NavParams, ModalController, Platform, FabContainer } from 'ionic-angular';
import { srviceMethodsCall } from '../../services/serviceMethods';
import { getGroupsOnlyUrl } from '../../services/configURLs';
import { chatHistoryUrl } from '../../services/configURLs';
import { NativeStorage } from '@ionic-native/native-storage';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { Keyboard } from '@ionic-native/keyboard';
import { FeedsPage } from '../feeds/feeds';
import { AddEditGroupPage } from '../addEditGroup/addEditGroup';
import { GroupChatPage } from '../groupChat/groupChat';
import { IndividualChatPage } from '../individualChat/individualChat';
import { MyMentionPage } from '../myMention/myMention';
import { WorkOrderPage } from '../workOrder/workOrder';
import { getPrivateOnlyUrl } from '../../services/configURLs';
import { addEditGroupUrl } from '../../services/configURLs';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { viewWorkOrderUrl } from '../../services/configURLs';
import { BroadcastListPage } from '../broadcastList/broadcastList';
import { TaskChecklistPage } from '../taskChecklist/taskChecklist';
import { SendMessagePage } from '../sendMessage/sendMessage';
import { CreateWorkOrderPage } from '../createWorkOrder/createWorkOrder';
import { CreateFeedsPage } from '../createFeeds/createFeeds';
import { GoogleAnalyticsProvider } from '../../providers/google-analytics/google-analytics';

@Component({
  selector: 'page-chatting',
  templateUrl: 'chatting.html',
  providers: [srviceMethodsCall, NativeStorage, SQLite, Keyboard, InAppBrowser, FabContainer]
})

export class ChattingPage {

  public foundRepos: any;
  public foundRepos1: any;
  @ViewChild(Content) content: Content;
  public showGroupList: any = true;
  public showIndividualList: any = false;
  public filterDate: Date;
  public max_message_id: any;
  public members = [];
  public searchDataResponse = [];
  public groupReponse: any;
  public chanelCreateData: any;
  public userId: any;
  public tabSearch = false;
  searchQuery: string = '';
  public viewWOUrl = "";
  public initWithPrivate = false;
  public totalPrivateUSers = 0;
  public feedNotificationCount = 0;
  public messagesNotificationCount = 0;
  public woNotificationCount = 0;
  public totalUnreadGroupCount = 0;
  public totalUnreadPrivateCount = 0;
  public interval: any;
  public tabClickable = true;
  public broadcast_count = 0;
  public userPermissions: any;
  public privateSpinner = false;
  public groupSpinner = false;
  public fabButtonOpened = false;

  constructor(public googleAnalytics: GoogleAnalyticsProvider, public navCtrl: NavController, public commonMethod: srviceMethodsCall, public alertCtrl: AlertController, public nativeStorage: NativeStorage, private sqlite: SQLite, public keyboard: Keyboard, public navParams: NavParams, private iab: InAppBrowser, public modalCtrl: ModalController, public platform: Platform, public fabContainer: FabContainer) {

    this.viewWOUrl = viewWorkOrderUrl;

    this.foundRepos = { groups: [], privates: [] };
    this.filterDate = new Date();
    this.filterDate.setDate(this.filterDate.getDate() - 6);

    let showPrivateList = this.navParams.get('show_private_list');
    if (showPrivateList) {
      this.showIndividualList = true;
      this.showGroupList = false;
      this.initWithPrivate = true;
    }

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

  getChatListing() {
    let insertChatGroupsQuery = 'INSERT INTO chat_groups (id, name, hotel_token, created_by_id, deleted_at, created_at, updated_at, image_url) VALUES ';
    let insertChatGroupUsersQuery = 'INSERT INTO chat_group_users (group_id, user_id, is_admin, deleted_at, created_at) VALUES ';
    let insertChatGroupsData = "";
    let insertChatGroupUsersData = "";
    let updateChatGroupsQuery = "Update chat_groups SET name = (case ";
    let updateImageChatGroupsQuery = "Update chat_groups SET image_url = (case ";
    let updateChatGroupsData = "";
    let updateImageChatGroupsData = "";
    let updateChatGroupUsersQuery = "UPDATE chat_group_users SET group_id = (case ";
    let updateChatGroupUsersGroupIdData = "";
    let updateChatGroupUsersUserIdData = "Else group_id End), user_id = (case ";
    let tempVal = 0;
    let insertGroupFlag = false;
    let updateGroupFlag = false;
    let insertUserFlag = false;
    let updateUserFlag = false;
    let alertVar = this.alertCtrl.create({
      title: 'Error!',
      subTitle: 'Invalid Details!',
      buttons: ['OK']
    });

    this.nativeStorage.getItem('user_auth').then(
      accessToken => {
        this.userId = accessToken.user_id;

        if (this.commonMethod.checkNetwork()) {

          this.groupSpinner = true;
          this.commonMethod.getDataWithoutLoder(getGroupsOnlyUrl, accessToken).timeout(60000).subscribe(
            data => {
              console.log('getData completed time out 1');

              this.foundRepos.groups = data.json();

              this.sqlite.create({
                name: 'data.db',
                location: 'default'
              }).then((db: SQLiteObject) => {
                // db.executeSql('CREATE TABLE IF NOT EXISTS chat_groups(id INTEGER, name TEXT, hotel_token TEXT, created_by_id INTEGER,deleted_at TEXT,created_at TEXT,updated_at TEXT)', {})
                //   .then((dbRes) => {
                //     console.log("GROUPS TABLE CREATED: " + JSON.stringify(dbRes));

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

                  this.totalUnreadGroupCount = 0;
                  for (let i = 0; i < this.foundRepos.groups.length; i++) {
                    let insertFlag = true;
                    this.totalUnreadGroupCount = this.totalUnreadGroupCount + parseInt(this.foundRepos.groups[i].chat.unread);

                    for (let j = 0; j < allExistingIds.length; j++) {
                      if (this.foundRepos.groups[i].chat.id == allExistingIds[j].id) {
                        insertFlag = false;
                      }
                    }

                    if (insertFlag == true) {
                      insertGroupFlag = true;
                      insertChatGroupsData = insertChatGroupsData + "('" + this.foundRepos.groups[i].chat.id + "','" + this.foundRepos.groups[i].chat.name.replace(/'/g, "&#39;") + "','','" + this.foundRepos.groups[i].chat.owner_id + "','','" + this.foundRepos.groups[i].chat.created_at + "','','" + this.foundRepos.groups[i].chat.image_url + "'),";
                    }
                    else {
                      //updateGroupFlag = true;
                      updateChatGroupsData = updateChatGroupsData + "when id = " + this.foundRepos.groups[i].chat.id + " then '" + this.foundRepos.groups[i].chat.name.replace(/'/g, "&#39;") + "' ";
                      updateImageChatGroupsData = updateImageChatGroupsData + "when id = " + this.foundRepos.groups[i].chat.id + " then '" + this.foundRepos.groups[i].chat.image_url + "' ";

                      if (i == this.foundRepos.groups.length - 1) {
                        //console.log("Update  chat_groups Data == " + updateChatGroupsQuery + updateChatGroupsData + " Else name End)");
                        if (updateChatGroupsData != "") {
                          db.executeSql(updateChatGroupsQuery + updateChatGroupsData + " Else name End)", {}).then((data1) => {
                            console.log("UPDATED: " + JSON.stringify(data1));
                            updateGroupFlag = false;
                            this.hideLoader(insertGroupFlag, updateGroupFlag, insertUserFlag, updateUserFlag);
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
                    db.executeSql("SELECT * FROM chat_group_users WHERE group_id='" + this.foundRepos.groups[i].chat.id + "'", []).then((dataUserSQL) => {
                      console.log("GROUP USER TABLE DATA: " + JSON.stringify(dataUserSQL));
                      tempVal = tempVal + 1;
                      if (dataUserSQL.rows.length > 0) {
                        for (let k = 0; k < dataUserSQL.rows.length; k++) {
                          allExistingUserIds.push({
                            user_id: dataUserSQL.rows.item(k).user_id
                          });
                        }
                      }

                      for (let k = 0; k < this.foundRepos.groups[i].chat.users.length; k++) {
                        let insertUserFlag = true;
                        for (let l = 0; l < allExistingUserIds.length; l++) {
                          if (this.foundRepos.groups[i].chat.users[k].id == allExistingUserIds[l].user_id) {
                            insertUserFlag = false;
                          }
                        }
                        if (insertUserFlag == true) {
                          insertUserFlag = true;
                          insertChatGroupUsersData = insertChatGroupUsersData + "('" + this.foundRepos.groups[i].chat.id + "','" + this.foundRepos.groups[i].chat.users[k].id + "','0','','" + this.foundRepos.groups[i].chat.users[k].joined_at + "'),";
                          console.log("insertChatGroupUsersData  " + insertChatGroupUsersData);
                        }
                        else {
                          updateUserFlag = true;
                          updateChatGroupUsersGroupIdData = updateChatGroupUsersGroupIdData + "when user_id='" + this.foundRepos.groups[i].chat.users[k].id + "' AND group_id='" + this.foundRepos.groups[i].chat.id + "' then '" + this.foundRepos.groups[i].chat.id + "' ";
                          updateChatGroupUsersUserIdData = updateChatGroupUsersUserIdData + "when user_id='" + this.foundRepos.groups[i].chat.users[k].id + "' AND group_id='" + this.foundRepos.groups[i].chat.id + "' then '" + this.foundRepos.groups[i].chat.users[k].id + "' ";
                        }

                      }

                      if (tempVal == this.foundRepos.groups.length) {
                        if (insertChatGroupUsersData != "") {
                          db.executeSql(insertChatGroupUsersQuery + insertChatGroupUsersData.substring(0, insertChatGroupUsersData.length - 1), {}).then((dataUser1) => {
                            console.log("Data  == GROUP USER INSERTED: " + JSON.stringify(dataUser1));
                            insertUserFlag = false;
                            this.hideLoader(insertGroupFlag, updateGroupFlag, insertUserFlag, updateUserFlag);

                            //   this.commonMethod.hideLoader();

                          }, (errorUser1) => {
                            console.log("Data  == GROUP USER INSERT ERROR: " + JSON.stringify(errorUser1));
                          });
                        } else if (updateChatGroupUsersGroupIdData == "") {
                          //this.commonMethod.hideLoader();
                          this.hideLoader(insertGroupFlag, updateGroupFlag, insertUserFlag, updateUserFlag);

                        }
                        if (updateChatGroupUsersGroupIdData != "") {
                          //console.log("chat_group_users Data  == " + updateChatGroupUsersQuery + updateChatGroupUsersGroupIdData + updateChatGroupUsersUserIdData + "Else user_id End)");
                          db.executeSql(updateChatGroupUsersQuery + updateChatGroupUsersGroupIdData + updateChatGroupUsersUserIdData + "Else user_id End)", {}).then((dataUser1) => {
                            //  this.commonMethod.hideLoader();
                            updateUserFlag = false;
                            this.hideLoader(insertGroupFlag, updateGroupFlag, insertUserFlag, updateUserFlag);

                            console.log(" 1 GROUP USER UPDATED: " + JSON.stringify(dataUser1) + "  " + i + "  " + this.foundRepos.groups.length);
                          }, (errorUser1) => {
                            console.log("GROUP USER UPDATED ERROR: " + JSON.stringify(errorUser1));
                          });
                        }
                      }
                    }, (errorUser) => {
                      console.log("1 ERROR: " + JSON.stringify(errorUser));
                    });

                    // }, (errorUser) => {
                    //   console.error("Unable to execute sql", errorUser);
                    // }).catch(e => console.log('Executed SQL Error= ' + JSON.stringify(e)));

                    /* Group SQL code end  */


                  }

                  this.nativeStorage.getItem('user_notifications').then(
                    notifications => {
                      let feedCount = notifications.feed_count;
                      let messageCount = this.totalUnreadGroupCount + this.totalUnreadPrivateCount;
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

                  if (insertChatGroupsData != "") {
                    db.executeSql(insertChatGroupsQuery + insertChatGroupsData.substring(0, insertChatGroupsData.length - 1), {}).then((data1) => {
                      insertGroupFlag = false;
                      // this.commonMethod.hideLoader();
                      this.hideLoader(insertGroupFlag, updateGroupFlag, insertUserFlag, updateUserFlag);

                      console.log("Data  == GROUPS INSERTED: " + JSON.stringify(data1));
                    }, (error1) => {
                      console.log("Data  == GROUPS INSERT ERROR: " + JSON.stringify(error1));
                    });
                  }
                  else {
                    //  this.commonMethod.hideLoader();
                    this.hideLoader(insertGroupFlag, updateGroupFlag, insertUserFlag, updateUserFlag);

                  }
                  //this.commonMethod.hideLoader();
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
              console.log('getData completed time out 3');

              //this.commonMethod.hideLoader();
              this.groupSpinner = false;
              alertVar.present();
              console.error("Error : " + err);
            },
            () => {
              console.log('getData completed time out 2');

              console.log('getData completed');
            }
          );
        }
        else {
          this.tabClickable = true;
          this.commonMethod.hideLoader();
          this.commonMethod.showNetworkError();
        }


      },
      error => {
        this.tabClickable = true;
        return '';
      }
    );
  }
  hideLoader(insertGroupFlag, updateGroupFlag, insertUserFlag, updateUserFlag) {
    if (!insertGroupFlag && !updateGroupFlag && !insertUserFlag && !updateUserFlag) {
      //this.commonMethod.hideLoader();
      this.groupSpinner = false;
    }
  }
  toggleDetails(group, individual) {
    if (individual == true && this.tabClickable) {
      console.log("toggleDetails 1");
      this.tabClickable = false;
      this.openIndividualTab();
    } else if (this.tabClickable) {
      console.log("toggleDetails 2");

      this.getChatListing();
      this.tabClickable = false;

    }

    this.showGroupList = group;
    this.showIndividualList = individual;

    this.nativeStorage.getItem('user_notifications').then(
      count => {
        this.feedNotificationCount = count.feed_count ? count.feed_count : 0;
        this.messagesNotificationCount = count.message_count ? count.message_count : 0;
        this.woNotificationCount = count.wo_count ? count.wo_count : 0;
      },
      error => {
        return false;
      }
    );

  }

  openIndividualTab() {
    let alertVar = this.alertCtrl.create({
      title: 'Error!',
      subTitle: 'Invalid Details!',
      buttons: ['OK']
    });

    this.nativeStorage.getItem('user_auth').then(
      accessToken => {
        if (this.commonMethod.checkNetwork()) {
          //this.commonMethod.showLoader();
          this.privateSpinner = true;
          this.commonMethod.getDataWithoutLoder(getPrivateOnlyUrl, accessToken).timeout(60000).subscribe(
            data => {
              // //this.commonMethod.hideLoader();
              this.privateSpinner = false;
              this.tabClickable = true;
              this.totalUnreadPrivateCount = 0;
              console.log(JSON.stringify(data.json()))
              this.foundRepos.privates = data.json();

              for (let i = 0; i < this.foundRepos.privates.length; i++) {
                let insertFlag = true;
                this.totalUnreadPrivateCount = this.totalUnreadPrivateCount + parseInt(this.foundRepos.privates[i].chat.unread);
              }

              this.nativeStorage.getItem('user_notifications').then(
                notifications => {
                  let feedCount = notifications.feed_count;
                  let messageCount = this.totalUnreadGroupCount + this.totalUnreadPrivateCount;
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

            },
            err => {
              this.privateSpinner = false;
              this.tabClickable = true;
              alertVar.present();
              console.error("Error : " + err);
            },
            () => {
              this.tabClickable = true;

              //this.commonMethod.hideLoader();
              console.log('getData completed');
            }
          );
        }
        else {
          this.tabClickable = true;
          this.commonMethod.hideLoader();
          this.commonMethod.showNetworkError();
        }

      },
      error => {
        this.tabClickable = true;
        return '';
      }
    );
  }

  openGroupCaht(res) {
    this.navCtrl.push(GroupChatPage, { groupInfo: res });
  }

  createGroup() {
    this.navCtrl.push(AddEditGroupPage);
  }

  editGroup(res) {
    this.navCtrl.push(AddEditGroupPage, { groupInfo: res });
  }
  /* functions for footer */
  openFeedPage() {
    this.googleAnalytics.bottomTabClick('Open Feed Page')
    this.navCtrl.setRoot(FeedsPage);
  }
  openMyMentionPage() {
    this.googleAnalytics.bottomTabClick('Open Mentions Page')
    this.navCtrl.setRoot(MyMentionPage);
  }
  openWOPage() {
    this.googleAnalytics.bottomTabClick('Open Work Order Page')
    this.navCtrl.setRoot(WorkOrderPage);
  }
  openTaskChecklistPage() {
    this.googleAnalytics.bottomTabClick('Open Check List Page')
    this.navCtrl.setRoot(TaskChecklistPage);
  }

  //TODO: Need to move this function into utility folder. 
  updateHtml(val, mentioned_user_ids) {
    //alert(val);
    //alert(mentioned_user_ids);
    let allChatMentions = [];
    if (mentioned_user_ids != '' && mentioned_user_ids != null) {
      allChatMentions = mentioned_user_ids;
    }

    // let mentionStr = this.commonMethod.getMentionString(allChatMentions, this.members);
    // if (mentionStr != "") {
    //   // val = mentionStr + val;
    // }

    let newValue = this.commonMethod.getTextValue(allChatMentions, this.members, val);
    if (newValue != "") {
      val = newValue;
    }

    return val.replace(/text-decoration-line/g, "text-decoration").replace(/<\/?a[^>]*>/g, "");
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
              "image": allMembers.rows.item(i).image,
              "is_system_user": allMembers.rows.item(i).is_system_user
            };

            this.members.push(tempUserInfo);
          }
          this.getTotalUsers();
        }

      }, (error1) => {
        console.log("SELECT MEMBERS ERROR: " + JSON.stringify(error1));
      });

    }).catch(e => console.log(e));
  }


  updateChatDB() {
    let dd = ("0" + this.filterDate.getDate()).slice(-2);
    let mm = ("0" + ((this.filterDate.getMonth()) + 1)).slice(-2); //January is 0!
    let yyyy = this.filterDate.getFullYear();
    let insertChatMessagesQuery = 'INSERT INTO chat_messages (id, sender_id, hotel_token, message, image, target_id, type, deleted_at, created_at, updated_at, read_status, work_order_id) VALUES ';
    let insertChatMessagesData = "";
    let tempval = 0;

    let alertVar = this.alertCtrl.create({
      title: 'Error!',
      subTitle: 'Invalid Details!',
      buttons: ['OK']
    });

    this.sqlite.create({
      name: 'data.db',
      location: 'default'
    }).then((db: SQLiteObject) => {

      db.executeSql("CREATE TABLE IF NOT EXISTS chat_messages(id INTEGER, sender_id INTEGER,hotel_token TEXT, message TEXT, image TEXT, target_id INTEGER, type TEXT, deleted_at TEXT, created_at TEXT, updated_at TEXT, read_status INTEGER, mentioned_user_ids TEXT, parent_id TEXT, work_order_id INTEGER)", {}).then((data1) => {
        console.log("MESSAGE TABLE C REATED: " + JSON.stringify(data1));
      }, (error1) => {
        console.log("MESSAGE TABLE CREATE ERROR: " + JSON.stringify(error1));
      });


      db.executeSql("SELECT MAX(id) as max_chat_id FROM chat_messages", {}).then((maxIdData) => {
        console.log("SELECT MAX MESSAGE ID: " + JSON.stringify(maxIdData));

        if (maxIdData.rows.length > 0) {
          for (let k = 0; k < maxIdData.rows.length; k++) {
            this.max_message_id = maxIdData.rows.item(k).max_chat_id
          }
        }

        let apiUrl = chatHistoryUrl + '?type=group&id=all&from=' + yyyy + '-' + mm + '-' + dd;
        if (this.max_message_id && this.max_message_id > 0) {
          apiUrl += "&last_id=" + this.max_message_id;
        }

        this.nativeStorage.getItem('user_auth').then(
          accessToken => {

            if (this.commonMethod.checkNetwork()) {

              this.commonMethod.getDataWithoutLoder(apiUrl, accessToken).subscribe(
                data => {
                  //console.log(data.json());
                  let allData = data.json();
                  var keys = Object.keys(allData);
                  var len = keys.length;

                  this.sqlite.create({
                    name: 'data.db',
                    location: 'default'
                  }).then((db: SQLiteObject) => {
                    db.executeSql('CREATE TABLE IF NOT EXISTS chat_messages(id INTEGER, sender_id INTEGER,hotel_token TEXT, message TEXT, image TEXT, target_id INTEGER, type TEXT, deleted_at TEXT, created_at TEXT, updated_at TEXT, read_status INTEGER, mentioned_user_ids TEXT, parent_id TEXT, work_order_id INTEGER)', {})
                      .then((dbRes) => {
                        console.log("CHAT MESSAGES TABLE CREATED: " + JSON.stringify(dbRes));
                        for (let key in allData) {
                          let obj = allData[key];

                          for (let i = 0; i < obj.length; i++) {
                            db.executeSql("SELECT * FROM chat_messages WHERE id='" + obj[i].id + "'", {}).then((oldData) => {
                              if (i == obj.length - 1) {
                                tempval = tempval + 1;
                              }
                              if (oldData.rows.length <= 0) {

                                insertChatMessagesData = insertChatMessagesData + "('" + obj[i].id + "','" + obj[i].sender_id + "','','" + obj[i].message.replace(/'/g, "&#39;") + "','','" + key + "','group','','" + obj[i].created_at + "','','" + obj[i].read + "',''),";
                                if (tempval == len && i == obj.length - 1 && insertChatMessagesData != "") {
                                  db.executeSql(insertChatMessagesQuery + insertChatMessagesData.substring(0, insertChatMessagesData.length - 1), {}).then((data1) => {
                                    console.log("Data  == MESSAGE INSERTED: " + JSON.stringify(data1));
                                    this.commonMethod.hideLoader();

                                  }, (error1) => {
                                    console.log("Data  == MESSAGE INSERT ERROR: " + JSON.stringify(error1));
                                    this.commonMethod.hideLoader();
                                  });
                                }

                              }
                              else {
                                console.log("MESSAGE Exist id= : " + obj[i].id);
                                if (tempval == len && i == obj.length - 1 && insertChatMessagesData != "") {
                                  db.executeSql(insertChatMessagesQuery + insertChatMessagesData.substring(0, insertChatMessagesData.length - 1), {}).then((data1) => {
                                    console.log("Data  == MESSAGE INSERTED: " + JSON.stringify(data1));
                                    this.commonMethod.hideLoader();

                                  }, (error1) => {
                                    console.log("Data  == MESSAGE INSERT ERROR: " + JSON.stringify(error1));
                                    this.commonMethod.hideLoader();

                                  });
                                }
                                if (allData.length - 1 == tempval && i == obj.length - 1) {
                                  this.commonMethod.hideLoader();
                                }
                              }
                            }, (error1) => {
                              console.log("SELECT MESSAGE ERROR: " + JSON.stringify(error1));
                            });

                          }
                        }

                        if (JSON.stringify(allData) == "{}") {
                          this.commonMethod.hideLoader();
                          console.log("Hide Loader");
                        }
                      }, (error) => {
                        console.error("Unable to execute sql" + JSON.stringify(error));
                      }).catch(e => console.log('Executed SQL Error= ' + JSON.stringify(e)));
                  }).catch(e => console.log(e));


                },
                err => {
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
        //

      }, (error1) => {
        console.log("SELECT MAX MESSAGE ERROR: " + JSON.stringify(error1));
      });
    }).catch(e => console.log(e));
  }

  ionViewDidEnter() {
    this.nativeStorage.setItem('lastPage', { "pageName": ChattingPage.name, "index": this.navCtrl.getActive().index });
    this.platform.ready().then(() => {

      // this.platform.registerBackButtonAction(() => {

      //   this.keyboard.close();
      //   setTimeout(() => {
      //     this.platform.exitApp();
      //   },
      //     100);
      // });
    });

    let showPrivateList = this.navParams.get('show_private_list');
    if (showPrivateList) {
      this.showIndividualList = true;
      this.showGroupList = false;
      this.initWithPrivate = true;
    }
    console.log("I'm alive!");
    if (this.showIndividualList == true) {
      this.openIndividualTab();
    }
    else {
      this.getChatListing();
    }
  }
  scrollTo(elementId: string) {
    // alert(elementId);
    let yOffset = document.getElementById(elementId).offsetTop;
    this.content.scrollTo(0, yOffset, 4000);
  }

  closeSearch() {
    this.searchQuery = "";
    this.tabSearch = false;
    this.searchDataResponse = [];
  }
  closekeyboard() {
    this.keyboard.close();
  }
  searchData() {
    this.searchQuery = this.searchQuery.trim();
    this.tabSearch = true;
    this.searchDataResponse = [];
    if (this.searchQuery != '') {
      this.keyboard.close();
      //alert(this.searchQuery);

      this.sqlite.create({
        name: 'data.db',
        location: 'default'
      }).then((db: SQLiteObject) => {

        db.executeSql("SELECT chat_messages.*,members.* ,chat_groups.name as group_name, chat_groups.id as group_id FROM chat_messages LEFT JOIN members ON members.user_id=chat_messages.sender_id LEFT JOIN chat_groups ON chat_groups.id=chat_messages.target_id AND chat_messages.type='group' WHERE message LIKE '%" + this.searchQuery + "%' ORDER BY created_at DESC", {}).then((searchData) => {
          console.log("SELECT chat_messages.*,members.* ,chat_groups.name as group_name, chat_groups.id as group_id FROM chat_messages LEFT JOIN members ON members.user_id=chat_messages.sender_id LEFT JOIN chat_groups ON chat_groups.id=chat_messages.target_id AND chat_messages.type='group' WHERE message LIKE '%" + this.searchQuery + "%' ORDER BY created_at DESC");
          //alert(searchData.rows.length);
          if (searchData.rows.length > 0) {
            for (let i = 0; i < searchData.rows.length; i++) {
              //searchData.rows.item(i).id)
              let chatInfoData = {
                "id": searchData.rows.item(i).id,
                "name": searchData.rows.item(i).name,
                "message": searchData.rows.item(i).message,
                "created_at": searchData.rows.item(i).created_at,
                "owner_id": searchData.rows.item(i).sender_id,
                "message_date": searchData.rows.item(i).created_at,
                "message_id": searchData.rows.item(i).id,
                "image": searchData.rows.item(i).image,
                "group_name": searchData.rows.item(i).group_name,
                "group_id": searchData.rows.item(i).target_id,
                "target_id": searchData.rows.item(i).target_id,
                "is_private": searchData.rows.item(i).group_id ? false : true,
                "users": [],
                "search_tap": true
              };
              this.searchDataResponse.push(chatInfoData);
              //groupInfoData.users.push({"id": allData.rows.item(i).user_id});
            }
          }
          else {
          }
        }, (error1) => {
          console.log("SELECT MESSAGE ERROR: " + JSON.stringify(error1));
        });

      }).catch(e => console.log(e));


    }
  }


  openSearchGroupCaht(id, message_id, is_private, message_date) {
    //alert(is_private);
    if (is_private == true) {
      this.openPrivateChat(id, message_id, message_date);
    }
    else {

      this.sqlite.create({
        name: 'data.db',
        location: 'default'
      }).then((db: SQLiteObject) => {

        db.executeSql("SELECT chat_groups.*,chat_group_users.user_id FROM chat_groups LEFT JOIN chat_group_users ON chat_group_users.group_id=chat_groups.id WHERE chat_groups.id='" + id + "'", {}).then((allData) => {
          console.log("SELECT chat_groups.*,chat_group_users.user_id FROM chat_groups LEFT JOIN chat_group_users ON chat_group_users.group_id=chat_groups.id WHERE chat_groups.id='" + id + "'" + JSON.stringify(allData));

          if (allData.rows.length > 0) {
            this.goToGroupChat(id, message_id);
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
            let insertChatGroupsQuery = 'INSERT INTO chat_groups (id, name, hotel_token, created_by_id, deleted_at, created_at, updated_at) VALUES ';
            let alertVar = this.alertCtrl.create({
              title: 'Error!',
              subTitle: 'Invalid Details!',
              buttons: ['OK']
            });

            this.nativeStorage.getItem('user_auth').then(
              accessToken => {
                if (this.commonMethod.checkNetwork()) {
                  this.commonMethod.showLoader();
                  this.commonMethod.getData(getGroupsOnlyUrl + "?chat_group_id=" + id, accessToken).subscribe(
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

                          for (let i = 0; i < this.groupReponse.groups.length; i++) {
                            let insertFlag = true;
                            for (let j = 0; j < allExistingIds.length; j++) {
                              if (this.groupReponse.groups[i].id == allExistingIds[j].id) {
                                insertFlag = false;
                              }
                            }

                            if (insertFlag == true) {
                              insertChatGroupsData = insertChatGroupsData + "('" + this.groupReponse.groups[i].id + "','" + this.groupReponse.groups[i].name + "','','" + this.groupReponse.groups[i].owner_id + "','','" + this.groupReponse.groups[i].created_at + "','','" + this.foundRepos.groups[i].chat.image_url + "'),";
                            }
                            else {
                              updateChatGroupsData = updateChatGroupsData + "when id = " + this.groupReponse.groups[i].id + " then '" + this.groupReponse.groups[i].name + "' ";
                              updateImageChatGroupsData = updateImageChatGroupsData + "when id = " + this.groupReponse.groups[i].id + " then '" + this.groupReponse.groups[i].image_url + "' ";

                              if (i == this.groupReponse.groups.length - 1) {
                                //console.log("Update  chat_groups Data == " + updateChatGroupsQuery + updateChatGroupsData + " Else name End)");
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
                            db.executeSql("SELECT * FROM chat_group_users WHERE group_id='" + this.groupReponse.groups[i].id + "'", []).then((dataUserSQL) => {
                              console.log("GROUP USER TABLE DATA: " + JSON.stringify(dataUserSQL));
                              tempVal = tempVal + 1;
                              if (dataUserSQL.rows.length > 0) {
                                for (let k = 0; k < dataUserSQL.rows.length; k++) {
                                  allExistingUserIds.push({
                                    user_id: dataUserSQL.rows.item(k).user_id
                                  });
                                }
                              }

                              for (let k = 0; k < this.groupReponse.groups[i].users.length; k++) {
                                let insertUserFlag = true;
                                for (let l = 0; l < allExistingUserIds.length; l++) {
                                  if (this.groupReponse.groups[i].users[k].id == allExistingUserIds[l].user_id) {
                                    insertUserFlag = false;
                                  }
                                }
                                if (insertUserFlag == true) {
                                  insertChatGroupUsersData = insertChatGroupUsersData + "('" + this.groupReponse.groups[i].id + "','" + this.groupReponse.groups[i].users[k].id + "','0','','" + this.groupReponse.groups[i].users[k].joined_at + "'),";
                                  console.log("insertChatGroupUsersData  " + insertChatGroupUsersData);
                                }
                                else {

                                  updateChatGroupUsersGroupIdData = updateChatGroupUsersGroupIdData + "when user_id='" + this.groupReponse.groups[i].users[k].id + "' AND group_id='" + this.groupReponse.groups[i].id + "' then '" + this.groupReponse.groups[i].id + "' ";
                                  updateChatGroupUsersUserIdData = updateChatGroupUsersUserIdData + "when user_id='" + this.groupReponse.groups[i].users[k].id + "' AND group_id='" + this.groupReponse.groups[i].id + "' then '" + this.groupReponse.groups[i].users[k].id + "' ";
                                }

                              }

                              if (tempVal == this.groupReponse.groups.length) {
                                if (insertChatGroupUsersData != "") {
                                  db.executeSql(insertChatGroupUsersQuery + insertChatGroupUsersData.substring(0, insertChatGroupUsersData.length - 1), {}).then((dataUser1) => {
                                    console.log("Data  == GROUP USER INSERTED: " + JSON.stringify(dataUser1));

                                    if (insertChatGroupsData != "") {
                                      db.executeSql(insertChatGroupsQuery + insertChatGroupsData.substring(0, insertChatGroupsData.length - 1), {}).then((data1) => {
                                        console.log("Data  == GROUPS INSERTED: " + JSON.stringify(data1));
                                        //this.commonMethod.hideLoader();
                                        this.goToGroupChat(id, message_id);
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
                                  //console.log("chat_group_users Data  == " + updateChatGroupUsersQuery + updateChatGroupUsersGroupIdData + updateChatGroupUsersUserIdData + "Else user_id End)");
                                  db.executeSql(updateChatGroupUsersQuery + updateChatGroupUsersGroupIdData + updateChatGroupUsersUserIdData + "Else user_id End)", {}).then((dataUser1) => {

                                    if (insertChatGroupsData != "") {
                                      db.executeSql(insertChatGroupsQuery + insertChatGroupsData.substring(0, insertChatGroupsData.length - 1), {}).then((data1) => {
                                        console.log("Data  == GROUPS INSERTED: " + JSON.stringify(data1));
                                        //this.commonMethod.hideLoader();
                                        this.goToGroupChat(id, message_id);
                                      }, (error1) => {
                                        console.log("Data  == GROUPS INSERT ERROR: " + JSON.stringify(error1));
                                      });
                                    }

                                    console.log(" 1 GROUP USER UPDATED: " + JSON.stringify(dataUser1) + "  " + i + "  " + this.groupReponse.groups.length);
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


  goToGroupChat(id, message_id) {
    let groupInfoData = {
      "id": id,
      "name": "",
      "image_url": "",
      "created_at": "",
      "owner_id": "",
      "message_date": "",
      "message_id": "",
      "highlight_message": true,
      "users": [],
      "search_tap": true
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
                "message_date": allData.rows.item(i).created_at,
                "message_id": message_id,
                "highlight_message": true,
                "users": [],
                "search_tap": true
              };
            }
            groupInfoData.users.push({ "id": allData.rows.item(i).user_id });
          }
          this.commonMethod.hideLoader();
          this.navCtrl.push(GroupChatPage, { groupInfo: groupInfoData });
        }
        else {
          this.commonMethod.showLoader();
          alert("Group data not available!");
        }
      }, (error1) => {
        this.commonMethod.showLoader();
        console.log("SELECT MEMBERS ERROR: " + JSON.stringify(error1));
      });

    }).catch(e => console.log(e));
  }

  goToPrivateChat(res) {
    if (res.chat.id == null) {
      //alert('create chat');
      this.createChatChanel(res);
    }
    else {
      if (res.chat.last_message != null) {
        let privateInfoData = {
          "private_chat": true,
          "id": res.chat.id,
          "name": res.target_user.name,
          "created_at": res.chat.created_at,
          "owner_id": res.chat.owner_id,
          "message_id": res.chat.last_message ? res.chat.last_message.id : '',
          "users": [],
          "search_tap": true
        };
        privateInfoData.users.push({ "id": res.chat.users[0].id });
        privateInfoData.users.push({ "id": res.chat.users[1].id });
        this.navCtrl.push(GroupChatPage, { groupInfo: privateInfoData });
      }
      else {
        let privateInfoData = {
          "private_chat": true,
          "id": res.chat.id,
          "name": res.target_user.name,
          "created_at": res.chat.created_at,
          "owner_id": res.chat.owner_id,
          "users": []
        };
        privateInfoData.users.push({ "id": res.chat.users[0].id });
        privateInfoData.users.push({ "id": res.chat.users[1].id });
        this.navCtrl.push(GroupChatPage, { groupInfo: privateInfoData });
      }
    }

  }

  createChatChanel(res) {
    let alertVar = this.alertCtrl.create({
      title: 'Error!',
      subTitle: 'Invalid Details!',
      buttons: ['OK']
    });

    let objData = { 'chat': { 'user_ids': [res.chat.users[0].id, res.chat.users[1].id], 'is_private': true } };
    this.nativeStorage.getItem('user_auth').then(
      accessToken => {

        if (this.commonMethod.checkNetwork()) {

          this.commonMethod.postData(addEditGroupUrl, objData, accessToken).subscribe(
            data => {
              this.chanelCreateData = data.json();
              console.log(this.chanelCreateData);
              // this.navCtrl.setRoot(ChattingPage);
              let privateInfoData = {
                "private_chat": true,
                "id": this.chanelCreateData.id,
                "name": this.chanelCreateData.name,
                "created_at": this.chanelCreateData.created_at,
                "owner_id": this.chanelCreateData.owner_id,
                "users": []
              };
              privateInfoData.users.push({ "id": this.chanelCreateData.users[0].id });
              privateInfoData.users.push({ "id": this.chanelCreateData.users[1].id });

              console.log(JSON.stringify(privateInfoData));

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
  }

  openPrivateChat(id, message_id, message_date) {
    //alert(id);
    //alert(message_id);
    //alert(message_date);

    this.commonMethod.showLoader();
    let alertVar = this.alertCtrl.create({
      title: 'Error!',
      subTitle: 'Invalid Details!',
      buttons: ['OK']
    });
    this.nativeStorage.getItem('user_auth').then(
      accessToken => {

        if (this.commonMethod.checkNetwork()) {

          this.commonMethod.getData(getPrivateOnlyUrl + "?chat_id=" + id + "&is_private=true", accessToken).timeout(60000).subscribe(
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
                "users": [],
                "highlight_message": true,
                "search_tap": true
              };
              privateInfoData.users.push({ "id": this.chanelCreateData[0].chat.users[0].id });
              privateInfoData.users.push({ "id": this.chanelCreateData[0].chat.users[1].id });

              console.log(JSON.stringify(privateInfoData));
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


  }

  getUserName(sender_id) {
    let userName = "";
    if (sender_id != "") {
      for (let l = 0; l < this.members.length; l++) {
        if (this.members[l].id == sender_id) {
          userName = this.members[l].name + ":";
        }
      }
    }
    return userName;
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

  getTotalUsers() {
    //console.log(JSON.stringify(this.members));
    let count = 0;
    for (let l = 0; l < this.members.length; l++) {
      if (this.members[l].is_system_user != 1) {
        count++;
      }
    }
    console.log("count=" + count);
    this.totalPrivateUSers = count - 1;
  }

  ionViewWillLeave() {
    console.log("Looks like I'm about to leave :(, clear notification Interval");
    window.clearInterval(this.interval);
  }

  broadcastList() {
    let modal = this.modalCtrl.create(BroadcastListPage);
    modal.onDidDismiss(data => {
      this.closekeyboard();
      //this.callTodaysFeedInBackground();
    });
    modal.present();
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



}

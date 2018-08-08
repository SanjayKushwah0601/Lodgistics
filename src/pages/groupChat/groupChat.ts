import { Component, NgZone, ViewChild, ElementRef, Input, Injectable } from '@angular/core';
import { ViewController, NavController, NavParams, Content, AlertController, ActionSheetController, ModalController, Events, Navbar, Platform, MenuController } from 'ionic-angular';
import { srviceMethodsCall } from '../../services/serviceMethods';
import { Keyboard } from '@ionic-native/keyboard';
import { NativeStorage } from '@ionic-native/native-storage';
import { getChatsUrl } from '../../services/configURLs';
import { getAwsSignedUrl } from '../../services/configURLs';
import { sendMessageUrl } from '../../services/configURLs';
import { markReadUrl } from '../../services/configURLs';
import { metaDataCallUrl } from '../../services/configURLs';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { Camera, CameraOptions } from '@ionic-native/camera';
import { TranslationService } from '../../providers/translation.service';
import { AddEditGroupPage } from '../addEditGroup/addEditGroup';
import { Transfer, FileUploadOptions, TransferObject } from '@ionic-native/transfer';
import { File } from '@ionic-native/file';
import { Clipboard } from '@ionic-native/clipboard';
import ActionCable from 'actioncable';
import { Http, Headers, RequestOptions } from '@angular/http';
import { ReplyMessagePage } from '../replyMessage/replyMessage';
import { WebHomePage } from '../webHomePage/webHomePage';
import { ChattingPage } from '../chatting/chatting';
import { chatCreateWorkOrderConfirmMsg } from '../../providers/appConfig';
import { CreateWorkOrderPage } from '../createWorkOrder/createWorkOrder';
import { MyMentionPage } from '../myMention/myMention';
import { ProfilePage } from '../profile/profile';
import { FeedsPage } from '../feeds/feeds';
import { MyVideosPage } from '../myVideos/myVideos';
import { CreateFeedsPage } from '../createFeeds/createFeeds';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { viewWorkOrderUrl } from '../../services/configURLs';
import { webSocketBaseUrl } from '../../services/configURLs';
import { WorkOrderPage } from '../workOrder/workOrder';
import { TaskChecklistPage } from '../taskChecklist/taskChecklist';
import { TaskChecklistDetailPage } from '../taskChecklistDetail/taskChecklistDetail';
import { UtilMethods } from '../../services/utilMethods';

import 'aws-sdk/dist/aws-sdk';
const AWS = (<any>window).AWS;

@Component({
  selector: 'page-groupchat',
  templateUrl: 'groupChat.html',
  providers: [UtilMethods, srviceMethodsCall, Keyboard, NativeStorage, SQLite, TranslationService, Camera, Transfer, File, Clipboard, InAppBrowser]
})
export class GroupChatPage {
  @ViewChild(Content) content: Content;
  @ViewChild(Navbar) navbar: Navbar;

  public classnameForFooter = '';
  public groupInfo: any;
  public client: any;
  public subscription: any;
  public textMessage = "";
  public allMessages = [];
  public groupID: any;
  public users = [];
  public userId: any;
  public filterDate: Date;
  public createdDate: Date;
  public max_message_id: any;
  public metaDataCall: any;
  public callFirstTime = true;
  public fromDate: any;
  public createFromDate: any;
  public toDate: any;
  public dateLimitForDb: any;
  public maxDate: any;
  public items = [];
  public members: any;
  public msgCreatedAt: any;
  public showMembers = true;
  public searchStr = "";
  public touchtime = 0;
  public mentionUsers = [];
  public base64Image: any;
  public imageName: any;
  public imageUrl: any;
  public datatopass: any;
  public imgMsgToSend: any;
  public showLoader = true;
  public groupCreatorName: string;
  public file1: any;
  public device_width: number;
  public storeMessages = [];
  public listBottom = true;
  public mentionDate: any;
  public isPrivateChat = false;
  public chanelName = "group";
  public messageType = "group";
  public sendingMsg = false;
  public scrolltobottom = true;
  public showPostButton = false;
  public showOptions = false;
  public cable: any;
  public showNewId: any;
  public imageWidth = 0;
  public highlightReplyMessage = false;
  public highlightReplyMessageId: any;
  public options: any;
  public isKeyboardOpen = false;
  public showSub;
  public hideSub;
  public isPopupOpen = false;
  public socketConnection = true;
  public search_tap = false;
  public startToLeavePage = false;
  public showPreviousSelected = '';
  public showFooterBar = true;
  public scrollTopPos = 0;
  public is_acknowledged = false;
  public allowWO = false;
  public userPermissions: any;
  public showMentions = false;
  public mentionMembers = [];
  public totalMentionUsers = 0;
  public addedUsers = [];
  public actionSheet: any;
  public alert: any;
  public oldMsgTextValue = "";

  constructor(public platform: Platform, public navCtrl: NavController, private keyboard: Keyboard, public zone: NgZone, public navParams: NavParams, public nativeStorage: NativeStorage, private sqlite: SQLite, public alertCtrl: AlertController, public commonMethod: srviceMethodsCall, public translationservice: TranslationService, private viewCtrl: ViewController, private camera: Camera, private transfer: Transfer, private file: File, public actionSheetCtrl: ActionSheetController, private clipboard: Clipboard, public modalCtrl: ModalController, public events: Events, private iab: InAppBrowser, public utilMethods: UtilMethods) {

    /* only for testing */
    this.allowWO = true;
    this.keyboard.disableScroll(false);
    this.userPermissions = {
      "wo_access": {
        "view_listing": false,
        "can_create": false
      }
    };

    this.commonMethod.getUserPermissions().then(
      permissions => {
        this.userPermissions = permissions;
      },
      error => {
        return false;
      }
    );


    this.showLoader = false;
    this.device_width = window.screen.width;
    this.imageWidth = window.screen.width / 100 * 58;
    this.zone.run(() => {
      this.textMessage = "";
    });

    this.getAllSystemUsersFromDb();

    /* For fatch group detail */
    if (this.navParams.get('groupInfo')) {

      this.groupInfo = this.navParams.get('groupInfo');
      this.groupID = this.groupInfo.id;
      this.nativeStorage.setItem('groupInfo', { "groupID": this.groupID });
      var str = this.groupInfo.created_at.split("T");
      this.createdDate = new Date(str[0]);
      //this.createdDate.setDate(this.createdDate.getDate() - 1);
      this.createdDate.setDate(this.createdDate.getDate());
      let dd1 = ("0" + this.createdDate.getDate()).slice(-2);
      let mm1 = ("0" + ((this.createdDate.getMonth()) + 1)).slice(-2); //January is 0!
      let yyyy1 = this.createdDate.getFullYear();
      this.createFromDate = yyyy1 + '-' + mm1 + '-' + dd1;
      this.mentionDate = (typeof this.groupInfo.message_date != "undefined") ? (new Date(this.groupInfo.message_date)) : '';
      this.search_tap = (typeof this.groupInfo.search_tap != "undefined") ? true : false;
      this.is_acknowledged = (typeof this.groupInfo.is_acknowledged != "undefined") ? true : false;
      if (this.groupInfo.message_id == undefined || this.groupInfo.message_id == null) {
        this.groupInfo.message_id = "";
      }
      if (this.groupInfo.private_chat != undefined || this.groupInfo.private_chat != null) {
        this.isPrivateChat = true;
        this.chanelName = "private";
        this.messageType = "private";
      }

      this.sqlite.create({
        name: 'data.db',
        location: 'default'
      }).then((db: SQLiteObject) => {

        let sqlQuery = "";
        if (this.isPrivateChat == true) {
          sqlQuery = "SELECT members.*,user_mentions.total FROM members LEFT JOIN user_mentions on user_mentions.user_id=members.user_id AND type='private' AND type_id='3' WHERE members.user_id IN('" + this.groupInfo.users[0].id + "','" + this.groupInfo.users[1].id + "') ORDER BY user_mentions.total DESC, members.name ASC";
        }
        else {
          sqlQuery = "SELECT members.*,user_mentions.total,chat_group_users.created_at as joined_date FROM members LEFT JOIN user_mentions on user_mentions.user_id=members.user_id AND type='group' AND type_id='2' INNER JOIN chat_group_users ON chat_group_users.user_id=members.user_id WHERE chat_group_users.group_id= '" + this.groupID + "' ORDER BY user_mentions.total DESC, members.name ASC";
        }

        db.executeSql(sqlQuery, {}).then((allMembers) => {
          console.log(sqlQuery);
          console.log("SELECT MEMBERS FROM DB: " + JSON.stringify(allMembers));

          if (allMembers.rows.length > 0) {
            for (let i = 0; i < allMembers.rows.length; i++) {
              let tempUserInfo = {
                "id": allMembers.rows.item(i).user_id,
                "name": allMembers.rows.item(i).name,
                "image": allMembers.rows.item(i).image,
                "joined_date": !this.isPrivateChat ? allMembers.rows.item(i).joined_date : '',
                "show_in_ui": false,
                "is_system_user": allMembers.rows.item(i).is_system_user,
                "total": allMembers.rows.item(i).total
              };
              //   if (allMembers.rows.item(i).user_id != this.groupInfo.owner_id && allMembers.rows.item(i).is_system_user != 1) {
              //     this.totalMentionUsers += 1;
              //   }
              //   if (allMembers.rows.item(i).user_id == this.groupInfo.owner_id) {
              //     this.groupCreatorName = allMembers.rows.item(i).name;
              //   }
              //   this.users.push(tempUserInfo);

              //   if (i == (allMembers.rows.length - 1)) {
              //     this.members = this.users;
              //     this.updateChatData();
              //   }

              if (allMembers.rows.item(i).user_id == this.groupInfo.owner_id) {
                this.groupCreatorName = allMembers.rows.item(i).name;
              }

              if (this.groupInfo.users != undefined && this.groupInfo.users.length > 0) {
                for (let m = 0; m < this.groupInfo.users.length; m++) {
                  if (this.groupInfo.users[m].id == allMembers.rows.item(i).user_id) {

                    if (allMembers.rows.item(i).user_id != this.groupInfo.owner_id && allMembers.rows.item(i).is_system_user != 1) {
                      this.totalMentionUsers += 1;
                    }

                    this.users.push(tempUserInfo);
                  }
                }
              } else {
                if (allMembers.rows.item(i).user_id != this.groupInfo.owner_id && allMembers.rows.item(i).is_system_user != 1) {
                  this.totalMentionUsers += 1;
                }
                this.users.push(tempUserInfo);
              }
              //this.users.push(tempUserInfo);

              if (i == (allMembers.rows.length - 1)) {
                this.members = this.users;
                this.updateChatData();
              }
            }
          }
          else {
            this.members = this.users;
            this.updateChatData();
          }

        }, (error1) => {
          console.log("SELECT MEMBERS ERROR: " + JSON.stringify(error1));
        });
        let sqlQuery1 = "";

        if (this.isPrivateChat == true) {
          sqlQuery1 = "SELECT members.*,user_mentions.total FROM members LEFT JOIN user_mentions on user_mentions.user_id=members.user_id AND type='private' AND type_id='3' WHERE members.user_id IN('" + this.groupInfo.users[0].id + "','" + this.groupInfo.users[1].id + "') ORDER BY user_mentions.total DESC, members.name ASC";

        }
        else {
          sqlQuery1 = "SELECT members.*,user_mentions.total,chat_group_users.created_at as joined_date FROM members LEFT JOIN user_mentions on user_mentions.user_id=members.user_id AND type='group' AND type_id='2' INNER JOIN chat_group_users ON chat_group_users.user_id=members.user_id WHERE chat_group_users.group_id= '" + this.groupID + "' ORDER BY chat_group_users.created_at ASC";
        }

        db.executeSql(sqlQuery1, {}).then((allMembers) => {
          console.log(sqlQuery1);
          console.log("SELECT MEMBERS FROM DB: " + JSON.stringify(allMembers));

          if (allMembers.rows.length > 0) {
            for (let i = 0; i < allMembers.rows.length; i++) {
              let tempUserInfo = {
                "id": allMembers.rows.item(i).user_id,
                "name": allMembers.rows.item(i).name,
                "image": allMembers.rows.item(i).image,
                "joined_date": !this.isPrivateChat ? allMembers.rows.item(i).joined_date : '',
                "show_in_ui": false,
                "is_system_user": allMembers.rows.item(i).is_system_user,
                "total": allMembers.rows.item(i).total
              };
              console.log("lod log 123" + JSON.stringify(tempUserInfo));
              this.addedUsers.push(tempUserInfo);
            }
          }

        }, (error1) => {
          console.log("SELECT MEMBERS ERROR: " + JSON.stringify(error1));
        });
      }).catch(e => console.log(e));
    }

    events.subscribe('notifyChat', (id, ack) => {
      //   this.scrollTo(id);
      this.groupInfo.message_id = id;
      this.groupInfo.highlight_message = true;
      this.is_acknowledged = (ack != "undefined" && ack != undefined) ? true : false;
      console.log(this.is_acknowledged + "acknowledge" + ack);
      for (let i = 0; i < this.allMessages.length; i++) {
        if (this.allMessages[i].message_obj != "undefined" && this.allMessages[i].message_obj != null && this.allMessages[i].message_obj.id == this.groupInfo.message_id && !this.is_acknowledged) {
          this.replyOnMessage(this.groupInfo.message_id, i);
        }
      }
      setTimeout(() => {
        this.groupInfo.highlight_message = false;
      }, 10000);
      setTimeout(() => {
        this.scrollTo(this.groupInfo.message_id);
      }, 500);
    });

  }

  updateChatData() {
    let tempMessage = [];

    this.showSub = this.keyboard.onKeyboardShow().subscribe(data => {

      if (this.isPopupOpen == false) {
        console.log('keyboard is shown');
        this.isKeyboardOpen = true;
        this.keyboard.disableScroll(true);
        this.zone.run(() => {

          let dimensions = this.content.getContentDimensions();
          let scrollTop = this.content.scrollTop;
          let contentHeight = dimensions.contentHeight;
          let scrollHeight = dimensions.scrollHeight;
          console.log("contentHeight= " + contentHeight + "   scrollHeight= " + scrollHeight + " scrollTop= " + scrollTop);
          this.scrollTopPos = scrollTop;
          let totalHeight = parseInt(data.keyboardHeight) + scrollTop;
          this.content.scrollTo(0, totalHeight);

          this.showMembers = true;
          if (data.keyboardHeight > 144) {
            this.classnameForFooter = "openKeyboardWithSpellCheck";
          } else {
            this.classnameForFooter = "openKeyboard";
          }
        });
      }

    });

    this.hideSub = this.keyboard.onKeyboardHide().subscribe(data => {

      if (this.isPopupOpen == false) {
        this.isKeyboardOpen = false;
        this.keyboard.disableScroll(false);
        console.log('keyboard is hiode');
        this.zone.run(() => {
          let totalHeight = this.scrollTopPos;
          this.content.scrollTo(0, totalHeight);
          this.events.publish('hide:keyboard');
          this.classnameForFooter = "closeKeyboard";
        });
      }
    });

    let propertyToken = '';
    let authToken = '';

    setTimeout(() => {
      this.nativeStorage.getItem('user_auth').then(
        accessToken => {

          propertyToken = accessToken.property_token;
          authToken = accessToken.access_token;
          this.userId = accessToken.user_id;

          let clientUrl = webSocketBaseUrl + "cable?property_token=" + propertyToken + "&auth_token=" + authToken + "&chat_id=" + this.groupID;
          this.cable = ActionCable.createConsumer(clientUrl);
          let thisObj = this;

          this.cable.messages = this.cable.subscriptions.create({ channel: 'MessagesChannel', chat_id: this.groupID }, {
            connected: function () { if (thisObj.socketConnection == false) { thisObj.callNewMessages(); } thisObj.socketConnection = true; console.log("cable: connected"); },             // onConnect 
            disconnected: function () { if (thisObj.startToLeavePage == false) { thisObj.socketConnection = false; } console.log("cable: disconnected") },       // onDisconnect
            received: function (data) {
              console.log("message subscriptions =" + JSON.stringify(data)); // or update UI
              thisObj.onSuccess(data);
            }
          });

          for (let i = 0; i < this.members.length; i++) {
            if (this.members[i].id != this.userId) {
              this.items.push(this.members[i]);
            }
          }
          this.mentionMembers = this.items;
          if (!this.showLoader) {
            this.deleteOldMessages();

            this.updateChatDB();
          }
          this.metaDataCall = setInterval(() => {
            this.callReadStatus();
          }, 10000);


        },
        error => {
          return '';
        }
      );

    }, 500);


  }

  callReadStatus() {
    let allIds = [];

    for (let i = 0; i < this.allMessages.length; i++) {
      if (typeof this.allMessages[i].read_count != "undefined" && this.allMessages[i].message_obj != "undefined" && this.allMessages[i].message_obj != null && this.allMessages[i].read_count < this.groupInfo.users.length) {
        allIds.push(this.allMessages[i].message_obj.id);
      }
      else if (typeof this.allMessages[i].read_count === "undefined" && this.allMessages[i].message_obj != null && this.allMessages[i].message_obj != "undefined") {
        allIds.push(this.allMessages[i].message_obj.id);
      }

      if (i == (this.allMessages.length - 1)) {
        if (allIds.length > 0) {

          this.nativeStorage.getItem('user_auth').then(
            accessToken => {
              let queryStr = "";
              for (let j = 0; j < allIds.length; j++) {
                queryStr += "chat_message_ids[]=" + allIds[j];
                if ((allIds.length - 1) > j) {
                  queryStr += "&";
                }
              }

              if (this.commonMethod.checkNetwork()) {

                this.commonMethod.getDataWithoutLoder(metaDataCallUrl + "?" + queryStr, accessToken).subscribe(
                  data => {

                    let res = data.json();

                    for (let i = 0; i < this.allMessages.length; i++) {

                      for (let j = 0; j < res.length; j++) {
                        if (this.allMessages[i].message_obj != "undefined" && this.allMessages[i].message_obj != null && this.allMessages[i].message_obj.id == res[j].id) {
                          this.allMessages[i].read_count = res[j].reads_count;
                        }
                      }

                    }

                  },
                  err => {
                    console.error("Error : " + err);
                  },
                  () => {
                    console.log('getData completed');
                  }
                );

              }

            },
            error => {
              return '';
            }
          );

        }
      }
    }


  }

  sendMessage(image_url, parent_id) {
    let mentionId = [];
    let messageText = this.textMessage.trim();
    messageText = this.utilMethods.nlToBr(messageText);

    if ((this.mentionUsers.length > 0 && image_url == '') || (this.mentionUsers.length > 0 && parent_id == '')) {
      for (let i = 0; i < this.mentionUsers.length; i++) {
        mentionId.push(this.mentionUsers[i].id);
        let mention_user_id = this.mentionUsers[i].id;
        if (this.isPrivateChat == true) {
          this.commonMethod.updateMentionsDb(mention_user_id, 'private', 3);
        }
        else {
          this.commonMethod.updateMentionsDb(mention_user_id, 'group', 2);
        }
      }
    }

    // messageText = this.commonMethod.replaceURLWithHTMLLinks(messageText);

    let objData = { 'chat_message': { message: messageText, chat_id: this.groupID, mentioned_user_ids: mentionId, image_url: image_url, responding_to_chat_message_id: parent_id } };

    this.nativeStorage.getItem('user_auth').then(
      accessToken => {
        if (this.commonMethod.checkNetwork()) {
          this.commonMethod.postDataWithoutLoder(sendMessageUrl, objData, accessToken).subscribe(
            data => {
              console.log(data.json());
            },
            err => {
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

    this.textMessage = "";
    this.showPostButton = false;
    this.mentionUsers = [];
    this.showMembers = true;
    this.events.publish('hide:keyboard');
    this.keyboard.close();

  }
  closekeyboard() {
    this.isKeyboardOpen = false;
    this.classnameForFooter = "closeKeyboard";
    this.events.publish('hide:keyboard');
    this.keyboard.close();
  }
  sendStatus(ids) {
    let objData = {};

    this.nativeStorage.getItem('user_auth').then(
      accessToken => {

        let queryStr = "";
        for (let j = 0; j < ids.length; j++) {
          queryStr += "chat_message_ids[]=" + ids[j];
          if ((ids.length - 1) > j) {
            queryStr += "&";
          }
        }

        if (this.commonMethod.checkNetwork()) {

          this.commonMethod.putDataWithoutLoder(markReadUrl + "?" + queryStr, objData, accessToken).subscribe(
            data => {
              console.log(data.json());
              let res = data.json();

              for (let i = 0; i < this.allMessages.length; i++) {
                for (let j = 0; j < res.length; j++) {
                  if (this.allMessages[i].message_obj != "undefined" && this.allMessages[i].message_obj != null && this.allMessages[i].message_obj.id == res[j].id) {
                    this.allMessages[i].read_status = 3;
                  }
                }
              }

            },
            err => {
              console.error("Error : " + err);
            },
            () => {
              console.log('getData completed');
            }
          );

        }

      },
      error => {
        return '';
      }
    );

  }

  onSuccess(res: any) {

    console.log('Message from server: ' + JSON.stringify(res));

    if (true) {
      let chatUserData = [];
      let readIds = '';

      let woUserDetail = [];
      if (res.work_order == undefined) {
        res.work_order = { "status": "" };
      }
      else {
        for (let i = 0; i < this.users.length; i++) {
          if (this.users[i].id == res.work_order.closed_by_user_id) {
            woUserDetail = this.users[i];
          }
        }
      }
      woUserDetail = woUserDetail;

      for (let i = 0; i < this.users.length; i++) {
        if (this.users[i].id == res.sender_id) {
          chatUserData = this.users[i];
        }
      }
      readIds = res.id;
      let w = window.screen.width / 100 * 58;
      res.message = res.message.replace(/<img /g, "<img style='width:" + w + "px !important; height:" + w + "px !important; max-width:" + w + "px !important; max-height:" + w + "px !important; min-width:" + w + "px !important; min-height:" + w + "px !important; ' ");

      let tempData = {
        "read_status": 1,
        "message_obj": res,
        "dateGroup": res.created_at,
        "userInfo": chatUserData,
        "woUserDetail": woUserDetail,
        "user_added": false
      };
      // if (this.listBottom) {
      this.zone.run(() => {
        this.allMessages.push(tempData);
        this.allMessages = this.allMessages;
      });
      // } else {
      //   this.storeMessages.push(tempData);
      // }
      this.sendStatus([readIds]);
      readIds = '';

      setTimeout(() => {
        if (this.listBottom) {
          this.content.scrollToBottom(300);
        }
      }, 500);

    }

  }

  editGroup(res) {
    res.highlight_message = false;

    this.navCtrl.push(AddEditGroupPage, { groupInfo: res }).then(() => {
      // first we find the index of the current view controller:
      const index = this.viewCtrl.index;
      // then we remove it from the navigation stack
      this.navCtrl.remove(index);
    });

  }

  ionViewWillLeave() {
    console.log("Looks like I'm about to leave :(");
    this.events.publish('hide:keyboard');
    this.closekeyboard();
    this.showFooterBar = false;
    this.startToLeavePage = true;
    this.nativeStorage.setItem('groupInfo', { "groupID": '' });

    if (this.cable == undefined) {
    } else {
      this.cable.disconnect();
    }
    this.socketConnection = true;
    if (this.metaDataCall) {
      clearInterval(this.metaDataCall);
      console.log("clear timeout for metadata");
    }

    if (this.showSub) {
      this.showSub.unsubscribe();
      console.log("show unsubscribe");
    }
    if (this.hideSub) {
      this.hideSub.unsubscribe();
      console.log("hide unsubscribe");
    }

  }

  updateChatDB() {
    this.sqlite.create({
      name: 'data.db',
      location: 'default'
    }).then((db: SQLiteObject) => {

      db.executeSql("SELECT MAX(id) as max_chat_id, created_at FROM chat_messages WHERE target_id= '" + this.groupID + "' AND type='" + this.messageType + "'", {}).then((maxIdData) => {
        console.log("SELECT MAX(id) as max_chat_id, created_at FROM chat_messages WHERE target_id= '" + this.groupID + "' AND type='" + this.messageType + "'" + "    SELECT MAX MESSAGE ID: " + JSON.stringify(maxIdData));

        this.showLoader = true;
        if (maxIdData.rows.length > 0) {
          for (let k = 0; k < maxIdData.rows.length; k++) {
            this.max_message_id = maxIdData.rows.item(k).max_chat_id;
            this.msgCreatedAt = maxIdData.rows.item(k).created_at;
          }
        }
        // if (this.msgCreatedAt && this.callFirstTime == true) {
        //   this.filterDate = new Date(this.msgCreatedAt);
        // } else 
        if (this.callFirstTime == true) {
          this.filterDate = new Date();

        }

        let dd = ("0" + this.filterDate.getDate()).slice(-2);
        let mm = ("0" + ((this.filterDate.getMonth()) + 1)).slice(-2); //January is 0!
        let yyyy = this.filterDate.getFullYear();
        this.toDate = yyyy + '-' + mm + '-' + dd;
        //condition to call first time 7 days and other for one days
        if (this.callFirstTime) {
          this.filterDate.setDate(this.filterDate.getDate() - 7);
        }
        else {
          this.filterDate.setDate(this.filterDate.getDate() - 1);
        }
        /*check for group craete date with data call date*/
        // let filterParsedDate = Date.parse(this.toDate);
        dd = ("0" + this.filterDate.getDate()).slice(-2);
        mm = ("0" + ((this.filterDate.getMonth()) + 1)).slice(-2); //January is 0!
        yyyy = this.filterDate.getFullYear();
        let tempDate = yyyy + '-' + mm + '-' + dd;
        /*check for group craete date with data call date*/
        let filterParsedDate = Date.parse(tempDate);

        let f_date = new Date(this.createFromDate);
        let f_dd = ("0" + f_date.getDate()).slice(-2);
        let f_mm = ("0" + ((f_date.getMonth()) + 1)).slice(-2); //January is 0!
        let f_yyyy = f_date.getFullYear();
        let groupCreateParse = Date.parse(f_yyyy + '-' + f_mm + '-' + f_dd);

        if (filterParsedDate <= groupCreateParse) {
          var str = this.groupInfo.created_at.split("T");

          this.filterDate = new Date(str[0]);
        }
        console.log(this.filterDate + " filter date " + this.groupInfo.created_at);
        // this.converToLocalTime(this.groupInfo.created_at);
        dd = ("0" + this.filterDate.getDate()).slice(-2);
        mm = ("0" + ((this.filterDate.getMonth()) + 1)).slice(-2); //January is 0!
        yyyy = this.filterDate.getFullYear();
        this.fromDate = yyyy + '-' + mm + '-' + dd;
        /*===check for group craete date with data call date*/

        /*check of api call */
        let apiUrl = getChatsUrl + '/' + this.groupID + '/messages';
        if (this.callFirstTime && this.mentionDate != "") {
          this.filterDate = this.mentionDate;
          if (filterParsedDate < groupCreateParse) {
            var str = this.groupInfo.created_at.split("T");

            this.filterDate = new Date(str[0]);
            // this.filterDate.setDate(this.filterDate.getDate() - 1);
          }
          let cur_date = new Date();
          let dd1 = ("0" + this.filterDate.getDate()).slice(-2);
          let mm1 = ("0" + ((this.filterDate.getMonth()) + 1)).slice(-2); //January is 0!
          let yyyy1 = this.filterDate.getFullYear();
          let dd = ("0" + cur_date.getDate()).slice(-2);
          let mm = ("0" + ((cur_date.getMonth()) + 1)).slice(-2); //January is 0!
          let yyyy = cur_date.getFullYear();
          this.toDate = yyyy + '-' + mm + '-' + dd;
          this.fromDate = yyyy1 + '-' + mm1 + '-' + dd1;
          apiUrl += "?start_date=" + this.fromDate + "&end_date=" + this.toDate;
        }
        else if (this.max_message_id != null && this.callFirstTime == true) {
          apiUrl += "?message_id=" + this.max_message_id;
        }
        else {
          if (!this.callFirstTime == true) {
            apiUrl += "?start_date=" + this.fromDate + "&end_date=" + this.fromDate;
          } else {
            apiUrl += "?start_date=" + this.fromDate + "&end_date=" + this.toDate;
          }

        }
        console.log(apiUrl + "  apiurl");
        /*check of api call */
        this.callMessageApi(apiUrl);



      }, (error1) => {
        console.log("SELECT MAX MESSAGE ERROR: " + JSON.stringify(error1));
      });
    }).catch(e => console.log(e));
  }


  callMessageApi(apiUrl) {
    let alertVar = this.alertCtrl.create({
      title: 'Error!',
      subTitle: 'Invalid Details!',
      buttons: ['OK']
    });
    /* call pai start */
    this.nativeStorage.getItem('user_auth').then(
      accessToken => {

        if (this.commonMethod.checkNetwork()) {

          this.commonMethod.getDataWithoutLoder(apiUrl, accessToken).subscribe(
            data => {
              console.log(data.json());
              let allData = data.json();
              this.sqlite.create({
                name: 'data.db',
                location: 'default'
              }).then((db: SQLiteObject) => {

                if (allData.length == 0 && this.callFirstTime) {
                  this.getMessagesFromLocalDb();
                }
                else {
                  let obj = allData;

                  for (let i = obj.length - 1; i >= 0; i--) {
                    db.executeSql("SELECT * FROM chat_messages WHERE id='" + obj[i].id + "'", {}).then((oldData) => {

                      console.log("SELECT MESSAGE DATA: " + JSON.stringify(oldData));

                      if (oldData.rows.length <= 0) {

                        let woStatus = (obj[i].work_order != null && obj[i].work_order != 'null') ? obj[i].work_order.status : '';
                        //let woStatus= (obj[i].work_order!=null && obj[i].work_order!='null')?obj[i].work_order.status:'';
                        let workOrderClosedByUserId = (obj[i].work_order != null && obj[i].work_order != 'null') ? (obj[i].work_order.closed_by_user_id > 0 ? obj[i].work_order.closed_by_user_id : 0) : 0;
                        let workOrderClosedAt = (obj[i].work_order != null && obj[i].work_order != 'null') ? obj[i].work_order.created_at : '';
                        let workOrderLocationDetail = (obj[i].work_order != null && obj[i].work_order != 'null' && obj[i].work_order.location_detail != undefined) ? obj[i].work_order.location_detail.replace(/'/g, "&#39;") : '';
                        let workOrderDescription = (obj[i].work_order != null && obj[i].work_order != 'null') ? obj[i].work_order.description.replace(/'/g, "&#39;") : '';

                        let emptyText = "";
                        let queryStrt = "";
                        queryStrt = "INSERT INTO chat_messages (id, sender_id, hotel_token, message, image, target_id, type, deleted_at, created_at, updated_at, read_status, mentioned_user_ids, parent_id, work_order_id, work_order_url, work_order_status, work_order_closed_by_user_id, work_order_closed_at, work_order_location_detail, work_order_description,room_number,room_id) VALUES ('";
                        queryStrt += obj[i].id + "','" + obj[i].sender_id + "','','";
                        queryStrt += obj[i].message.replace(/'/g, "&#39;") + "','";
                        queryStrt += (obj[i].image_url && obj[i].image_url != null && obj[i].image_url != 'null') ? obj[i].image_url : emptyText;
                        queryStrt += "','" + this.groupID + "','" + this.messageType + "','','" + obj[i].created_at + "','','" + obj[i].read;
                        queryStrt += "','" + obj[i].mentioned_user_ids.toString() + "','" + obj[i].responding_to_chat_message_id + "','" + obj[i].work_order_id + "','" + obj[i].work_order_url + "','" + woStatus + "'," + workOrderClosedByUserId + ",'" + workOrderClosedAt + "','" + workOrderLocationDetail + "','" + workOrderDescription + "','" + obj[i].room_number + "','" + obj[i].room_id + "')";
                        //console.log("=="+queryStrt);
                        db.executeSql(queryStrt, {}).then((data1) => {
                          console.log("MESSAGE INSERTED: " + JSON.stringify(data1));
                          if (((this.max_message_id != null && this.callFirstTime) || (this.max_message_id == null)) && (this.showNewId == null || this.showNewId == undefined)) {
                            this.showNewId = obj[i].id;
                          }
                          if (i == 0) {
                            this.getMessagesFromLocalDb();
                          }
                        }, (error1) => {
                          console.log("MESSAGE INSERT ERROR: " + JSON.stringify(error1));
                        });
                      }
                      else {
                        console.log("MESSAGE Exist id= : " + obj[i].id);
                        if (i == 0) {
                          this.getMessagesFromLocalDb();
                        }
                      }

                    }, (error1) => {
                      console.log("SELECT MESSAGE ERROR: " + JSON.stringify(error1));
                    });
                  }
                }
                if (allData.length == 0) {
                  let mBoolean = true;
                  let dateGroup;
                  for (let j = this.addedUsers.length - 1; j >= 0; j--) {
                    let user_date1 = new Date(this.addedUsers[j].joined_date);
                    //user_date1.setDate(user_date1.getDate() - 1);
                    user_date1.setDate(user_date1.getDate());
                    let dd = ("0" + user_date1.getDate()).slice(-2);
                    let mm = ("0" + ((user_date1.getMonth()) + 1)).slice(-2); //January is 0!
                    let yyyy = user_date1.getFullYear();
                    let user_join_date = yyyy + '-' + mm + '-' + dd;
                    let userParseDate = Date.parse(user_join_date);
                    let toparseDate = Date.parse(this.toDate);
                    let fromParseDate = Date.parse(this.fromDate);

                    if (userParseDate >= fromParseDate && userParseDate <= toparseDate && this.addedUsers[j].show_in_ui == false) {
                      this.addedUsers[j].show_in_ui = true;
                      dateGroup = this.addedUsers[j].joined_date;
                      console.log("A4 =");
                      let tempData = {
                        "read_status": undefined,
                        "user_added": true,
                        "dateGroup": dateGroup,
                        "user_name": this.addedUsers[j].name,
                        "user_id": this.addedUsers[j].id
                      };
                      this.allMessages.unshift(tempData);
                    }
                  }
                }
                this.showLoader = false;
              }).catch(e => console.log(e));

            },
            err => {
              this.filterDate.setDate(this.filterDate.getDate() + 1);
              alertVar.present();
              console.error("Error : " + err);
            },
            () => {
              console.log('getData completed');
            }
          );

        }
        else {
          this.filterDate.setDate(this.filterDate.getDate() + 1);

          this.commonMethod.showNetworkError();
        }

      },
      error => {
        return '';
      }
    );
  }

  deleteOldMessages() {
    this.sqlite.create({
      name: 'data.db',
      location: 'default'
    }).then((db: SQLiteObject) => {

      this.dateLimitForDb = new Date();

      this.dateLimitForDb.setDate(this.dateLimitForDb.getDate() - 7);

      let dd1 = ("0" + this.dateLimitForDb.getDate()).slice(-2);
      let mm1 = ("0" + ((this.dateLimitForDb.getMonth()) + 1)).slice(-2); //January is 0!
      let yyyy1 = this.dateLimitForDb.getFullYear();
      this.maxDate = yyyy1 + '-' + mm1 + '-' + dd1;
      db.executeSql("DELETE FROM chat_messages WHERE target_id= '" + this.groupID + "' AND type='" + this.messageType + "' AND created_at<='" + this.maxDate + "'", {}).then((data1) => {
        console.log("DELETE GROUP MESSAGES : " + JSON.stringify(data1));
        console.log("DELETE FROM chat_messages WHERE target_id= '" + this.groupID + "' AND type='" + this.messageType + "' AND created_at<='" + this.maxDate + "'");
      }, (error1) => {
        console.log("DELETE GROUP MESSAGES ERROR: " + JSON.stringify(error1));
      });
    }).catch(e => console.log(e));
  }




  getMessagesFromLocalDb() {
    this.sqlite.create({
      name: 'data.db',
      location: 'default'
    }).then((db: SQLiteObject) => {

      let selectChatQuery = "";

      if (this.callFirstTime) {
        selectChatQuery = "SELECT * FROM chat_messages WHERE target_id= '" + this.groupID + "' AND type='" + this.messageType + "' ORDER BY created_at DESC";
      } else {
        selectChatQuery = "SELECT * FROM chat_messages WHERE target_id= '" + this.groupID + "' AND type='" + this.messageType + "' AND date(substr(created_at, 1, 10))<= date('" + this.fromDate + "') AND date(substr(created_at, 1, 10)) >= date('" + this.fromDate + "') ORDER BY created_at DESC";
      }
      db.executeSql(selectChatQuery, {}).then((allGroupMessages) => {
        console.log("selectChatQuery" + selectChatQuery);
        console.log("udata=" + JSON.stringify(allGroupMessages));
        //return last message on 0th position
        let firstMessageDat = "";
        if (allGroupMessages.rows.length > 0) {
          console.log("date_range" + this.toDate + "--" + this.fromDate);
          let lastmessageDate = new Date(allGroupMessages.rows.item(allGroupMessages.rows.length - 1).created_at);

          if (this.callFirstTime && this.filterDate.getTime() > lastmessageDate.getTime()) {
            this.filterDate.setDate(lastmessageDate.getDate() - 1);
          }
          for (let i = 0; i < allGroupMessages.rows.length; i++) {
            let messageDate = new Date(allGroupMessages.rows.item(i).created_at);
            let chatUserData = [];
            if (firstMessageDat != "") {
              firstMessageDat = allGroupMessages.rows.item(i).created_at;
            }

            for (let j = this.addedUsers.length - 1; j >= 0; j--) {
              console.log("lod log" + allGroupMessages.rows.item(i).sender_id + "   " + this.addedUsers[j].id);
              if (this.addedUsers[j].id == allGroupMessages.rows.item(i).sender_id) {
                chatUserData = this.addedUsers[j];
                console.log("lod log" + JSON.stringify(this.addedUsers[j]));

              }
              //if (this.addedUsers[j].id == allGroupMessages.rows.item(i).sender_id) {
              if (this.addedUsers[j].is_system_user != 1) {
                let joinedParseDate = Date.parse(this.addedUsers[j].joined_date);
                let messageDateParse = Date.parse(allGroupMessages.rows.item(i).created_at);
                let toparseDate = Date.parse(this.toDate);
                let fromParseDate = Date.parse(this.fromDate);

                let user_date1 = new Date(this.addedUsers[j].joined_date);
                user_date1.setDate(user_date1.getDate() - 1);
                let dd = ("0" + user_date1.getDate()).slice(-2);
                let mm = ("0" + ((user_date1.getMonth()) + 1)).slice(-2); //January is 0!
                let yyyy = user_date1.getFullYear();
                let user_join_date = yyyy + '-' + mm + '-' + dd;
                let userParseDate = Date.parse(user_join_date);
                console.log("11==" + this.addedUsers[j].id + " :-" + userParseDate + "-" + fromParseDate + "-" + userParseDate + "-" + toparseDate);
                // 1506384000000-1512000000000-1506384000000-1512086400000
                console.log("this.addedUsers[j].joined_date=" + this.addedUsers[j].joined_date + " allGroupMessages.rows.item(i).created_at" + allGroupMessages.rows.item(i).created_at);

                console.log("messageDateParse=" + messageDateParse + " joinedParseDate" + joinedParseDate + " show_in_ui" + this.addedUsers[j].show_in_ui);
                //messageDateParse=1512044927374 joinedParseDate 1506524616647 show_in_uifalse
                if (((messageDateParse >= joinedParseDate && this.addedUsers[j].show_in_ui == false) || (messageDateParse <= joinedParseDate && this.addedUsers[j].show_in_ui == false && allGroupMessages.rows.length == (i + 1))) && fromParseDate <= joinedParseDate) {
                  console.log("uu=" + this.addedUsers[j].id);
                  console.log("A1 =");
                  this.addedUsers[j].show_in_ui = true;
                  let dateGroup;
                  dateGroup = this.addedUsers[j].joined_date;
                  let tempData = {
                    "read_status": undefined,
                    "user_added": true,
                    "dateGroup": dateGroup,
                    "user_name": this.addedUsers[j].name,
                    "user_id": this.addedUsers[j].id
                  };
                  console.log("1111111");
                  this.allMessages.unshift(tempData);
                }
                //}
              }
            }
            let dateGroup = "";
            console.log("lod log" + JSON.stringify(chatUserData));
            dateGroup = allGroupMessages.rows.item(i).created_at;
            let w = this.device_width / 100 * 58;

            allGroupMessages.rows.item(i).message = allGroupMessages.rows.item(i).message.replace(/&#39;/g, "'").replace(/<img /g, "<img style='width:" + w + "px !important; height:" + w + "px !important; max-width:" + w + "px !important; max-height:" + w + "px !important; min-width:" + w + "px !important; min-height:" + w + "px !important; ' ")
            let msgObj = {
              "message": allGroupMessages.rows.item(i).message,
              "image_url": allGroupMessages.rows.item(i).image,
              "action": "create",
              "id": allGroupMessages.rows.item(i).id,
              "sender_id": allGroupMessages.rows.item(i).sender_id,
              "created_at": allGroupMessages.rows.item(i).created_at,
              "mentioned_user_ids": (allGroupMessages.rows.item(i).mentioned_user_ids != '') ? allGroupMessages.rows.item(i).mentioned_user_ids.split(',') : '',
              "responding_to_chat_message_id": allGroupMessages.rows.item(i).parent_id,
              "work_order_id": allGroupMessages.rows.item(i).work_order_id,
              "work_order_url": allGroupMessages.rows.item(i).work_order_url,
              "work_order": {
                "status": allGroupMessages.rows.item(i).work_order_status,
                "closed_by_user_id": allGroupMessages.rows.item(i).work_order_closed_by_user_id,
                "closed_at": allGroupMessages.rows.item(i).work_order_closed_at,
                "location_detail": allGroupMessages.rows.item(i).work_order_location_detail,
                "description": allGroupMessages.rows.item(i).work_order_description
              },
              "room_number": allGroupMessages.rows.item(i).room_number,
              "room_id": allGroupMessages.rows.item(i).room_id
            }

            console.log("showNewId  " + this.showNewId);

            if (allGroupMessages.rows.item(i).sender_id == this.userId && this.showNewId != null && this.showNewId <= allGroupMessages.rows.item(i).id) {
              if (i > 0) {
                this.showNewId = allGroupMessages.rows.item(i - 1).id;
              } else {
                this.showNewId = null;
              }
              console.log("showNewId  " + this.showNewId);
            }

            let woUserDetail = [];
            if (msgObj.work_order.closed_by_user_id > 0) {
              for (let i = 0; i < this.users.length; i++) {
                if (this.users[i].id == msgObj.work_order.closed_by_user_id) {
                  woUserDetail = this.users[i];
                }
              }
            }
            woUserDetail = woUserDetail;
            console.log("userInfo lod log 1" + chatUserData);
            let readStatus = allGroupMessages.rows.item(i).read_status ? 3 : 1;
            let tempData = {
              "read_status": readStatus,
              "message_obj": msgObj,
              "dateGroup": dateGroup,
              "userInfo": chatUserData,
              "woUserDetail": woUserDetail,
              "user_added": false
            };
            this.allMessages.unshift(tempData);

          }



          if (allGroupMessages.rows.length > 0) {


            for (let i = 0; i < allGroupMessages.rows.length; i++) {


              for (let j = this.addedUsers.length - 1; j >= 0; j--) {

                let joinedParseDate = Date.parse(this.addedUsers[j].joined_date);
                let messageDateParse = Date.parse(allGroupMessages.rows.item(i).created_at);

                if (i == 0 && messageDateParse > joinedParseDate && this.addedUsers[j].show_in_ui == false) {
                  console.log("date_range" + this.toDate + "--" + this.fromDate);

                  let tempRange = new Date(allGroupMessages.rows.item(i).created_at);
                  let dd = ("0" + tempRange.getDate()).slice(-2);
                  let mm = ("0" + ((tempRange.getMonth()) + 1)).slice(-2); //January is 0!
                  let yyyy = tempRange.getFullYear();
                  let tempRange_date = yyyy + '-' + mm + '-' + dd;

                  //let checkOldDateRange1 = new Date(this.toDate);
                  //let checkOldDateRange2 = new Date(this.fromDate);
                  //let checkOldDateRange3 = new Date(tempRange_date);

                  let toparseDate = Date.parse(this.toDate);
                  let fromParseDate = Date.parse(this.fromDate);

                  let user_date1 = new Date(this.addedUsers[j].joined_date);
                  user_date1.setDate(user_date1.getDate() - 1);
                  let dd1 = ("0" + user_date1.getDate()).slice(-2);
                  let mm1 = ("0" + ((user_date1.getMonth()) + 1)).slice(-2); //January is 0!
                  let yyyy1 = user_date1.getFullYear();
                  let user_join_date = yyyy1 + '-' + mm1 + '-' + dd1;
                  let userParseDate = Date.parse(user_join_date);
                  //console.log("11=="+this.addedUsers[j].id+" :-"+userParseDate+"-"+fromParseDate+"-"+userParseDate+"-"+toparseDate);
                  if (userParseDate <= toparseDate && userParseDate >= fromParseDate) {
                    //if (checkOldDateRange3 <= checkOldDateRange1 && checkOldDateRange3 >= checkOldDateRange2) {
                    console.log("uu1=" + this.addedUsers[j].id);
                    this.addedUsers[j].show_in_ui = true;
                    let dateGroup;
                    dateGroup = this.addedUsers[j].joined_date;
                    let tempData = {
                      "read_status": undefined,
                      "user_added": true,
                      "dateGroup": dateGroup,
                      "user_name": this.addedUsers[j].name,
                      "user_id": this.addedUsers[j].id
                    };
                    console.log("22222222");
                    this.allMessages.unshift(tempData);
                  }
                  console.log("con=" + messageDateParse + "<" + joinedParseDate);
                }
              }

            }
          }

          this.allMessages = this.sortByKey(this.allMessages, 'dateGroup');



          // console.log("hhhhh" + JSON.stringify(this.allMessages));
          setTimeout(() => {
            this.markReadMessages();
            this.zone.run(() => {
              this.showLoader = false;
              this.allMessages = this.allMessages;
              this.scrollDown();
            });

            this.callReadStatus();
          }, 500);

        } else {

          this.showLoader = false;

          this.callReadStatus();
          let dateGroup;

          let adminArray;
          for (let j = this.addedUsers.length - 1; j >= 0; j--) {
            console.log("6666666666" + this.addedUsers[j].joined_date + "  " + this.addedUsers[j].name);

            let user_date1 = new Date(this.addedUsers[j].joined_date);
            //user_date1.setDate(user_date1.getDate() - 1);
            let dd = ("0" + user_date1.getDate()).slice(-2);
            let mm = ("0" + ((user_date1.getMonth()) + 1)).slice(-2); //January is 0!
            let yyyy = user_date1.getFullYear();
            let user_join_date = yyyy + '-' + mm + '-' + dd;


            if (this.fromDate == user_join_date && this.addedUsers[j].show_in_ui == false) {
              dateGroup = this.addedUsers[j].joined_date;
              this.addedUsers[j].show_in_ui = true;
              let tempData = {
                "read_status": undefined,
                "user_added": true,
                "dateGroup": dateGroup,
                "user_name": this.addedUsers[j].name,
                "user_id": this.addedUsers[j].id
              };

              if (parseInt(this.userId) == parseInt(this.addedUsers[j].id)) {
                adminArray = tempData;
              }
              else {
                console.log("444444444");
                this.allMessages.unshift(tempData);
              }
            }
          }
          console.log("333333");

          if (adminArray) {
            console.log("5555555");

            this.allMessages.unshift(adminArray);
          }
          console.log(JSON.stringify(this.allMessages));
        }
      }, (error1) => {
        console.log("SELECT GROUP MESSAGES ERROR: " + JSON.stringify(error1));
      });

    }).catch(e => console.log(e));
  }


  markReadMessages() {
    this.sqlite.create({
      name: 'data.db',
      location: 'default'
    }).then((db: SQLiteObject) => {

      db.executeSql("SELECT * FROM chat_messages WHERE target_id= '" + this.groupID + "' AND type='" + this.messageType + "' AND read_status='false' ORDER BY created_at ASC", {}).then((allGroupReadMessages) => {
        console.log("SELECT GROUP MESSAGES TO MARK READ: " + JSON.stringify(allGroupReadMessages));

        if (allGroupReadMessages.rows.length > 0) {
          let ids = [];
          for (let i = 0; i < allGroupReadMessages.rows.length; i++) {
            ids.push(allGroupReadMessages.rows.item(i).id);
          }

          this.sendStatus(ids);

          db.executeSql("UPDATE chat_messages SET read_status='true' WHERE id IN (" + ids.join(',') + ")", {}).then((data1) => {
            console.log("MESSAGE MARK READ IN DB: " + JSON.stringify(data1));
          }, (error1) => {
            console.log("MESSAGE MARK READ IN DB: " + JSON.stringify(error1));
          });

        }
      }, (error1) => {
        console.log("SELECT GROUP MESSAGES TO MARK READ ERROR: " + JSON.stringify(error1));
      });

    }).catch(e => console.log(e));

  }

  doRefresh(refresher) {
    this.closekeyboard();
    if (!this.showLoader) {
      this.callFirstTime = false;
      this.updateChatDB();
    }
    refresher.complete();
  }

  updateDateMap(index) {
    let showDate = '';
    if (index > 0) {
      let d1 = ("0" + this.allMessages[index].message_obj.created_at.getDate()).slice(-2);
      let m1 = ("0" + ((this.allMessages[index].message_obj.created_at.getMonth()) + 1)).slice(-2); //January is 0!
      let y1 = this.allMessages[index].message_obj.created_at.getFullYear();
      let date1 = y1 + '-' + m1 + '-' + d1;

      let d2 = ("0" + this.allMessages[index - 1].message_obj.created_at.getDate()).slice(-2);
      let m2 = ("0" + ((this.allMessages[index - 1].message_obj.created_at.getMonth()) + 1)).slice(-2); //January is 0!
      let y2 = this.allMessages[index - 1].message_obj.created_at.getFullYear();
      let date2 = y2 + '-' + m2 + '-' + d2;

      if (date1 != date2) {
        return this.allMessages[index].message_obj.created_at;
      }
    }
    return showDate;
  }

  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  removeLastInstance(badtext, str) {
    var charpos = str.toLowerCase().lastIndexOf(badtext.toLowerCase());
    if (charpos < 0) return str;
    let ptone = str.substring(0, charpos);
    let pttwo = str.substring(charpos + (badtext.length));
    return (ptone + pttwo);
  }

  selectUser(e, memberInfo, add) {
    let mentionAdded = true;
    if (this.showMentions == true && this.textMessage != "") {
      let strArray = this.textMessage.trim().split(" ");
      // Display array values on page
      for (var i = 0; i < strArray.length; i++) {
        if (strArray[i].charAt(0) == "@" && strArray.length == (i + 1)) {
          this.zone.run(() => {
            this.textMessage = this.removeLastInstance(strArray[i], this.textMessage);
            /* this is only for android */
            if (this.textMessage.trim() == "") {
              this.textMessage = this.textMessage.trim();
            }
            this.textMessage = this.textMessage + "@" + memberInfo.name + " ";
            this.mentionMembers = this.items;
            this.textMessage = this.textMessage;
            mentionAdded = false;
          });
        }
      }
    }
    if (this.mentionUsers.length > 0) {
      // alert("a");
      let insertFlag = true;
      for (let i = 0; i < this.mentionUsers.length; i++) {
        if (this.mentionUsers[i].id == memberInfo.id && add != true) {
          // alert("1");

          let removeStr = "@" + this.mentionUsers[i].name + " ";
          console.log(this.textMessage + "  " + this.mentionUsers[i].name + " removeStr" + removeStr);

          this.zone.run(() => {
            console.log(this.textMessage + "  " + this.mentionUsers[i].name + " removeStr" + removeStr);
            //this.textMessage = this.textMessage.replace(removeStr,'');      
            this.textMessage = this.textMessage.replace(new RegExp(this.escapeRegExp(removeStr), 'g'), '');

          });
          insertFlag = false;
          this.mentionUsers.splice(i, 1);
        }
        else if (this.mentionUsers[i].id == memberInfo.id) {
          insertFlag = false;
        }

      }
      if (insertFlag == true) {
        this.mentionUsers.push(memberInfo);
        if (mentionAdded) {
          this.zone.run(() => {
            this.textMessage = this.textMessage + "@" + memberInfo.name + " ";
          });

        }
      }
    }
    else {
      this.mentionUsers.push(memberInfo);
      if (mentionAdded) {
        this.zone.run(() => {
          this.textMessage = this.textMessage + "@" + memberInfo.name + " ";
        });

      }
    }

    // if( this.showMentions==true && this.textMessage!="" )
    // {
    //     let strArray = this.textMessage.split(" ");
    //     // Display array values on page
    //     for(var i = 0; i < strArray.length; i++){
    //       if(strArray[i].charAt(0)=="@"){
    //         //this.zone.run(() => {
    //           this.textMessage=this.textMessage.replace(strArray[i],"");
    //         //});
    //       }
    //     }
    // }
    this.showMentions = false;
    if (e != undefined) {
      e.preventDefault();
    }
    //e.stopPropagation();
  }


  translate(sourceText, langCode, index, mentioned_user_ids) {
    let allChatMentions = [];
    if (mentioned_user_ids != '' && mentioned_user_ids != null) {
      allChatMentions = mentioned_user_ids;
    }

    sourceText = sourceText.replace(/\n/g, "<br/>");
    // let sourceText2 = this.commonMethod.removeMentionsFromName(allChatMentions, this.members, sourceText);
    // sourceText=sourceText2;

    // let firstPos = sourceText.indexOf("<span");
    // let lastPos = sourceText.indexOf("</span>");
    let tempStr = "";
    // if (firstPos == 0) {
    //   tempStr = sourceText.substring(firstPos, lastPos + 7);
    //   sourceText = sourceText.substring(lastPos + 7);
    // }

    if (this.touchtime == 0) {
      this.touchtime = new Date().getTime();
    } else {
      if (((new Date().getTime()) - this.touchtime) < 400) {

        this.touchtime = 0;


        if (this.allMessages[index].message_obj.temp_data != undefined && this.allMessages[index].message_obj.temp_data != "") {
          this.allMessages[index].message_obj.message = this.allMessages[index].message_obj.temp_data;
          this.allMessages[index].message_obj.temp_data = "";
        }
        else {
          this.commonMethod.showLoader();

          this.translationservice.translateText(sourceText, langCode).subscribe(data => {

            if (data.detectedSourceLanguage == "en") {
              this.allMessages[index].message_obj.temp_data = this.allMessages[index].message_obj.message;
              this.allMessages[index].message_obj.message = tempStr + data.translatedText;
              this.commonMethod.hideLoader();
            }
            else {
              this.translationservice.translateText(sourceText, 'en').subscribe(data => {

                this.allMessages[index].message_obj.temp_data = this.allMessages[index].message_obj.message;
                this.allMessages[index].message_obj.message = tempStr + data.translatedText;
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

  updateName(sourceText) {
    return sourceText = sourceText.replace(/ /g, "<small style='color:#fff;'>.</small>");
  }

  showSelected(id) {
    let className = false;
    for (let i = 0; i < this.mentionUsers.length; i++) {
      if (this.mentionUsers[i].id == id) {
        className = true;
      }
    }
    return className;
  }

  updateHtml(val, mentioned_user_ids) {

    let allChatMentions = [];
    if (mentioned_user_ids != '' && mentioned_user_ids != null) {
      allChatMentions = mentioned_user_ids;
    }

    // let mentionStr = this.commonMethod.getMentionString(allChatMentions, this.users);
    // if (mentionStr != "") {
    //   mentionStr = mentionStr;
    //   // val = mentionStr + val;
    // }

    let newValue = this.commonMethod.getTextValue(allChatMentions, this.users, val);
    if (newValue != "") {
      val = newValue;
    }
    return val.replace(/text-decoration-line/g, "text-decoration");
  }



  accessGallery() {
    this.camera.getPicture({
      quality: 100
      , destinationType: this.camera.DestinationType.FILE_URI
      , sourceType: this.camera.PictureSourceType.PHOTOLIBRARY
      , encodingType: this.camera.EncodingType.JPEG
      , mediaType: this.camera.MediaType.PICTURE
      , targetWidth: 800 //what widht you want after capaturing
      , targetHeight: 800
    }).then((imageData) => {
      imageData = imageData.substring(0, imageData.indexOf('?'));
      this.sendImage(imageData);
    }, (err) => {
      console.log(err);
      this.isPopupOpen = false;
    });
  }

  sendImage(imageData) {

    this.keyboard.disableScroll(true);
    let w;
    if (window.screen.width < window.screen.height) {
      w = window.screen.width / 100 * 90;
    } else {
      w = window.screen.height / 100 * 90;
    }
    let thisObj = this;
    this.alert = this.alertCtrl.create({
      title: 'Message',
      message: '<img onmousedown="$event.preventDefault();"  width="' + w + 'px" height="' + (w - 125) + 'px" src="' + imageData + '"/>',
      cssClass: 'image_upload_alert',
      inputs: [
        {
          name: 'message',
          placeholder: 'Enter you message',
          type: 'text'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: data => {
            console.log('Cancel clicked');
            this.isPopupOpen = false;
            this.keyboard.disableScroll(false);
          }
        },
        {
          text: 'Send',
          handler: data => {
            if (data.message.trim()) {
              this.alert.dismiss();
              console.log(data.message.trim());
              this.isPopupOpen = false;
              this.keyboard.disableScroll(false);
              this.uploadImageOnAws(data.message.trim(), this.groupID, this.client, imageData);
              // logged in!
            } else {
              // invalid login
              let alertVar = this.alertCtrl.create({
                //title: 'Error!',
                subTitle: 'Message is required',
                buttons: ['OK']
              });
              alertVar.present();
              return false;
            }
          }
        }
      ]
    });
    this.alert.present();
  }

  openCamera() {
    const options: CameraOptions = {
      quality: 100
      , destinationType: this.camera.DestinationType.FILE_URI
      , sourceType: this.camera.PictureSourceType.CAMERA
      , encodingType: this.camera.EncodingType.JPEG
      , mediaType: this.camera.MediaType.PICTURE
      , targetWidth: 800 //what widht you want after capaturing
      , targetHeight: 800
    };

    this.camera.getPicture(options).then((imageData) => {
      // imageData is either a base64 encoded string or a file URI
      // If it's base64:
      //this.base64Image = 'data:image/jpeg;base64,' + imageData;
      this.sendImage(imageData);
    }, (err) => {
      // Handle error
      this.isPopupOpen = false;
    });

  }

  uploadImageOnAws(msg, groupID, client, imageData) {
    let commonMethod = this.commonMethod;
    let transfer = this.transfer;
    this.base64Image = imageData;
    let time = new Date().getTime();
    var imageName = this.userId + "_" + time + "_" + imageData.substr(imageData.lastIndexOf('/') + 1);

    let thisObj = this;


    let alertVar = this.alertCtrl.create({
      title: 'Error!',
      subTitle: 'Invalid Details!',
      buttons: ['OK']
    });

    let queryStr = "?objectName=" + imageName + "&contentType=image/jpeg&uploadType=photo";
    this.nativeStorage.getItem('user_auth').then(
      accessToken => {

        if (this.commonMethod.checkNetwork()) {

          commonMethod.showLoader();
          this.commonMethod.getDataWithoutLoder(getAwsSignedUrl + queryStr, accessToken).subscribe(
            data => {
              //this.foundRepos = data.json();
              let foundRepos = data.json();
              console.log(foundRepos);
              let url = foundRepos.signedUrl;
              let s3FileUrl = foundRepos.s3FileUrl;

              const fileTransfer: TransferObject = transfer.create();
              let options: FileUploadOptions = {
                fileKey: 'file',
                fileName: imageName,
                mimeType: "image/jpeg",
                httpMethod: 'PUT',
                chunkedMode: false,
                headers: { 'Content-Type': 'image/jpeg' }
              };
              var params = {
                key: "Connect-GroupChat-Images/" + imageName,
                "acl": "public-read",
                "region": 'us-east-2'
              };
              options.params = params;
              console.log(JSON.stringify(options));
              fileTransfer.upload(imageData, url, options).then((data) => {
                // success
                console.log("tt1" + JSON.stringify(data));
                console.log(s3FileUrl);
                commonMethod.hideLoader();

                thisObj.textMessage = msg;
                thisObj.sendMessage(s3FileUrl, '');

              }, (err) => {
                // error
                console.log("tt=" + JSON.stringify(err));
                commonMethod.hideLoader();
              });


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


  }
  ionViewDidEnter() {
    this.content.ionScrollEnd.subscribe((data) => {

      let dimensions = this.content.getContentDimensions();

      let scrollTop = this.content.scrollTop;
      let contentHeight = dimensions.contentHeight;
      let scrollHeight = dimensions.scrollHeight;
      console.log("contentHeight" + contentHeight + "   scroll h " + scrollHeight + " scrollTop " + scrollTop);
      if ((scrollTop + contentHeight + 100) >= scrollHeight) {
        this.listBottom = true;
        // if (this.storeMessages.length > 0) {
        //   for (let i = 0; i < this.storeMessages.length; i++) {
        //     this.zone.run(() => {
        //       this.allMessages.push(this.storeMessages[i]);
        //       this.allMessages = this.allMessages;
        //     });
        //   }
        //   this.storeMessages = [];
        //   this.content.scrollToBottom(300);

        // }
      } else {
        this.listBottom = false;
      }

    });
    this.platform.ready().then(() => {
      this.platform.registerBackButtonAction(() => {

      }, 100);
    });

    this.navbar.backButtonClick = (e: UIEvent) => {
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
                // if (pageDetail.index) {
                //   if(pageDetail.index!=-1){
                //   this.navCtrl.popTo(pageDetail.index);
                //   }else{
                //     this.navCtrl.setRoot(FeedsPage);
                //   }
                // } else 

                if (pageDetail.pageName == MyMentionPage.name) {
                  this.navCtrl.setRoot(MyMentionPage);
                } else if (pageDetail.pageName == FeedsPage.name) {
                  this.navCtrl.setRoot(FeedsPage);
                } else if (pageDetail.pageName == ProfilePage.name) {
                  //this.navCtrl.setRoot(ProfilePage);
                  this.navCtrl.pop({});
                }
                else if (pageDetail.pageName == MyVideosPage.name) {
                  //this.navCtrl.setRoot(ProfilePage);
                  this.navCtrl.pop({});
                } else if (pageDetail.pageName == CreateFeedsPage.name) {
                  this.navCtrl.push(CreateFeedsPage);
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
  showGalleryPrompt() {

    this.mentionUsers = [];

    this.actionSheet = this.actionSheetCtrl.create({
      title: '',
      enableBackdropDismiss: false,
      buttons: [
        {
          text: 'Gallery',
          icon: 'ios-image',
          handler: () => {
            console.log('Gallery clicked');
            this.isPopupOpen = true;
            this.accessGallery();
          }
        }, {
          text: 'Camera',
          icon: 'ios-camera',
          handler: () => {
            this.isPopupOpen = true;
            console.log('Camera clicked');
            this.openCamera();
          }
        }, {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            this.isPopupOpen = false;
            console.log('Cancel clicked');
          }
        }
      ]
    });
    this.actionSheet.present();
  }

  uploadLocalImage() {
    let transfer = this.transfer;
    this.camera.getPicture({
      quality: 100
      , destinationType: this.camera.DestinationType.FILE_URI
      , sourceType: this.camera.PictureSourceType.PHOTOLIBRARY
      , encodingType: this.camera.EncodingType.JPEG
      , mediaType: this.camera.MediaType.PICTURE
    }).then((imageData) => {

      this.base64Image = imageData;

      let time = new Date().getTime();
      var imageName = this.userId + "_" + time + "_" + imageData.substr(imageData.lastIndexOf('/') + 1);

      let AWSService = AWS;
      AWSService.config.accessKeyId = 'AKIAJIEEOQRFJXCJEPWQ';
      AWSService.config.secretAccessKey = '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';
      AWSService.config.region = 'us-east-2';
      var s3 = new AWS.S3();

      var params1 = { Bucket: 'lodgistics-development', Key: "Connect-GroupChat-Images/" + imageName, ACL: 'public-read' };
      s3.getSignedUrl('putObject', params1, function (err, url) {
        console.log('The URL is', url);

        const fileTransfer: TransferObject = transfer.create();
        let options: FileUploadOptions = {
          fileKey: 'file',
          fileName: imageName,
          mimeType: "image/jpeg",
          httpMethod: 'PUT',
          chunkedMode: false,
          headers: { 'Content-Type': 'image/jpeg' }
        };
        var params = {
          key: "Connect-GroupChat-Images/" + imageName,
          "acl": "public-read",
          "region": 'us-east-2'
        };
        options.params = params;
        console.log(JSON.stringify(options));
        fileTransfer.upload(imageData, url, options).then((data) => {
          // success
          console.log("tt1" + JSON.stringify(data));
          console.log("https://s3.us-east-2.amazonaws.com/lodgistics-development/Connect-GroupChat-Images/" + imageName);
        }, (err) => {
          // error
          console.log("tt=" + JSON.stringify(err));
        });


      });

    }, (err) => {
      console.log(err);
    });
  }

  scrollTo(elementId: string) {
    if (document.getElementById(elementId) != null && document.getElementById(elementId) != undefined) {
      // alert("111");
      console.log("ack == " + elementId);
      // let yOffset = document.getElementById(elementId).offsetTop;
      console.log("ack == A");

      setTimeout(() => {
        this.zone.run(() => {
          let yOffset = document.getElementById(elementId).offsetTop;
          console.log("ack == B");

          if (yOffset == 0) {
            console.log("scroll bottom");
            this.content.scrollToBottom(300);
          } else {
            this.content.scrollTo(100, yOffset - 100, 100);
          }
          console.log("ack == C");
        });
      }, 500);

    }
  }

  openOptions(id, i) {
    this.showOptions = true;
    if (this.showPreviousSelected == "0" || this.showPreviousSelected != '') {

      this.allMessages[this.showPreviousSelected].message_obj.showSeelected = false;
    }
    if (this.allMessages[i].message_obj != "undefined" && this.allMessages[i].message_obj != null && this.allMessages[i].message_obj.id == id) {
      this.allMessages[i].message_obj.showSeelected = true;
      this.allMessages[i].message_obj.showSeelectedPosition = 'top';
      this.showPreviousSelected = i;
      let yOffset = document.getElementById(this.allMessages[i].message_obj.id).getBoundingClientRect().top;
      if (yOffset <= 100) {
        this.allMessages[i].message_obj.showSeelectedPosition = 'bottom';
      }
      console.log("yOffset" + yOffset);

    }
  }

  closeOptions(id, i) {
    this.showOptions = false;
    if (this.allMessages[i].message_obj != "undefined" && this.allMessages[i].message_obj != null && this.allMessages[i].message_obj.id == id) {
      this.allMessages[i].message_obj.showSeelected = false;
      this.showPreviousSelected = '';
    }
  }

  coptyText(id, i) {
    this.showOptions = false;
    if (this.allMessages[i].message_obj != "undefined" && this.allMessages[i].message_obj != null && this.allMessages[i].message_obj.id == id) {
      this.allMessages[i].message_obj.showSeelected = false;
      this.showPreviousSelected = '';
      let text = this.allMessages[i].message_obj.message.replace(/<\/?a[^>]*>/g, "");
      this.clipboard.copy(text);
    }
  }

  /**
  * Method will be called on lond press on any message
  * 
  * @param index index position of the work order in the list
  */
  showContextOptions(index: number) {
    let actionSheet = this.actionSheetCtrl.create({
      title: '',
      cssClass: 'feed_action_items',
    });
    actionSheet.addButton({
      text: 'Copy',
      icon: 'ios-copy-outline',
      handler: () => {
        console.log('ActionSheet Copy');
        this.coptyText(this.allMessages[index].message_obj.id, index)
      }
    });
    actionSheet.addButton({
      text: 'Reply',
      icon: 'ios-undo-outline',
      handler: () => {
        console.log('ActionSheet Reply');
        this.replyOnMessage(this.allMessages[index].message_obj.id, index)
      }
    });

    if (this.userPermissions.wo_access && this.userPermissions.wo_access.can_create &&
      !(this.allMessages[index].message_obj.work_order_id && this.allMessages[index].message_obj.work_order_id > 0)) {
      // TODO: show wo button
      actionSheet.addButton({
        text: 'Create WO',
        icon: 'ios-construct-outline',
        handler: () => {
          console.log('ActionSheet Create WO');
          this.confirmWorkOrder(this.allMessages[index].message_obj.id, this.allMessages[index].message_obj.message, index,
            this.allMessages[index].message_obj.image_url, this.allMessages[index].message_obj.mentioned_user_ids,
            this.allMessages[index].message_obj.room_id)
        }
      });
    }

    actionSheet.addButton({ text: 'Cancel', 'role': 'cancel' });

    actionSheet.present();

  }

  replyOnMessage(id, i) {
    //responding_to_mesage_id
    this.showOptions = false;
    if (this.allMessages[i].message_obj != "undefined" && this.allMessages[i].message_obj != null && this.allMessages[i].message_obj.id == id) {
      let tempMessageData = this.allMessages[i];
      this.allMessages[i].message_obj.showSeelected = false;
      this.showPreviousSelected = '';
      let modal = this.modalCtrl.create(ReplyMessagePage, { message: tempMessageData, users: this.users, userId: this.userId, mentionMembers: this.items });

      modal.onDidDismiss(data => {
        if (data.msg != "undefined" && data.msg != null && data.msg != "") {
          this.textMessage = data.msg;
          this.mentionUsers = [];
          if (data.mentionUsers != "undefined" && data.mentionUsers != null && data.mentionUsers.length > 0) {
            this.mentionUsers = data.mentionUsers;
          }
          this.sendMessage('', id);
        }
        this.closekeyboard();
        this.isPopupOpen = false;

      });

      this.isPopupOpen = true;
      modal.present({
        keyboardClose: false
      });
    }

  }

  selectAllMention(e, flag) {
    if (flag) {
      this.mentionUsers = [];
      for (let i = 0; i < this.items.length; i++) {
        if (this.items[i].id != this.userId && this.items[i].is_system_user != 1) {
          this.mentionUsers.push(this.items[i]);
          this.zone.run(() => {
            if (this.textMessage.indexOf("@" + this.items[i].name) == -1) {
              this.textMessage = this.textMessage + "@" + this.items[i].name + " ";
            }
          });
        }
      }
    } else {
      for (let i = 0; i < this.mentionUsers.length; i++) {

        let removeStr = "@" + this.mentionUsers[i].name + " ";
        console.log(this.textMessage + "  " + this.mentionUsers[i].name + " removeStr" + removeStr);

        this.zone.run(() => {
          console.log(this.textMessage + "  " + this.mentionUsers[i].name + " removeStr" + removeStr);
          this.textMessage = this.textMessage.replace(new RegExp(this.escapeRegExp(removeStr), 'g'), '');
        });
      }
      this.mentionUsers = [];

    }
    e.preventDefault();

  }

  getchatMessage(id) {
    let str = "";
    for (let i = 0; i < this.allMessages.length; i++) {
      if (this.allMessages[i].message_obj != "undefined" && this.allMessages[i].message_obj != null && this.allMessages[i].message_obj.id == id) {

        let allChatMentions = [];
        if (this.allMessages[i].message_obj.mentioned_user_ids != '' && this.allMessages[i].message_obj.mentioned_user_ids != null) {
          allChatMentions = this.allMessages[i].message_obj.mentioned_user_ids;
        }

        let mentionStr = this.commonMethod.getMentionString(allChatMentions, this.users);
        //if(mentionStr!="")
        // {
        // mentionStr = mentionStr;
        //val = mentionStr + val;
        //}

        mentionStr = "";

        str = "<b>" + (this.allMessages[i].userInfo ? this.allMessages[i].userInfo.name : '') + "</b><br/>";
        str += mentionStr + (this.allMessages[i].message_obj.message ? this.allMessages[i].message_obj.message : "");

        return str.replace(/text-decoration-line/g, "text-decoration");

      }
    }
    return str;
  }

  moveOnChatMsg(id) {
    this.zone.run(() => {
      this.highlightReplyMessage = true;
      this.highlightReplyMessageId = id;
      this.scrollTo(id);
      setTimeout(() => {
        this.groupInfo.highlightReplyMessage = false;
        this.highlightReplyMessageId = "";
      }, 5000);
    });
  }

  onScroll(e) {
  }

  scrollDown() {
    this.markReadMessages();
    this.zone.run(() => {
      this.showLoader = false;
    });
    if ((this.scrolltobottom || this.callFirstTime == true) && this.mentionDate == "" && (this.showNewId == null || this.showNewId == undefined)) {
      console.log("For private 1");
      this.content.scrollToBottom(300);
      this.scrolltobottom = false;
    } else if (this.scrolltobottom && this.mentionDate != "" && (this.groupInfo.highlight_message || this.isPrivateChat)) {
      this.scrolltobottom = false;

      setTimeout(() => {
        this.groupInfo.highlight_message = false;
      }, 10000);
      setTimeout(() => {
        this.scrollTo(this.groupInfo.message_id);
      }, 500);


      /* to open reply box from mention page */
      if ((this.groupInfo.message_id != undefined || this.groupInfo.message_id != null) && (this.groupInfo.reply_on_message == undefined || this.groupInfo.reply_on_message == true) && !this.search_tap) {
        for (let i = 0; i < this.allMessages.length; i++) {
          if (this.allMessages[i].message_obj != "undefined" && this.allMessages[i].message_obj != null && this.allMessages[i].message_obj.id == this.groupInfo.message_id && !this.is_acknowledged) {
            this.replyOnMessage(this.groupInfo.message_id, i);
          }
        }
      }

    } else if (this.scrolltobottom && this.showNewId != null) {
      this.scrolltobottom = false;
      if (document.getElementById(this.showNewId) != null && document.getElementById(this.showNewId) != undefined) {
        setTimeout(() => {
          let yOffset = document.getElementById(this.showNewId).offsetTop;
          let dimensions = this.content.getContentDimensions();

          let contentHeight = dimensions.contentHeight;
          let onethird = contentHeight / 3;

          this.content.scrollTo(100, yOffset - onethird, 1000);
        }, 500);


      }
    }
    else {
      console.log("test scroll");
      this.scrolltobottom = false;
    }
    //}, 1000);

  }

  onKey(event: any) { // without type info
    //this.values += event.target.value + ' | ';
    if (event.target.value.trim().length > 0) {
      this.zone.run(() => {
        this.showPostButton = true;
      });
    } else {
      this.zone.run(() => {
        this.showPostButton = false;
      });
    }
  }


  callNewMessages() {
    let last_msg_id = "";
    for (let i = 0; i < this.allMessages.length; i++) {
      if (this.allMessages[i].message_obj != "undefined" && this.allMessages[i].message_obj != null) {
        last_msg_id = this.allMessages[i].message_obj.id;
      }
    }
    let apiUrl = getChatsUrl + '/' + this.groupID + '/messages';
    if (last_msg_id != "") {
      apiUrl += "?message_id=" + last_msg_id;
    }
    this.showLoader = false;
    console.log(apiUrl + "  apiurl");
    this.addNewMessage(apiUrl);
  }

  addNewMessage(apiUrl) {
    let alertVar = this.alertCtrl.create({
      title: 'Error!',
      subTitle: 'Invalid Details!',
      buttons: ['OK']
    });
    /* call pai start */
    this.nativeStorage.getItem('user_auth').then(
      accessToken => {

        if (this.commonMethod.checkNetwork()) {
          this.commonMethod.getData(apiUrl, accessToken).subscribe(
            data => {
              console.log(data.json());
              console.log(JSON.stringify(data));

              let allData = data.json();
              if (allData.length > 0) {
                let ids = [];
                for (let i = (allData.length - 1); i >= 0; i--) {

                  let chatUserData = [];
                  for (let j = 0; j < this.users.length; j++) {
                    if (this.users[j].id == allData[i].sender_id) {
                      chatUserData = this.users[j];
                    }
                  }
                  ids.push(allData[i].id);
                  console.log(JSON.stringify(allData[i]) + " allData[i]");
                  let woUserDetail = [];

                  if (allData[i].work_order == undefined) {
                    allData[i].work_order = { "status": "" };
                  }
                  else {
                    console.log(JSON.stringify(allData[i].work_order) + "  WO else ");
                    console.log(allData[i].work_order.closed_by_user_id);
                    for (let m = 0; m < this.users.length; m++) {
                      if (this.users[m].id == allData[i].work_order.closed_by_user_id) {
                        woUserDetail = this.users[m];
                      }
                    }

                  }
                  console.log(JSON.stringify(woUserDetail) + " 22222");

                  woUserDetail = woUserDetail;
                  console.log(JSON.stringify(woUserDetail) + " 22222");
                  console.log("userInfo lod log 2" + chatUserData);
                  let tempData = {
                    "read_status": 1,
                    "message_obj": allData[i],
                    "dateGroup": allData[i].created_at,
                    "userInfo": chatUserData,
                    "woUserDetail": woUserDetail,
                    "user_added": false
                  };
                  this.zone.run(() => {
                    this.allMessages.push(tempData);
                    this.allMessages = this.allMessages;
                  });
                }

                this.sendStatus(ids);
              }
              setTimeout(() => {
                this.content.scrollToBottom(300);
              }, 500);
              this.commonMethod.hideLoader();
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

  openWorkOrderPage(id, url) {

    this.nativeStorage.getItem('user_auth').then(
      accessToken => {

        let token = accessToken.access_token ? accessToken.access_token : '';
        let property_token = accessToken.property_token ? accessToken.property_token : '';
        //let url = viewWorkOrderUrl + "?authorization=" + token+"&property_token="+property_token+"&id="+id;
        url = url + "&authorization=" + token + "&property_token=" + property_token;
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

    //this.navCtrl.setRoot(WebHomePage,{id:id,page:'group_chat',group_data:this.groupInfo});
  }

  sortByKey(array, key) {
    return array.sort(function (a, b) {
      var x = a[key]; var y = b[key];
      return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
  }
  OnButtonDown(e) {
    e.preventDefault();
  }

  confirmWorkOrder(id, value, i, image_url, mentioned_user_ids, room_id) {
    if (this.allowWO == true) {
      this.showOptions = false;
      if (this.allMessages[i].message_obj != "undefined" && this.allMessages[i].message_obj != null && this.allMessages[i].message_obj.id == id) {
        this.allMessages[i].message_obj.showSeelected = false;
        this.showPreviousSelected = '';

        let alert = this.alertCtrl.create({
          message: chatCreateWorkOrderConfirmMsg,
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
                this.createWorkOrder(id, value, image_url, mentioned_user_ids, i, room_id);
              }
            }
          ]
        });
        alert.present();
      }
    }
  }

  createWorkOrder(id, value, image_url, mentioned_user_ids, i, room_id) {
    let modal = this.modalCtrl.create(CreateWorkOrderPage, { id: id, value: value, image_url: image_url, mentioned_user_ids: mentioned_user_ids, pageName: 'chat', room_id: room_id });
    modal.onDidDismiss(data => {
      this.closekeyboard();
      this.isPopupOpen = false;
      if (data.id != "undefined" && data.id != null && data.work_order_id != "" && data.work_order_id != "undefined" && data.work_order_id != null) {
        this.sqlite.create({
          name: 'data.db',
          location: 'default'
        }).then((db: SQLiteObject) => {
          db.executeSql("UPDATE chat_messages SET work_order_id=" + data.work_order_id + ", work_order_url=" + "'" + data.work_order_url + "'" + ", work_order_status=" + "'" + data.work_order_status + "'" + " WHERE id IN (" + data.id + ")", {}).then((data1) => {
            console.log("MESSAGE work_order_id=" + data.work_order_id + " : " + JSON.stringify(data1));
            this.zone.run(() => {
              this.allMessages[i].message_obj.work_order_id = data.work_order_id;
              this.allMessages[i].message_obj.work_order_url = data.work_order_url;
              this.allMessages[i].message_obj.work_order.status = data.work_order_status;
            });
          }, (error1) => {
            console.log("ERROR MESSAGE work_order_id=" + data.work_order_id + " : " + JSON.stringify(error1));
          });
        }).catch(e => console.log(e));

      }
    });
    this.isPopupOpen = true;
    modal.present();
  }

  changeModelValue() {
    this.zone.run(() => {
      this.textMessage = this.textMessage;
      debugger
      this.mentionMembers = this.items;
    });
  }

  keyDownCheck(e) {
    this.oldMsgTextValue = this.textMessage;
    console.log("11ketdown" + this.textMessage);
  }

  valchange(e) {

    console.log("==" + e.key);
    //console.log("=="+e.keyCode);
    //console.log("==" + JSON.stringify(e));
    //if (e.key != "Backspace") {   // only for ios
    if (!(this.oldMsgTextValue.length > this.textMessage.length))   // only for android
    {
      this.zone.run(() => {
        //this.textMessage = this.textMessage;

        //this.mentionMembers=this.items;
        if (this.textMessage && this.textMessage.trim() != "") {
          let strArray = this.textMessage.trim().split(" ");
          // Display array values on page
          for (var i = 0; i < strArray.length; i++) {
            if (strArray[i].charAt(0) == "@" && strArray.length == (i + 1)) {
              this.showMentions = true;
              let val = strArray[i].toString().substr(1);
              if (val.trim() != "") {
                let tempMentions = [];
                for (let l = 0; l < this.items.length; l++) {

                  let tempUserName = this.items[l].name.toLowerCase().split(" ");
                  if (this.items[l] != undefined && this.items[l].id != this.userId && tempUserName[0] == val.toLowerCase()) {
                    //this.showMentions=false;
                    this.selectUser(undefined, this.items[l], true);
                    tempMentions = this.items;
                  }
                  else if (this.items[l] != undefined && this.items[l].id != this.userId && this.items[l].name.toLowerCase().search(val.toLowerCase()) > -1) {
                    tempMentions.push(this.items[l]);
                  }
                }
                this.mentionMembers = tempMentions;
              }
            }
            else {
              this.showMentions = false;
            }
          }
        }
        else {
          this.showMentions = false;
        }


      });
    }
  }

  getAllSystemUsersFromDb() {
    this.sqlite.create({
      name: 'data.db',
      location: 'default'
    }).then((db: SQLiteObject) => {

      db.executeSql("SELECT * FROM members WHERE is_system_user=='1'", {}).then((allMembers) => {
        console.log("SELECT is_system_user FROM DB: " + JSON.stringify(allMembers));

        if (allMembers.rows.length > 0) {
          for (let i = 0; i < allMembers.rows.length; i++) {
            let tempUserInfo = {
              "id": allMembers.rows.item(i).user_id,
              "name": allMembers.rows.item(i).name,
              "image": allMembers.rows.item(i).image,
              "joined_date": '',
              "show_in_ui": false,
              "is_system_user": allMembers.rows.item(i).is_system_user
            };

            this.users.push(tempUserInfo);
            this.addedUsers.push(tempUserInfo);
          }
        }
      }, (error1) => {
        console.log("SELECT is_system_user ERROR: " + JSON.stringify(error1));
      });
    }).catch(e => console.log(e));
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

  checkMentions() {
    if (this.showMentions == true) {
      this.showMentions = false;
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
              if (click.click && this.actionSheet != undefined) {
                this.actionSheet.dismiss();
              } if (click.click && this.alert != undefined) {
                this.alert.dismiss();
              }
            });
        }, 2000);
      });
    });
  }
  editWorkOrder(id, wo_no, i) {
    let modal = this.modalCtrl.create(CreateWorkOrderPage, { wo_no: wo_no, id: id });
    modal.onDidDismiss(data => {
      this.closekeyboard();
      this.isPopupOpen = false;
      if (data.id != "undefined" && data.id != null && data.work_order_id != "" && data.work_order_id != "undefined" && data.work_order_id != null) {

        this.sqlite.create({
          name: 'data.db',
          location: 'default'
        }).then((db: SQLiteObject) => {
          db.executeSql("UPDATE chat_messages SET work_order_status=" + "'" + data.work_order_status + "'" + " WHERE id IN (" + data.id + ")", {}).then((data1) => {
            console.log("WO updated work_order_id=" + data.work_order_id + " : " + JSON.stringify(data1));
            this.zone.run(() => {
              this.allMessages[i].message_obj.work_order.status = data.work_order_status;
            });
          }, (error1) => {
            console.log("ERROR MESSAGE work_order_id=" + data.work_order_id + " : " + JSON.stringify(error1));
          });
        }).catch(e => console.log(e));
      }
    });
    modal.present();
  }
}

import { Component, NgZone, ViewChild, ElementRef } from '@angular/core';
import { NavController, AlertController, Platform, ModalController, NavParams, ViewController, Events, ActionSheetController, Content, PopoverController } from 'ionic-angular';
import { srviceMethodsCall } from '../../services/serviceMethods';
import { Keyboard } from '@ionic-native/keyboard';
import { NativeStorage } from '@ionic-native/native-storage';
import { Camera, CameraOptions } from '@ionic-native/camera';
import { Transfer, FileUploadOptions, TransferObject } from '@ionic-native/transfer';
import { File } from '@ionic-native/file';
import { getAwsSignedUrl, getPrivateOnlyUrl, getGroupsOnlyUrl, sendMessageUrl, addEditGroupUrl } from '../../services/configURLs';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { removeMessageConfirmMsg } from '../../providers/appConfig';
import { UserListPopoverPage } from '../user-list-popover/user-list-popover';
import { MessageSentSuccessfullyPage } from '../messageSentSuccessfully/messageSentSuccessfully';

@Component({
  selector: 'page-sendMessage',
  templateUrl: 'sendMessage.html',
  providers: [srviceMethodsCall, Keyboard, NativeStorage, Camera, Transfer, File, SQLite]
})

export class SendMessagePage {
  //@ViewChild('myInput') myInput: ElementRef;
  @ViewChild('myInput') myInput;
  @ViewChild(Content) content: Content;

  public messageText = "";
  public base64Image = "";
  public actionSheet: any;
  private showOverlay = false;
  public foundRepos: any;
  public groupIds = [];
  public userIds = [];
  public userId: any;
  public allUsers = [];
  public classnameForFooter = '';
  public mentionUsers = [];
  public mentionMembers = [];
  public showMentions = false;
  //public members = [];
  public dbMembers = [];
  public isKeyboardOpen = false;
  public completeTestService = ['aa', 'ba', 'ca'];
  public showList = false;
  public filterUser: any;
  public filterGroup: any;
  public searchText = "";
  private keyboardHeight = 0;
  private isShowMore: boolean = false;

  constructor(public platform: Platform, public params: NavParams, private keyboard: Keyboard, public viewCtrl: ViewController, public zone: NgZone,
    private modalCtrl: ModalController, public commonMethod: srviceMethodsCall, public events: Events, public nativeStorage: NativeStorage,
    public actionSheetCtrl: ActionSheetController, private camera: Camera, private transfer: Transfer, private file: File,
    public alertCtrl: AlertController, private sqlite: SQLite, public popoverCtrl: PopoverController) {

    this.keyboard.disableScroll(true);
    this.messageText = '';
    this.foundRepos = { groups: [], privates: [] };
    this.getAllMembersFromDb();
    this.getIndividualUsers();
    this.getGroupUsers();

    this.keyboard.onKeyboardShow().subscribe(data => {
      console.log('keyboard is shown');
      this.zone.run(() => {
        this.isKeyboardOpen = true;
        this.keyboardHeight = data.keyboardHeight
        if (data.keyboardHeight > 230) {
          this.classnameForFooter = "openKeyboardWithSpellCheck";
        } else {
          this.classnameForFooter = "openKeyboard";
        }
        this.resize()
        //this.deviceHeight = (platform.height() - (parseInt(data.keyboardHeight) + parseInt('234')));
        //console.log("deviceHeight = " + this.deviceHeight);

      });
    });

    this.keyboard.onKeyboardHide().subscribe(data => {
      console.log('keyboard is hiode');
      this.events.publish('hide:keyboard');
      this.keyboardHeight = 0;
      this.zone.run(() => {
        this.isKeyboardOpen = false;
        //this.deviceHeight = (platform.height() - 150);
        this.classnameForFooter = "closeKeyboard";
        this.resize()
      });
    });



  }

  resize() {
    this.content.resize();
  }

  dismiss() {
    this.keyboard.close();
    this.viewCtrl.dismiss('');
  }

  /**
   * Method will be called if user selects only one user/group
   */
  send() {
    if (this.base64Image) {
      this.uploadImageOnAws(this.base64Image, false);
    } else {
      this.sendMessage('');
    }
    this.keyboard.close();
    // this.viewCtrl.dismiss();
  }

  /**
   * Method will be called if user selects more than one user/group
   */
  createGroup() {
    console.log('Create Group')
    if (this.base64Image) {
      this.uploadImageOnAws(this.base64Image, true);
    } else {
      this.sendMessageToGroup('');
    }
  }

  sendMessageToGroup(imageUrl: String) {

    // Create array of mentioned user id
    let mentioneduserIds = [];
    if (this.mentionUsers.length > 0) {
      for (let i = 0; i < this.mentionUsers.length; i++) {
        mentioneduserIds.push(this.mentionUsers[i].id);
      }
    }

    let userIds = [];
    let groupName = ''
    // Create array of user id which are in the group
    for (let i = 0; i < this.allUsers.length; i++) {
      if (this.allUsers[i].user_id) {
        userIds.push(this.allUsers[i].user_id as number);
        if (i == 0) {
          groupName = this.allUsers[i].name.substring(0, 3);
        } else {
          groupName += '_' + this.allUsers[i].name.substring(0, 3);
        }
      }
    }

    if (userIds.length == 0) {
      let alertVar = this.alertCtrl.create({
        title: 'Error!',
        subTitle: 'All the user ids are blanck',
        buttons: ['OK']
      });
      alertVar.present()
      return;
    }

    console.log(groupName)

    let objData = {};
    objData = { 'chat': { 'name': groupName, 'user_ids': userIds, 'is_private': false } };

    this.nativeStorage.getItem('user_auth').then(
      accessToken => {

        let alertVar = this.alertCtrl.create({
          title: 'Error!',
          subTitle: 'Invalid Details!',
          buttons: ['OK']
        });
        if (this.commonMethod.checkNetwork()) {

          // Create the new group
          this.commonMethod.postData(addEditGroupUrl, objData, accessToken).subscribe(
            data => {
              let chatObj = {
                'chat_message': {
                  message: this.messageText.trim(), chat_id: data.json().id,
                  mentioned_user_ids: mentioneduserIds, image_url: imageUrl, responding_to_chat_message_id: ''
                }
              };

              // Send message to newly group
              this.sendMsgToUser(chatObj, groupName);
              this.events.publish('hide:keyboard');
              this.keyboard.close();
              // this.viewCtrl.dismiss();
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

      })
  }


  updateValue(event: Event): void {
    const value: string = (<HTMLSelectElement>event.srcElement).value;
    this.zone.run(() => {
      this.messageText = value;
    });
  }

  changeModelValue() {
    this.zone.run(() => {
      this.messageText = this.messageText;
    });
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
                this.viewCtrl.dismiss('');
              }
            });
        }, 2000);
      });
    });
  }

  accessGallery() {
    this.showOverlay = false;
    this.camera.getPicture({
      quality: 100
      , destinationType: this.camera.DestinationType.DATA_URL
      , sourceType: this.camera.PictureSourceType.PHOTOLIBRARY
      , encodingType: this.camera.EncodingType.JPEG
      , mediaType: this.camera.MediaType.PICTURE
      , targetWidth: 800 //what widht you want after capaturing
      , targetHeight: 800
    }).then((imageData) => {
      this.base64Image = 'data:image/jpeg;base64,' + imageData;
      //this.uploadImageOnAws(imageData);
    }, (err) => {
      console.log(err);
    });
  }

  openCamera() {
    this.showOverlay = false;
    const options: CameraOptions = {
      quality: 100
      , destinationType: this.camera.DestinationType.DATA_URL
      , sourceType: this.camera.PictureSourceType.CAMERA
      , encodingType: this.camera.EncodingType.JPEG
      , mediaType: this.camera.MediaType.PICTURE
      , targetWidth: 800 //what widht you want after capaturing
      , targetHeight: 800
    };

    this.camera.getPicture(options).then((imageData) => {
      // imageData is either a base64 encoded string or a file URI
      // If it's base64:
      this.base64Image = 'data:image/jpeg;base64,' + imageData;
      //this.uploadImageOnAws(imageData);
    }, (err) => {
      // Handle error
    });

  }

  closekeyboard() {
    this.classnameForFooter = "closeKeyboard";
    this.showOverlay = false;
    //this.isKeyboardOpen=false;
    this.keyboard.close();
  }

  shoOverlay() {
    this.showOverlay = true;
    //this.isKeyboardOpen=false;
    this.keyboard.close();
  }

  hideOverlay() {
    this.showOverlay = false;
  }

  getIndividualUsers() {
    let alertVar = this.alertCtrl.create({
      title: 'Error!',
      subTitle: 'Invalid Details!',
      buttons: ['OK']
    });

    this.nativeStorage.getItem('user_auth').then(
      accessToken => {

        this.userId = accessToken.user_id;

        if (this.commonMethod.checkNetwork()) {
          this.commonMethod.getDataWithoutLoder(getPrivateOnlyUrl, accessToken).timeout(60000).subscribe(
            data => {
              //this.commonMethod.hideLoader();
              this.foundRepos.privates = data.json();
              this.filterUser = this.foundRepos.privates;
            },
            err => {
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
          this.commonMethod.hideLoader();
          this.commonMethod.showNetworkError();
        }

      },
      error => {
        return '';
      }
    );
  }

  getGroupUsers() {
    let alertVar = this.alertCtrl.create({
      title: 'Error!',
      subTitle: 'Invalid Details!',
      buttons: ['OK']
    });

    this.nativeStorage.getItem('user_auth').then(
      accessToken => {
        if (this.commonMethod.checkNetwork()) {
          this.commonMethod.getDataWithoutLoder(getGroupsOnlyUrl, accessToken).timeout(60000).subscribe(
            data => {
              //this.commonMethod.hideLoader();
              this.foundRepos.groups = data.json();
              this.filterGroup = this.foundRepos.groups;
            },
            err => {
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
          this.commonMethod.hideLoader();
          this.commonMethod.showNetworkError();
        }

      },
      error => {
        return '';
      }
    );
  }

  selectGroups() {
    let actionSheet = this.actionSheetCtrl.create({
      title: 'Select a Group',
    });
    for (var i = 0; i < this.foundRepos.groups.length; i++) {
      let thisObj = this;
      let name = this.foundRepos.groups[i].chat.name;
      //let id=this.departmentsData[i].id;
      let id = this.foundRepos.groups[i].chat.id;
      let user_id = this.foundRepos.groups[i].chat.id;
      let group_users = this.foundRepos.groups[i].chat.users;

      actionSheet.addButton({
        text: name, handler: () => {
          this.allUsers = [{ type: 'group', id: id, name: name, user_id: user_id }];
          thisObj.mentionUsers = [];
          let tempUsers = [];

          for (let i = 0; i < group_users.length; i++) {
            for (let j = 0; j < thisObj.dbMembers.length; j++) {
              if (group_users[i].id == thisObj.dbMembers[j].id && group_users[i].id != thisObj.userId) {
                group_users[i].avatar.url = thisObj.dbMembers[j].image;
                tempUsers.push(group_users[i]);
              }
            }
          }
          thisObj.mentionMembers = tempUsers;
        }
      });
    }
    actionSheet.present();
  }

  selectIndividual() {
    console.log(JSON.stringify(this.foundRepos))
    let actionSheet = this.actionSheetCtrl.create({
      title: 'Select a User',
    });
    for (var i = 0; i < this.foundRepos.privates.length; i++) {

      let name = this.foundRepos.privates[i].target_user.name;
      let id = this.foundRepos.privates[i].chat.id;
      let user_id = this.foundRepos.privates[i].target_user.id;
      let userInfo = this.foundRepos.privates[i].target_user;

      if (!this.allUsers.some(el => { return el.user_id === user_id; })) {
        actionSheet.addButton({
          text: name, handler: () => {
            if (this.allUsers && this.allUsers.length > 0) {
              if (this.allUsers[0].type != 'private') {
                this.allUsers = []
                this.mentionUsers = [];
                this.mentionMembers = []
              }
              if (!this.allUsers.some(el => { return el.user_id === user_id; })) {
                this.allUsers.push({ type: 'private', id: id, name: name, user_id: user_id })

                for (let j = 0; j < this.dbMembers.length; j++) {
                  if (userInfo.id == this.dbMembers[j].id) {
                    userInfo.avatar.url = this.dbMembers[j].image;
                    this.mentionMembers.push(userInfo);
                  }
                }
              }

            } else {
              this.mentionUsers = [];
              this.allUsers = [{ type: 'private', id: id, name: name, user_id: user_id }];

              let tempUsers = [];
              for (let j = 0; j < this.dbMembers.length; j++) {
                if (userInfo.id == this.dbMembers[j].id) {
                  userInfo.avatar.url = this.dbMembers[j].image;
                  tempUsers.push(userInfo);
                }
              }
              this.mentionMembers = tempUsers;
            }
            this.resize()
          }
        });
      }
    }
    actionSheet.present();
  }

  resetSelection() {

    let thisObj = this;
    if (this.mentionUsers.length > 0) {
      let alert = this.alertCtrl.create({
        message: removeMessageConfirmMsg,
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
            text: 'Yes Remove',
            handler: data => {
              console.log('Yes clicked');
              this.messageText = "";
              this.allUsers = [];
              this.mentionMembers = [];
              this.mentionUsers = [];
              this.isShowMore = false
              this.resize()
            }
          }
        ]
      });
      alert.present();
    } else {
      this.allUsers = [];
      this.mentionMembers = [];
      this.mentionUsers = [];
      this.isShowMore = false
      this.resize()
    }

  }


  removeImage() {
    this.base64Image = "";
  }

  updateSelection() {
    this.allUsers = [];
    let tempStr = "<span style='color:#fff !important'>.</span>";
    if (this.groupIds.length > 0) {
      for (var i = 0; i < this.foundRepos.groups.length; i++) {
        if (this.groupIds.indexOf(this.foundRepos.groups[i].chat.id) >= 0) {
          this.allUsers.push({ type: 'group', id: this.foundRepos.groups[i].chat.id, name: this.foundRepos.groups[i].chat.name.replace(/ /g, '&nbsp;'), user_id: this.foundRepos.groups[i].chat.id });
        }
      }
    }
    if (this.userIds.length > 0) {
      for (var i = 0; i < this.foundRepos.privates.length; i++) {
        if (this.userIds.indexOf(this.foundRepos.privates[i].target_user.id) >= 0) {
          this.allUsers.push({ type: 'private', id: this.foundRepos.privates[i].chat.id, name: this.foundRepos.privates[i].target_user.name.replace(/ /g, '&nbsp;'), user_id: this.foundRepos.privates[i].target_user.id });
        }
      }
    }
  }

  uploadImageOnAws(imageData, isCreateGroup: boolean) {
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
              let foundReposImg = data.json();
              console.log(foundReposImg);
              let url = foundReposImg.signedUrl;
              let s3FileUrl = foundReposImg.s3FileUrl;

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

                if (isCreateGroup) {
                  this.sendMessageToGroup(s3FileUrl);
                } else {
                  thisObj.sendMessage(s3FileUrl);
                }

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


  sendMessage(image_url) {

    let mentionId = [];
    if (this.mentionUsers.length > 0) {
      for (let i = 0; i < this.mentionUsers.length; i++) {
        mentionId.push(this.mentionUsers[i].id);
        // feedData = feedData.replace("@"+this.mentionUsers[i].name,'');

        let mention_user_id = this.mentionUsers[i].id;
        this.commonMethod.updateMentionsDb(mention_user_id, 'group', 2);
      }
    }


    let messageText = this.messageText.trim();

    if (this.allUsers.length > 0) {

      for (let i = 0; i < this.allUsers.length; i++) {


        if (this.allUsers[i].id != null && this.allUsers[i].id > 0) {
          let objData = {
            'chat_message': {
              message: messageText, chat_id: this.allUsers[i].id,
              mentioned_user_ids: mentionId, image_url: image_url, responding_to_chat_message_id: ''
            }
          };
          this.sendMsgToUser(objData, this.allUsers[i].name);
        } else {
          let objData = {
            'chat_message': {
              message: messageText, chat_id: this.allUsers[i].id, mentioned_user_ids: mentionId,
              image_url: image_url, responding_to_chat_message_id: ''
            }
          };
          this.createChatChanel(objData, this.allUsers[i].user_id, this.allUsers[i].name);
        }
      }
    }

    this.events.publish('hide:keyboard');
    this.keyboard.close();

  }

  successMessage(name: string) {
    let modal = this.modalCtrl.create(MessageSentSuccessfullyPage, { name: name });
    modal.onDidDismiss(data => {
      this.closekeyboard();
      if (data.redirect) {
        this.dismiss()
      } else {
        let modal = this.modalCtrl.create(SendMessagePage);
        modal.onDidDismiss(data => {
          this.closekeyboard();
        });
        modal.present({
          animate: false
        });
        setTimeout(() => {
          this.dismiss()
        }, 300)
      }
    });
    modal.present();
  }

  sendMsgToUser(objData, name) {
    this.nativeStorage.getItem('user_auth').then(
      accessToken => {
        if (this.commonMethod.checkNetwork()) {
          this.commonMethod.postDataWithoutLoder(sendMessageUrl, objData, accessToken).subscribe(
            data => {
              console.log(data.json());
              this.successMessage(name)
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
  }

  createChatChanel(objData, user_id, name) {
    let alertVar = this.alertCtrl.create({
      title: 'Error!',
      subTitle: 'Invalid Details!',
      buttons: ['OK']
    });

    let objData1 = { 'chat': { 'user_ids': [this.userId, user_id], 'is_private': true } };
    this.nativeStorage.getItem('user_auth').then(
      accessToken => {

        if (this.commonMethod.checkNetwork()) {
          this.commonMethod.postData(addEditGroupUrl, objData1, accessToken).subscribe(
            data => {
              let chanelCreateData = data.json();
              objData.chat_message.chat_id = chanelCreateData.id;
              this.sendMsgToUser(objData, name);
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

    if (this.showMentions == true && this.messageText != "") {
      let strArray = this.messageText.trim().split(" ");
      // Display array values on page
      for (var i = 0; i < strArray.length; i++) {
        if (strArray[i].charAt(0) == "@" && strArray.length == (i + 1)) {
          //this.zone.run(() => {
          this.messageText = this.removeLastInstance(strArray[i], this.messageText);
          this.zone.run(() => {
            this.messageText = this.messageText + "@" + memberInfo.name + " ";
          });
          mentionAdded = false;
        }
      }
    }
    if (this.mentionUsers.length > 0) {
      let insertFlag = true;
      for (let i = 0; i < this.mentionUsers.length; i++) {
        if (this.mentionUsers[i].id == memberInfo.id && add != true) {

          let removeStr = "@" + this.mentionUsers[i].name + " ";
          console.log(this.messageText + "  " + this.mentionUsers[i].name + " removeStr" + removeStr);

          this.zone.run(() => {
            console.log(this.messageText + "  " + this.mentionUsers[i].name + " removeStr" + removeStr);
            this.messageText = this.messageText.replace(new RegExp(this.escapeRegExp(removeStr), 'g'), '');
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
            this.messageText = this.messageText + "@" + memberInfo.name + " ";
          });
        }
      }
    }
    else {
      this.mentionUsers.push(memberInfo);
      if (mentionAdded) {
        this.zone.run(() => {
          this.messageText = this.messageText + "@" + memberInfo.name + " ";
        });
      }
    }

    this.showMentions = false;
    if (e != undefined) {
      e.preventDefault();
    }
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

  updateName(sourceText) {
    return sourceText = sourceText.replace(/ /g, "<small style='color:#fff;'>.</small>");
  }

  updateHtml(val) {
    return val.replace(/text-decoration-line/g, "text-decoration");
  }

  selectAllMention(e, flag) {
    if (flag) {
      this.mentionUsers = [];

      for (let i = 0; i < this.mentionMembers.length; i++) {
        console.log("select all");
        if (this.mentionMembers[i].id != this.userId && this.mentionMembers[i].is_system_user != 1) {
          this.mentionUsers.push(this.mentionMembers[i]);
          if (this.messageText.indexOf("@" + this.mentionMembers[i].name) == -1) {
            this.zone.run(() => {
              this.messageText = this.messageText + "@" + this.mentionMembers[i].name + " ";
            });
          }
        }
      }
    } else {
      for (let i = 0; i < this.mentionUsers.length; i++) {

        let removeStr = "@" + this.mentionUsers[i].name + " ";
        console.log(this.messageText + "  " + this.mentionUsers[i].name + " removeStr" + removeStr);

        this.zone.run(() => {
          console.log(this.messageText + "  " + this.mentionUsers[i].name + " removeStr" + removeStr);
          this.messageText = this.messageText.replace(new RegExp(this.escapeRegExp(removeStr), 'g'), '');
        });
      }
      this.mentionUsers = [];
    }
    //e.preventDefault();
  }

  getAllMembersFromDb() {

    this.nativeStorage.getItem('user_auth').then(
      accessToken => {
        this.userId = accessToken.user_id;

        this.sqlite.create({
          name: 'data.db',
          location: 'default'
        }).then((db: SQLiteObject) => {

          db.executeSql("SELECT members.*,user_mentions.total FROM members LEFT JOIN user_mentions on user_mentions.user_id=members.user_id AND type='post' AND type_id='1' WHERE members.user_id!='" + this.userId + "' AND is_system_user!='1' ORDER BY user_mentions.total DESC, members.name ASC", {}).then((allMembers) => {
            console.log("SELECT MEMBERS FROM DB: " + JSON.stringify(allMembers));

            if (allMembers.rows.length > 0) {
              for (let i = 0; i < allMembers.rows.length; i++) {
                let tempUserInfo = {
                  "id": allMembers.rows.item(i).user_id,
                  "name": allMembers.rows.item(i).name,
                  "image": allMembers.rows.item(i).image,
                  "total": allMembers.rows.item(i).total
                };

                this.dbMembers.push(tempUserInfo);
              }
            }

          }, (error1) => {
            console.log("SELECT MEMBERS ERROR: " + JSON.stringify(error1));
          });

        }).catch(e => console.log(e));

      },
      error => {
        return '';
      }
    );
  }

  valchange(e) {

    console.log("==" + e.key);
    //console.log("=="+e.keyCode);
    //console.log("==" + JSON.stringify(e));
    if (e.key != "Backspace") {

      this.zone.run(() => {
        //this.feedText = this.feedText;

        //this.mentionMembers=this.members;
        if (this.messageText && this.messageText != "") {
          let strArray = this.messageText.trim().split(" ");
          // Display array values on page
          for (var i = 0; i < strArray.length; i++) {
            if (strArray[i].charAt(0) == "@" && strArray.length == (i + 1)) {
              this.showMentions = true;
              let val = strArray[i].toString().substr(1);
              if (val.trim() != "") {
                let tempMentions = [];
                for (let l = 0; l < this.mentionMembers.length; l++) {
                  console.log("val change" + this.mentionMembers + " " + this.mentionMembers[i]);
                  let tempUserName = this.mentionMembers[l].name.toLowerCase().split(" ");
                  if (this.mentionMembers[l] != undefined && this.mentionMembers[l].id != this.userId && tempUserName[0] == val.toLowerCase()) {
                    //this.showMentions=false;
                    this.selectUser('', this.mentionMembers[l], true);
                  }
                  else if (this.mentionMembers[l] != undefined && this.mentionMembers[l].id != this.userId && this.mentionMembers[l].name.toLowerCase().search(val.toLowerCase()) > -1) {
                    tempMentions.push(this.mentionMembers[l]);
                  }
                }
                //this.mentionUsers = tempMentions;
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

  showMore(isShowMore: boolean) {
    this.isShowMore = isShowMore
  }

  presentPopover(myEvent, isShowMore: boolean) {
    // this.isShowMore = isShowMore
    let popover = this.popoverCtrl.create(UserListPopoverPage, {
      userList: this.allUsers
    });
    popover.present({
      ev: myEvent
    });
    popover.onDidDismiss(() => {
      this.isShowMore = !isShowMore
    })
  }

  getUsers() {
    this.showList = true;
    if (!this.allUsers || this.allUsers.length == 0) {
      this.filterGroup = this.getFilteredList(this.foundRepos.groups);
      this.filterUser = this.getFilteredList(this.foundRepos.privates);
    } else if (this.allUsers && this.allUsers[0].type == 'private') {
      this.filterGroup = []
      this.filterUser = this.getFilteredList(this.foundRepos.privates);
    } else {
      this.filterGroup = this.getFilteredList(this.foundRepos.groups);
      this.filterUser = []
      this.showList = false;
    }
  }

  getFilteredList(data) {
    //alert(data.length);
    this.searchText = this.searchText.trim();
    if (this.searchText && this.searchText != '') {
      var lsearchText = this.searchText.toLowerCase();
      return data.filter((a) =>
        a.chat.name.toLowerCase().includes(lsearchText)
      );
      // let res=[];
      // for (let i = 0; i < data.length; i++) {
      //   let text = data[i].chat.name;
      //   if (text.toLowerCase().indexOf(this.searchText) > -1) {
      //     res.push(data[i]);
      //   }
      // }
      // return res;
    }
    return data;
  }

  selectUserFromList(name, id, user_id, userInfo) {
    if (this.allUsers && this.allUsers.length > 0) {
      if (this.allUsers[0].type != 'private') {
        this.allUsers = []
        this.mentionUsers = [];
        this.mentionMembers = []
      }

      if (!this.allUsers.some(el => { return el.user_id === user_id; })) {
        this.allUsers.push({ type: 'private', id: id, name: name, user_id: user_id })

        for (let j = 0; j < this.dbMembers.length; j++) {
          if (userInfo.id == this.dbMembers[j].id) {
            userInfo.avatar.url = this.dbMembers[j].image;
            this.mentionMembers.push(userInfo);
          }
        }
      }

    } else {
      this.mentionUsers = [];
      this.allUsers = [{ type: 'private', id: id, name: name, user_id: user_id }];

      let tempUsers = [];
      for (let j = 0; j < this.dbMembers.length; j++) {
        if (userInfo.id == this.dbMembers[j].id) {
          userInfo.avatar.url = this.dbMembers[j].image;
          tempUsers.push(userInfo);
        }
      }
      this.mentionMembers = tempUsers;
    }

    this.removeSearch();

    this.resize()
    this.focusInput();
  }


  selectGroupFromList(name, id, user_id, group_users) {
    // let name=this.foundRepos.groups[i].chat.name;
    // let id=this.foundRepos.groups[i].chat.id;
    // let user_id=this.foundRepos.groups[i].chat.id;
    // let group_users=this.foundRepos.groups[i].chat.users;

    // if (this.allUsers && this.allUsers.length > 0) {
    //   this.allUsers.push({ type: 'group', id: id, name: name, user_id: user_id })
    // } else {
    this.allUsers = [{ type: 'group', id: id, name: name, user_id: user_id }];
    // }
    this.mentionUsers = [];
    let tempUsers = [];
    for (let i = 0; i < group_users.length; i++) {
      for (let j = 0; j < this.dbMembers.length; j++) {
        if (group_users[i].id == this.dbMembers[j].id && group_users[i].id != this.userId) {
          group_users[i].avatar.url = this.dbMembers[j].image;
          tempUsers.push(group_users[i]);
        }
      }
    }
    this.mentionMembers = tempUsers;
    this.removeSearch();
    this.focusInput();
  }

  removeSearch() {
    this.showList = false;
    this.searchText = "";
  }

  focusInput() {
    console.log("focus start");
    this.myInput.setFocus();
    // input.setFocus();
    console.log("focus end");
  }



}

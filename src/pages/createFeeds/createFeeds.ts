import { Component, NgZone, ViewChild } from '@angular/core';
import { ViewController, NavController, AlertController, Platform, ActionSheetController, Events, ModalController } from 'ionic-angular';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Validator } from '../../validator';
import { srviceMethodsCall } from '../../services/serviceMethods';
import { createFeedUrl, getMentionables } from '../../services/configURLs';
import { NativeStorage } from '@ionic-native/native-storage';
import { Keyboard } from '@ionic-native/keyboard';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { Camera, CameraOptions } from '@ionic-native/camera';
import { Transfer, FileUploadOptions, TransferObject } from '@ionic-native/transfer';
import { File } from '@ionic-native/file';
import { FeedsPage } from '../feeds/feeds';
import { getAwsSignedUrl } from '../../services/configURLs';
import { Navbar } from 'ionic-angular';
import { UtilMethods } from '../../services/utilMethods';
import { createBroadcastPage } from '../createBroadcast/createBroadcast';
import { createFollowUpPage } from '../createFollowUp/createFollowUp';
import { MessageSentSuccessfullyPage } from '../messageSentSuccessfully/messageSentSuccessfully';
import { GoogleAnalyticsProvider } from '../../providers/google-analytics/google-analytics';

@Component({
  selector: 'page-createFeeds',
  templateUrl: 'createFeeds.html',
  providers: [UtilMethods, srviceMethodsCall, NativeStorage, Keyboard, SQLite, Camera, Transfer, File]
})
export class CreateFeedsPage {
  @ViewChild(Navbar) navbar: Navbar;

  public foundRepos: any;
  public feedForm: FormGroup;
  public feed;
  public title;
  public deviceHeight: any = 0;
  public items: any;
  public members = [];
  public showMembers = false;
  public feedText = "";
  public searchStr = "";
  public mentionUsers = [];
  public classnameForFooter = '';
  public userId: any;
  public base64Image = "";
  public feedS3FileUrl = "";
  public postButtonEnable = false;
  public imageHeight: any;
  private showOverlay = false;
  public showMentions = false;
  public mentionMembers = [];
  public actionSheet: any;
  public event: any;
  public oldFeedTextValue = "";
  public apiInProgress = false;
  public placeHolderText = "What do you want to share with your colleagues?";
  public feedTitle = "";
  public isFocusOnTitleInput = false;
  public keyboardHeight = 0;
  public isIphoneX = false;
  public broadcast_start = "";
  public broadcast_end = "";
  public follow_up_start = "";
  public follow_up_end = "";


  constructor(public googleAnalytics: GoogleAnalyticsProvider, public navCtrl: NavController, private _FB: FormBuilder, public commonMethod: srviceMethodsCall, public alertCtrl: AlertController, public nativeStorage: NativeStorage, public keyboard: Keyboard, public platform: Platform, public zone: NgZone, private sqlite: SQLite, private camera: Camera, private transfer: Transfer, private file: File, public actionSheetCtrl: ActionSheetController, public events: Events, public utilMethods: UtilMethods, public modalCtrl: ModalController, private viewCtrl: ViewController) {
    // this.zone.run(() => {
    //   this.feedText="";
    //   this.postButtonEnable = false;
    // });
    this.keyboard.disableScroll(true);
    this.getAllMembersFromDb();

    platform.ready().then((readySource) => {
      console.log('Width: ' + platform.width());
      console.log('Height: ' + platform.height());
      this.zone.run(() => {
        this.deviceHeight = (platform.height() - 150);
      });
    });

    this.keyboard.onKeyboardShow().subscribe(data => {
      console.log('keyboard is shown');
      this.feedText = this.feedText;
      this.showOverlay = false;
      //console.log("keyboardHeight+234 = "+parseInt(data.keyboardHeight)+parseInt('234'));
      //console.log("platform.height() = "+data.keyboardHeight+234);
      //alert(data.keyboardHeight);
      //this.classnameForFooter = "closeKeyboard";
      this.zone.run(() => {
        if (data.keyboardHeight > 230) {
          this.classnameForFooter = "openKeyboardWithSpellCheck";
        } else {
          this.classnameForFooter = "openKeyboard";
        }
        this.deviceHeight = (platform.height() - (parseInt(data.keyboardHeight) + parseInt('234')));
        console.log("deviceHeight = " + this.deviceHeight);

      });
    });

    this.keyboard.onKeyboardHide().subscribe(data => {
      console.log('keyboard is hiode');
      this.events.publish('hide:keyboard');
      //this.classnameForFooter = "openKeyboard";
      this.zone.run(() => {
        this.deviceHeight = (platform.height() - 150);
        this.classnameForFooter = "closeKeyboard";
      });
    });


    this.feedForm = _FB.group({
      feed: Validator.feedCreateValidator,
      title: ''
    });
    this.feed = this.feedForm.controls['feed'];
    this.title = this.feedForm.controls['title'];
  }
  onKey(event: any) { // without type info
    //this.values += event.target.value + ' | ';
    if (event.target.value.trim().length > 0) {
      this.zone.run(() => {
        this.postButtonEnable = true;
      });
    } else {
      this.zone.run(() => {
        this.postButtonEnable = false;
      });
    }
  }

  postFeedOnServer(formData) {

    this.apiInProgress = true;
    //let feedData = formData.feed.trim().replace(/\r?\n/g, '<br />');
    let feedData = formData.feed.trim();
    //feedData = this.commonMethod.replaceURLWithHTMLLinks(feedData);

    let mentionId = [];
    if (this.mentionUsers.length > 0) {
      for (let i = 0; i < this.mentionUsers.length; i++) {
        let obj = { id: this.mentionUsers[i].id + '', type: this.mentionUsers[i].type }
        mentionId.push(obj);
        // feedData = feedData.replace("@"+this.mentionUsers[i].name,'');

        let mention_user_id = this.mentionUsers[i].id;
        this.commonMethod.updateMentionsDb(mention_user_id, 'post', 1);
      }
    }

    let width = 0;
    let height = 0;
    if (this.base64Image != "") {
      let myBase64 = this.base64Image;
      var img = new Image();
      img.src = myBase64;
      width = img.width;
      height = img.height;
    }

    this.feedTitle = this.feedTitle.trim().toUpperCase();
    this.feedTitle = this.utilMethods.nlToBr(this.feedTitle);
    feedData = this.utilMethods.nlToBr(feedData);
    let objData = {
      'feed':
      {
        title: this.feedTitle,
        body: feedData,
        image_url: this.feedS3FileUrl,
        image_width: width,
        image_height: height,
        mentioned_targets: mentionId,
        local_time: new Date() + "",
        broadcast_start: this.broadcast_start,
        broadcast_end: this.broadcast_start,
        follow_up_start: this.follow_up_start,
        follow_up_end: this.follow_up_end
      }
    };

    let alertVar = this.alertCtrl.create({
      title: 'Error!',
      subTitle: 'Invalid Details!',
      buttons: ['OK']
    });


    this.nativeStorage.getItem('user_auth').then(
      accessToken => {

        if (this.commonMethod.checkNetwork()) {

          this.commonMethod.postDataWithoutLoder(createFeedUrl, objData, accessToken).subscribe(
            data => {
              this.feedTitle = "";
              this.foundRepos = data.json();
              console.error(this.foundRepos);
              this.googleAnalytics.trackPostEvents(GoogleAnalyticsProvider.ACTION_POST_CREATE, "Post/Feed is created")
              this.successMessage();
              this.apiInProgress = false;
              this.zone.run(() => {
                this.postButtonEnable = false;
              });
            },
            err => {
              this.apiInProgress = false;
              alertVar.present();
              console.error("Error : " + err);
            },
            () => {
              console.log('getData completed');
            }
          );

        }
        else {
          this.apiInProgress = false;
          this.commonMethod.showNetworkError();
        }


      },
      error => {
        return '';
      }
    );

  }

  ionViewDidEnter() {
    this.nativeStorage.setItem('lastPage', { "pageName": CreateFeedsPage.name, "index": this.navCtrl.getActive().index });
    this.zone.run(() => {
      this.feedText = "";
      this.postButtonEnable = false;
      this.getMentionable()
    });
    // this.navbar.backButtonClick = () => {
    //   ///here you can do wathever you want to replace the backbutton event

    // }
    // this.navbar.backButtonClick = (e: UIEvent) => {
    //   // Print this event to the console
    //   console.log(e);
    //   this.isKeyboardOpen=false;
    //   // Navigate to another page
    //   this.keyboard.close();
    //   this.navCtrl.setRoot(FeedsPage);

    this.navbar.backButtonClick = (e: UIEvent) => {
      // Print this event to the console
      console.log(e);

      this.events.publish('hide:keyboard');

      this.keyboard.close();
      setTimeout(() => {
        this.navCtrl.setRoot(FeedsPage);
      },
        100);

    }
  }


  getMentionable() {
    this.nativeStorage.getItem('mentionable')
      .then((data) => {
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
          for (let i = 0; i < data.users.length; i++) {
            let tempUserInfo = {
              "id": data.users[i].id,
              "name": data.users[i].name,
              "type": 'User',
              "image": 'https://vertua.com.ph/wp-content/uploads/2015/03/avatar.png',
              // "total": allMembers.rows.item(i).total
            };

            this.members.push(tempUserInfo);
          }
          this.mentionMembers = this.members
          console.log(data)
        } else {
          this.getMentionableFromServer()
        }
      }).catch((err) => {
        this.getMentionableFromServer()
      })
    // this.nativeStorage.getItem('user_auth').then(
    //   accessToken => {

    //     if (this.commonMethod.checkNetwork()) {

    //       this.commonMethod.getDataWithoutLoder(getMentionables, accessToken).subscribe(
    //         data => {
    //           let foundRepos = data.json();

    //           for (let i = 0; i < foundRepos.departments.length; i++) {
    //             let tempUserInfo = {
    //               "id": foundRepos.departments[i].id,
    //               "name": foundRepos.departments[i].name.toUpperCase(),
    //               "type": 'Department',
    //               "image": 'https://vertua.com.ph/wp-content/uploads/2015/03/avatar.png',
    //               // "total": allMembers.rows.item(i).total
    //             };

    //             this.members.push(tempUserInfo);
    //           }
    //           for (let i = 0; i < foundRepos.users.length; i++) {
    //             let tempUserInfo = {
    //               "id": foundRepos.users[i].id,
    //               "name": foundRepos.users[i].name,
    //               "type": 'User',
    //               "image": 'https://vertua.com.ph/wp-content/uploads/2015/03/avatar.png',
    //               // "total": allMembers.rows.item(i).total
    //             };

    //             this.members.push(tempUserInfo);
    //           }
    //           this.mentionMembers = this.members
    //           console.log(foundRepos)
    //         }, err => {
    //           this.apiInProgress = false;
    //           // alertVar.present();
    //           console.error("Error : " + err);
    //         },
    //         () => {
    //           console.log('getData completed');
    //         })
    //     }
    //   })
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
                  // "total": allMembers.rows.item(i).total
                };

                this.members.push(tempUserInfo);
              }
              for (let i = 0; i < foundRepos.users.length; i++) {
                let tempUserInfo = {
                  "id": foundRepos.users[i].id,
                  "name": foundRepos.users[i].name,
                  "type": 'User',
                  "image": 'https://vertua.com.ph/wp-content/uploads/2015/03/avatar.png',
                  // "total": allMembers.rows.item(i).total
                };

                this.members.push(tempUserInfo);
              }
              this.mentionMembers = this.members
              console.log(foundRepos)
            }, err => {
              this.apiInProgress = false;
              // alertVar.present();
              console.error("Error : " + err);
            },
            () => {
              console.log('getData completed');
            })
        }
      })
  }

  getdeviceheight() {
    this.zone.run(() => {
      return this.deviceHeight;
    });
  }
  hideOverlay() {
    this.showOverlay = false;
  }
  closekeyboard() {
    this.classnameForFooter = "closeKeyboard";
    this.showOverlay = false;
    this.events.publish('hide:keyboard');
    this.keyboard.close();
  }
  toggleKeyboard() {
    if (this.classnameForFooter == "openKeyboard" || this.classnameForFooter == "openKeyboardWithSpellCheck") {
      this.classnameForFooter = "closeKeyboard";
      this.events.publish('hide:keyboard');
      this.keyboard.close();
    } else {
      this.classnameForFooter = "openKeyboard";
      this.keyboard.show();
    }
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

    if (this.showMentions == true && this.feedText != "") {
      let strArray = this.feedText.trim().split(" ");
      // Display array values on page
      for (var i = 0; i < strArray.length; i++) {
        if (strArray[i].charAt(0) == "@" && strArray.length == (i + 1)) {
          //this.zone.run(() => {
          this.feedText = this.removeLastInstance(strArray[i], this.feedText);
          /* this is only for android */
          if (this.feedText.trim() == "") {
            this.feedText = this.feedText.trim();
          }
          //console.log("2="+this.feedText);
          this.feedText = this.feedText + "@" + memberInfo.name + " ";
          mentionAdded = false;
        }
      }
    }
    if (this.mentionUsers.length > 0) {
      let insertFlag = true;
      for (let i = 0; i < this.mentionUsers.length; i++) {
        if (this.mentionUsers[i].id == memberInfo.id && add != true) {

          let removeStr = "@" + this.mentionUsers[i].name + " ";
          console.log(this.feedText + "  " + this.mentionUsers[i].name + " removeStr" + removeStr);

          this.zone.run(() => {
            console.log(this.feedText + "  " + this.mentionUsers[i].name + " removeStr" + removeStr);
            this.feedText = this.feedText.replace(new RegExp(this.escapeRegExp(removeStr), 'g'), '');
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
            if (this.feedText && this.feedText.length > 0 && !this.feedText.endsWith(' ')) {
              this.feedText = this.feedText + " "
            }
            this.feedText = this.feedText + "@" + memberInfo.name + " ";
          });
        }
      }
    }
    else {
      this.mentionUsers.push(memberInfo);
      if (mentionAdded) {
        this.zone.run(() => {
          if (this.feedText && this.feedText.length > 0 && !this.feedText.endsWith(' ')) {
            this.feedText = this.feedText + " "
          }
          this.feedText = this.feedText + "@" + memberInfo.name + " ";
        });
      }
    }

    this.showMentions = false;
    if (e != undefined) {
      e.preventDefault();
    }
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

                // this.members.push(tempUserInfo);
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

  showGalleryPrompt() {

    this.keyboard.close();
    this.events.publish('hide:keyboard');

    this.actionSheet = this.actionSheetCtrl.create({
      title: '',
      buttons: [
        {
          text: 'Gallery',
          icon: 'ios-image',
          handler: () => {
            console.log('Gallery clicked');
            this.accessGallery();
          }
        }, {
          text: 'Camera',
          icon: 'ios-camera',
          handler: () => {
            console.log('Camera clicked');
            this.openCamera();
          }
        }, {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            console.log('Cancel clicked');
          }
        }
      ]
    });
    this.actionSheet.present();
  }

  accessGallery() {
    this.keyboard.close();
    this.events.publish('hide:keyboard');

    this.showOverlay = false;
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
      this.base64Image = imageData;
      this.imageHeight = 200;
      //this.uploadImageOnAws(imageData);
    }, (err) => {
      console.log(err);
    });
  }

  openCamera() {
    this.keyboard.close();
    this.events.publish('hide:keyboard');

    this.showOverlay = false;
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
      this.base64Image = imageData;
      this.imageHeight = 200;
      //this.uploadImageOnAws(imageData);
    }, (err) => {
      // Handle error
    });

  }

  createFeedPost(formData) {
    this.apiInProgress = true;

    if (this.base64Image != "") {
      let commonMethod = this.commonMethod;
      let transfer = this.transfer;
      let time = new Date().getTime();
      var imageName = this.userId + "_" + time + "_" + this.base64Image.substr(this.base64Image.lastIndexOf('/') + 1);

      let alertVar = this.alertCtrl.create({
        title: 'Error!',
        subTitle: 'Invalid Details!',
        buttons: ['OK']
      });

      let queryStr = "?objectName=" + imageName + "&contentType=image/jpeg&uploadType=photo";
      this.nativeStorage.getItem('user_auth').then(
        accessToken => {

          if (this.commonMethod.checkNetwork()) {

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
                fileTransfer.upload(this.base64Image, url, options).then((data) => {
                  // success
                  console.log("tt1" + JSON.stringify(data));
                  console.log(s3FileUrl);
                  this.feedS3FileUrl = s3FileUrl;
                  //commonMethod.hideLoader();
                  this.postFeedOnServer(formData);

                }, (err) => {
                  // error
                  console.log("tt=" + JSON.stringify(err));
                  this.apiInProgress = false;
                  //commonMethod.hideLoader();
                });


              },
              err => {
                this.apiInProgress = false;
                alertVar.present();
                console.error("Error : " + err);
              },
              () => {
                console.log('getData completed');
              }
            );

          }
          else {
            this.apiInProgress = false;
            this.commonMethod.showNetworkError();
          }

        },
        error => {
          return '';
        }
      );
    }
    else {
      this.feedS3FileUrl = "";
      this.postFeedOnServer(formData);
    }


  }

  removeImage() {
    this.base64Image = "";
    // this.imageHeight = 0;
  }

  selectAllMention(e, flag) {
    if (flag) {
      this.mentionUsers = [];

      for (let i = 0; i < this.members.length; i++) {
        console.log("select all");
        if (this.members[i].id != this.userId && this.members[i].is_system_user != 1) {
          this.mentionUsers.push(this.members[i]);
          if (this.feedText.indexOf("@" + this.members[i].name) == -1) {
            this.zone.run(() => {
              this.feedText = this.feedText + "@" + this.members[i].name + " ";
            });
          }
        }
      }
    } else {
      for (let i = 0; i < this.mentionUsers.length; i++) {

        let removeStr = "@" + this.mentionUsers[i].name + " ";
        console.log(this.feedText + "  " + this.mentionUsers[i].name + " removeStr" + removeStr);

        this.zone.run(() => {
          console.log(this.feedText + "  " + this.mentionUsers[i].name + " removeStr" + removeStr);
          this.feedText = this.feedText.replace(new RegExp(this.escapeRegExp(removeStr), 'g'), '');
        });
      }
      this.mentionUsers = [];
    }
    e.preventDefault();
  }

  shoOverlay() {
    this.showOverlay = true;
    this.classnameForFooter = "closeKeyboard";
    this.keyboard.close();
  }

  ionViewWillLeave() {
    console.log("Looks like I'm about to leave :(");
    this.closekeyboard();
  }

  updateValue(event: Event): void {
    const value: string = (<HTMLSelectElement>event.srcElement).value;
    this.zone.run(() => {
      this.feedText = value;
    });
  }

  changeModelValue() {
    this.zone.run(() => {
      this.feedText = this.feedText;
      this.mentionMembers = this.members;
    });
  }

  // getKeyCode(str) {
  //   return str.charCodeAt(str.length);
  // }

  keyDownCheck(e) {
    this.oldFeedTextValue = this.feedText;
    console.log("11ketdown" + this.feedText);
  }

  valchange(e) {
    console.log("11ketupn" + this.feedText);
    if (this.oldFeedTextValue.length > this.feedText.length) {
      console.log("back pressed");
    }

    //let charKeyCode = this.getKeyCode(this.feedText.trim());

    //let keyCode = e.which || e.keyCode;
    // console.log("==" + e.key);
    // console.log("=="+e.keyCode);
    // console.log("==" + JSON.stringify(e));
    // console.log("-----"+keyCode);
    // console.log("hjhjhjhjhjhjhjh"+charKeyCode);



    //if (e.key != "Backspace") {   // only for ios
    if (!(this.oldFeedTextValue.length > this.feedText.length))   // only for android
    {
      this.zone.run(() => {
        if (this.feedText && this.feedText != "") {
          let strArray = this.feedText.trim().split(" ");
          // Display array values on page
          for (var i = 0; i < strArray.length; i++) {
            if (strArray[i].charAt(0) == "@" && strArray.length == (i + 1)) {
              this.showMentions = true;
              let val = strArray[i].toString().substr(1);
              if (val.trim() != "") {
                let tempMentions = [];
                for (let l = 0; l < this.members.length; l++) {
                  console.log("val change" + this.members + " " + this.members[i]);
                  let tempUserName = this.members[l].name.toLowerCase().split(" ");
                  if (this.members[l] != undefined && this.members[l].id != this.userId && tempUserName[0] == val.toLowerCase()) {
                    //this.showMentions=false;
                    this.selectUser('', this.members[l], true);
                  }
                  else if (this.members[l] != undefined && this.members[l].id != this.userId && this.members[l].name.toLowerCase().search(val.toLowerCase()) > -1) {
                    tempMentions.push(this.members[l]);
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
              }
            });
        }, 2000);
      });
    });
  }


  createBroadcast() {
    let modal = this.modalCtrl.create(createBroadcastPage, { broadcast_start: this.broadcast_start, broadcast_end: this.broadcast_end });
    modal.onDidDismiss(data => {
      if (data && data.broadcast_start != "" && data.broadcast_end != "") {
        this.broadcast_start = data.broadcast_start;
        this.broadcast_end = data.broadcast_end;
      }
    });
    modal.present();
  }

  createFollowUp() {
    let modal = this.modalCtrl.create(createFollowUpPage, { follow_up_start: this.follow_up_start, follow_up_end: this.follow_up_end });
    modal.onDidDismiss(data => {
      if (data && data.follow_up_start != "" && data.follow_up_end != "") {
        this.follow_up_start = data.follow_up_start;
        this.follow_up_end = data.follow_up_end;
      }
    });
    modal.present();
  }

  successMessage() {
    // let modal = this.modalCtrl.create(FeedCreatedSuccessfullyPage);
    let modal = this.modalCtrl.create(MessageSentSuccessfullyPage, {
      message: 'Log post saved successfully!',
      navigationMessage: 'You will be taken to Hotel Log in ',
      buttonText: 'CREATE ANOTHER POST'
    });
    modal.onDidDismiss(data => {
      this.closekeyboard();
      if (data.redirect) {
        this.navCtrl.setRoot(FeedsPage);
      } else {
        this.navCtrl.push(CreateFeedsPage).then(() => {
          // first we find the index of the current view controller:
          const index = this.viewCtrl.index;
          // then we remove it from the navigation stack
          this.navCtrl.remove(index);
        });
      }
    });
    modal.present();
  }

}

import { Component, NgZone, ViewChild, ElementRef, Input, Injectable } from '@angular/core';
import { ViewController, NavController, AlertController, ModalController, Events, ActionSheetController, Platform, FabContainer } from 'ionic-angular';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Http, Headers, RequestOptions } from '@angular/http';
import { Validator } from '../../validator';
import { srviceMethodsCall } from '../../services/serviceMethods';
import { getProfileUrl } from '../../services/configURLs';
import { NativeStorage } from '@ionic-native/native-storage';
import { Transfer, FileUploadOptions, TransferObject } from '@ionic-native/transfer';
import { File } from '@ionic-native/file';
import { ChattingPage } from '../chatting/chatting';
import { MyMentionPage } from '../myMention/myMention';
import { FeedsPage } from '../feeds/feeds';
import { Keyboard } from '@ionic-native/keyboard';
import { ChangePasswordPage } from '../changePassword/changePassword';
import { WorkOrderPage } from '../workOrder/workOrder';
import { updateProfileUrl } from '../../services/configURLs';
import { Camera, CameraOptions } from '@ionic-native/camera';
import { getAwsSignedUrl } from '../../services/configURLs';
import { getRolesAndDepartmentsUrl } from '../../services/configURLs';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { viewWorkOrderUrl } from '../../services/configURLs';
import { NotificationSettingsPage } from '../notificationSettings/notificationSettings';
import { TaskChecklistPage } from '../taskChecklist/taskChecklist';
import { SendMessagePage } from '../sendMessage/sendMessage';
import { CreateWorkOrderPage } from '../createWorkOrder/createWorkOrder';
import { CreateFeedsPage } from '../createFeeds/createFeeds';

// interface Window {
//   webkitURL: any;
// }
// declare var window: Window;

//import Buffer from 'buffer';
//import { AWS } from 'aws-sdk/dist/aws-sdk';
import 'aws-sdk/dist/aws-sdk';
const AWS = (<any>window).AWS;
//import S3 from 'aws-sdk/clients/s3';
import awsConfig from 'aws-config';
import 'rxjs/Rx';
import {
  WORKER_RENDER_APP,
  WORKER_RENDER_PLATFORM,
  WORKER_SCRIPT
} from '@angular';
import { GoogleAnalyticsProvider } from '../../providers/google-analytics/google-analytics';


@Component({
  selector: 'page-profile',
  templateUrl: 'profile.html',
  providers: [srviceMethodsCall, NativeStorage, Keyboard, Camera, Transfer, File, InAppBrowser, FabContainer]
})
export class ProfilePage {

  public profileForm: FormGroup;
  public userData: any;
  public email;
  public name;
  myfile: any;
  file: any;
  public params: any;
  public imageUrl: any;
  public pushRegistrationId: any;
  public userId = "";
  public projectBaseUrl: string;
  public allowEdit = true;
  public base64Image = "";
  public department_ids = [];
  public rolesData = [];
  public departmentsData = [];
  public mask = ['(', /[1-9]/, /\d/, /\d/, ')', ' ', /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/];
  public viewWOUrl = "";
  public feedNotificationCount = 0;
  public messagesNotificationCount = 0;
  public woNotificationCount = 0;
  public interval: any;
  public userPermissions: any;
  public actionSheet: any;
  public spinner = false;
  public updateApiInProgress = false;
  fabButtonOpened = false;

  constructor(public googleAnalytics: GoogleAnalyticsProvider, public platform: Platform, public navCtrl: NavController, private _FB: FormBuilder, public commonMethod: srviceMethodsCall, public alertCtrl: AlertController, public nativeStorage: NativeStorage, private http: Http, public zone: NgZone, public modalCtrl: ModalController, private keyboard: Keyboard, public events: Events, private camera: Camera, private transfer: Transfer, public actionSheetCtrl: ActionSheetController, private iab: InAppBrowser, private viewCtrl: ViewController, public fabContainer: FabContainer) {

    this.viewWOUrl = viewWorkOrderUrl;
    //To do Need to remove
    //this.projectBaseUrl = baseUrl;
    this.projectBaseUrl = "http://dev.lodgistics.com";

    this.userData = {
      "id": "",
      "name": "",
      "email": "",
      "title": "",
      "username": "",
      "phone_number": "",
      "departments": [{
        "id": "",
        "name": ""
      }
      ],
      "avatar_img_url": "",
      "role": "",
      "role_id": ""
    };

    //this.masks = {
    //phoneNumber: ['(', /[1-9]/, /\d/, /\d/, ')', ' ', /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/],
    //cardNumber: [/\d/, /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/],
    //cardExpiry: [/[0-1]/, /\d/, '/', /[1-2]/, /\d/],
    //orderCode: [/[a-zA-z]/, ':', /\d/, /\d/, /\d/, /\d/]
    //};

    this.userPermissions = {
      "wo_access": {
        "team": false,
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

    let alertVar = this.alertCtrl.create({
      title: 'Error!',
      subTitle: 'Invalid Details!',
      buttons: ['OK']
    });


    this.nativeStorage.getItem('device_token').then(
      data => { console.log(data); this.pushRegistrationId = data.tokenId; },
      error => { console.error(error); }
    );

    this.nativeStorage.getItem('user_auth').then(
      accessToken => {
        this.userId = accessToken.user_id;

        if (this.commonMethod.checkNetwork()) {

          this.spinner = true;
          this.commonMethod.getDataWithoutLoder(getProfileUrl + "/" + this.userId, accessToken).subscribe(
            data => {
              this.userData = data.json();

              if (this.userData.departments.length > 0) {
                for (let i = 0; i < this.userData.departments.length; i++) {
                  this.department_ids.push(this.userData.departments[i].id);
                }
              }
              this.getRolesAndDepartmentsData();
              //alert(this.userData); 
              this.spinner = false;
            },
            err => {
              //this.commonMethod.hideLoader();
              this.spinner = false;
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
          this.commonMethod.showNetworkError();
        }

      },
      error => {
        return '';
      }
    );

  }

  ionViewDidEnter() {
    this.nativeStorage.setItem('lastPage', { "pageName": ProfilePage.name, "index": this.navCtrl.getActive().index });
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

  closekeyboard() {
    this.events.publish('hide:keyboard');
    this.keyboard.close();
  }

  changePassword() {
    let modal = this.modalCtrl.create(ChangePasswordPage);
    modal.onDidDismiss(data => {
      this.closekeyboard();
    });
    modal.present();
  }

  edit() {
    //this.getRolesAndDepartmentsData();
    this.allowEdit = true;
  }

  save() {

    this.userData.phone_number = this.userData.phone_number.replace(/\D+/g, '');
    //this.allowEdit=false;
    let alertVar = this.alertCtrl.create({
      title: 'Error!',
      subTitle: 'Invalid Details!',
      buttons: ['OK']
    });

    this.nativeStorage.getItem('user_auth').then(
      accessToken => {

        if (this.commonMethod.checkNetwork()) {

          if (this.base64Image != "") {
            this.userData.avatar_img_url = this.base64Image;
          }

          let objData = { id: this.userId, 'user': { 'name': this.userData.name.trim(), 'email': this.userData.email.trim(), 'title': this.userData.title.trim(), 'phone_number': this.userData.phone_number.trim(), 'avatar_img_url': this.userData.avatar_img_url.trim(), 'department_ids': this.department_ids, 'role_id': this.userData.role_id } };

          this.updateApiInProgress = true;
          this.commonMethod.putDataWithoutLoder(updateProfileUrl + "/" + this.userId, objData, accessToken).subscribe(
            data => {
              let foundRepos = data.json();
              console.error(foundRepos);
              this.updateApiInProgress = false;
              //this.navCtrl.push(this.navCtrl.getActive().component);

              this.navCtrl.push(this.navCtrl.getActive().component).then(() => {
                // first we find the index of the current view controller:
                const index = this.viewCtrl.index;
                // then we remove it from the navigation stack
                this.navCtrl.remove(index);
              });


            },
            err => {
              this.updateApiInProgress = false;
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

  showGalleryPrompt() {
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
    this.camera.getPicture({
      quality: 100
      , destinationType: this.camera.DestinationType.FILE_URI
      , sourceType: this.camera.PictureSourceType.PHOTOLIBRARY
      , encodingType: this.camera.EncodingType.JPEG
      , mediaType: this.camera.MediaType.PICTURE
      , targetWidth: 800 //what widht you want after capaturing
      , targetHeight: 800
    }).then((imageData) => {
      //this.base64Image = imageData;
      imageData = imageData.substring(0, imageData.indexOf('?'));

      this.uploadImageOnAws(imageData);
    }, (err) => {
      console.log(err);
    });
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
      //this.base64Image = imageData;
      this.uploadImageOnAws(imageData);
    }, (err) => {
      // Handle error
    });

  }

  uploadImageOnAws(imageData) {
    let commonMethod = this.commonMethod;
    let transfer = this.transfer;
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
                this.base64Image = s3FileUrl;
                this.allowEdit = true;
                commonMethod.hideLoader();
                /*  code for work order */

              }, (err) => {
                // error
                console.log("tt=" + JSON.stringify(err));
                commonMethod.hideLoader();
              });


            },
            err => {
              commonMethod.hideLoader();
              alertVar.present();
              console.error("Error : " + err);
            },
            () => {
              console.log('getData completed');
            }
          );

        }
        else {
          commonMethod.hideLoader();
          this.commonMethod.showNetworkError();
        }

      },
      error => {
        return '';
      }
    );


  }

  getRolesAndDepartmentsData() {
    let alertVar = this.alertCtrl.create({
      title: 'Error!',
      subTitle: 'Invalid Details!',
      buttons: ['OK']
    });

    this.nativeStorage.getItem('user_auth').then(
      accessToken => {
        this.userId = accessToken.user_id;

        if (this.commonMethod.checkNetwork()) {

          this.commonMethod.getDataWithoutLoder(getRolesAndDepartmentsUrl + "/" + this.userId + "/roles_and_departments", accessToken).subscribe(
            data => {
              let res = data.json();
              this.rolesData = res.roles;
              this.departmentsData = res.departments;
              //alert(this.userData); 
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

  notificationSettings() {
    let modal = this.modalCtrl.create(NotificationSettingsPage);
    modal.onDidDismiss(data => {
      this.closekeyboard();
    });
    modal.present();
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

  createFeedQuick(fab?: FabContainer) {
    if (fab !== undefined) {
      fab.close();
    }
    this.fabButtonOpened = false;
    this.googleAnalytics.fabButtonClick('Create New Post')
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

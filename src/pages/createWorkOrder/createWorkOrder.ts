import { Component, NgZone } from '@angular/core';
import { NavController, AlertController, Platform, ModalController, NavParams, ViewController, Events, ActionSheetController } from 'ionic-angular';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Validator } from '../../validator';
import { srviceMethodsCall } from '../../services/serviceMethods';
import { baseUrl, closeWoUrl } from '../../services/configURLs';
import { Keyboard } from '@ionic-native/keyboard';
import { Camera, CameraOptions } from '@ionic-native/camera';
import { Transfer, FileUploadOptions, TransferObject } from '@ionic-native/transfer';
import { File } from '@ionic-native/file';
import { NativeStorage } from '@ionic-native/native-storage';
import { getAwsSignedUrl } from '../../services/configURLs';
import { createFeedWorkOrderUrl } from '../../services/configURLs';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { locationsUrl } from '../../services/configURLs';
import { createMessageWorkOrderUrl } from '../../services/configURLs';
import { getRoomCheckListItemsUrl } from '../../services/configURLs';
import { getPublicAreaCheckListItemsUrl } from '../../services/configURLs';
import { getWoDataUrl } from '../../services/configURLs';
import { updateWoDataUrl } from '../../services/configURLs';
import { createWorkOrderUrl, getAssignableUsersUrl } from '../../services/configURLs';

@Component({
  selector: 'page-createWorkOrder',
  templateUrl: 'createWorkOrder.html',
  providers: [srviceMethodsCall, Keyboard, Camera, Transfer, File, NativeStorage, SQLite]
})

export class CreateWorkOrderPage {

  public projectBaseUrl: string;
  public showSub;
  public hideSub;
  public id: any;
  public value: any;
  public workOrderData: any;
  public base64Image: any;
  public userId: any;
  public img = [];
  public locationType: any;
  public room: any;
  public publicArea: any;
  public equipment: any;
  public imageFromParent = "";
  public minDate: any;
  public maxDate: any;
  public members = [];
  public mentioned_user_ids: any;
  public pageName = 'feed';
  public roomCheckListItems = [];
  public publicAreaCheckListItems = [];
  public userPermissions: any;
  public wo_no = "";
  public room_id = "";
  public maintenance_checklist_item_id = "";
  public selectOptions: any;

  private tempWorkOrderStatus: string;

  constructor(public platform: Platform, public params: NavParams, private keyboard: Keyboard, public viewCtrl: ViewController, public zone: NgZone, modalCtrl: ModalController, public commonMethod: srviceMethodsCall, public events: Events, private camera: Camera, private transfer: Transfer, private file: File, public actionSheetCtrl: ActionSheetController, public alertCtrl: AlertController, public nativeStorage: NativeStorage, private sqlite: SQLite) {

    this.selectOptions = {
      cssClass: 'select-drop-down'
    };

    this.mentioned_user_ids = this.params.get("mentioned_user_ids");
    //this.getAllMembersFromDb();
    this.getAssignableUsers();

    this.keyboard.disableScroll(true);
    this.userPermissions = { "wo_access": { "priority": false, "status": false, "due_to_date": false, "assigned_to_id": false, "assignable": false, "view_all": false, "view_department": false, "view_own": false, "view_assigned_to": false, "view_listing": false, "can_create": false, "team": true, "can_delete": false, "can_edit": false } };

    this.commonMethod.getUserPermissions().then(
      permissions => {
        this.userPermissions = permissions;
      },
      error => {
        return false;
      }
    );

    this.platform.ready().then(() => {

      this.nativeStorage.getItem('wo_data').then(
        data => {
          console.log(data);
          this.locationType = data.locationType;
          this.room = data.room;
          this.publicArea = data.publicArea;
          this.equipment = data.equipment;
          this.processData();
        },
        error => {
          console.error(error);
          //this.locationType = [{name:"Room",value:"Maintenance::Room"},{name:"PublicArea",value:"Maintenance::PublicArea"},{name:"Equipment",value:"Maintenance::Equipment"}];
          //this.room=[{'id':1436,'room_number':"100",'property_id':33,'floor':1,'user_id':198,'created_at':"Wed, 13Sep201710: 13: 47EDT-04: 00",'updated_at':"Wed, 13Sep201710: 13: 47EDT-04: 00"},{'id':1437,'room_number':"101",'property_id':33,'floor':1,'user_id':198,'created_at':"Wed, 13Sep201710: 13: 47EDT-04: 00",'updated_at':"Wed, 13Sep201710: 13: 47EDT-04: 00"},{'id':1438,'room_number':"102",'property_id':33,'floor':1,'user_id':198,'created_at':"Wed, 13Sep201710: 13: 47EDT-04: 00",'updated_at':"Wed, 13Sep201710: 13: 47EDT-04: 00"},{'id':1439,'room_number':"103",'property_id':33,'floor':1,'user_id':198,'created_at':"Wed, 13Sep201710: 13: 47EDT-04: 00",'updated_at':"Wed, 13Sep201710: 13: 47EDT-04: 00"},{'id':1440,'room_number':"104",'property_id':33,'floor':1,'user_id':198,'created_at':"Wed, 13Sep201710: 13: 47EDT-04: 00",'updated_at':"Wed, 13Sep201710: 13: 47EDT-04: 00"},{'id':1441,'room_number':"105",'property_id':33,'floor':1,'user_id':198,'created_at':"Wed,     13Sep201710: 13: 47EDT-04: 00",'updated_at':"Wed, 13Sep201710: 13: 47EDT-04: 00"},{'id':1442,'room_number':"200",'property_id':33,'floor':2,'user_id':198,'created_at':"Wed,     13Sep201710: 13: 47EDT-04: 00",'updated_at':"Wed,     13Sep201710: 13: 47EDT-04: 00"},{'id':1443,'room_number':"201",'property_id':33,'floor':2,'user_id':198,'created_at':"Wed, 13Sep201710: 13: 47EDT-04: 00",'updated_at':"Wed, 13Sep201710: 13: 47EDT-04: 00"},{'id':1444,'room_number':"202",'property_id':33,'floor':2,'user_id':198,'created_at':"Wed, 13Sep201710: 13: 47EDT-04: 00",'updated_at':"Wed, 13Sep201710: 13: 47EDT-04: 00"},{'id':1445,'room_number':"203",'property_id':33,'floor':2,'user_id':198,'created_at':"Wed, 13Sep201710: 13: 47EDT-04: 00",'updated_at':"Wed, 13Sep201710: 13: 47EDT-04: 00"},{'id':1446,'room_number':"204",'property_id':33,'floor':2,'user_id':198,'created_at':"Wed, 13Sep201710: 13: 47EDT-04: 00",'updated_at':"Wed, 13Sep201710: 13: 47EDT-04: 00"},{'id':1447,'room_number':"205",'property_id':33,'floor':2,'user_id':198,'created_at':"Wed, 13Sep201710: 13: 47EDT-04: 00",'updated_at':"Wed, 13Sep201710: 13: 47EDT-04: 00"}];
          //this.publicArea=[{'id':238,'name':"EntranceDoors",'property_id':33,'user_id':198,'is_deleted':false,'created_at':"Thu, 13Apr201708: 57: 20EDT-04: 00",'updated_at':"Thu, 13Apr201708: 57: 20EDT-04: 00",'row_order':1073741823},{'id':239,'name':"MeetingRoom",'property_id':33,'user_id':198,'is_deleted':false,'created_at':"Thu, 13Apr201708: 57: 20EDT-04: 00",'updated_at':"Thu, 13Apr201708: 57: 20EDT-04: 00",'row_order':1610612735},{'id':240,'name':"LobbyArea",'property_id':33,'user_id':198,'is_deleted':false,'created_at':"Thu, 13Apr201708: 57: 21EDT-04: 00",'updated_at':"Thu, 13Apr201708: 57: 21EDT-04: 00",'row_order':1879048191},{'id':241,'name':"VendingArea",'property_id':33,'user_id':198,'is_deleted':false,'created_at':"Thu, 13Apr201708: 57: 21EDT-04: 00",'updated_at':"Thu, 13Apr201708: 57: 21EDT-04: 00",'row_order':2013265919},{'id':242,'name':"PublicRestrooms",'property_id':33,'user_id':198,'is_deleted':false,'created_at':"Thu, 13Apr201708: 57: 21EDT-04: 00",'updated_at':"Thu, 13Apr201708: 57: 21EDT-04: 00",'row_order':2080374783},{'id':243,'name':"HousePhone",'property_id':33,'user_id':198,'is_deleted':false,'created_at':"Thu, 13Apr201708: 57: 22EDT-04: 00",'updated_at':"Thu, 13Apr201708: 57: 22EDT-04: 00",'row_order':2113929215},{'id':244,'name':"GuestLaundry",'property_id':33,'user_id':198,'is_deleted':false,'created_at':"Thu, 13Apr201708: 57: 22EDT-04: 00",'updated_at':"Thu, 13Apr201708: 57: 22EDT-04: 00",'row_order':2130706431},{'id':245,'name':"Pool",'property_id':33,'user_id':198,'is_deleted':false,'created_at':"Thu, 13Apr201708: 57: 22EDT-04: 00",'updated_at':"Thu, 13Apr201708: 57: 22EDT-04: 00",'row_order':2139095039},{'id':246,'name':"Corridors/Stairwells",'property_id':33,'user_id':198,'is_deleted':false,'created_at':"Thu, 13Apr201708: 57: 22EDT-04: 00",'updated_at':"Thu, 13Apr201708: 57: 22EDT-04: 00",'row_order':2143289343}];
          //this.equipment=[{"id":138,"make":"","name":"AC Unit 1","location":"Roof 1","buy_date":"nil","replacement_date":"nil","property_id":33,"equipment_type_id":116,"instruction":"","created_at":"Tue, 19Sep201709: 23: 11EDT-04: 00","updated_at":"Tue, 19Sep201709: 23: 11EDT-04: 00","warranty":"nil","lifespan":"nil","row_order":1073741823,"deleted_at":"nil"}];      


          /* strat api call get WO locations */
          let alertVar = this.alertCtrl.create({
            title: 'Error!',
            subTitle: 'Invalid Details!',
            buttons: ['OK']
          });

          this.nativeStorage.getItem('user_auth').then(
            accessToken => {
              if (this.commonMethod.checkNetwork()) {
                this.commonMethod.getData(locationsUrl, accessToken).subscribe(
                  data => {
                    let foundRepos = data.json();
                    console.log("==" + JSON.stringify(foundRepos));

                    this.locationType = foundRepos.location_types;
                    this.room = foundRepos.Room;
                    this.publicArea = foundRepos.PublicArea;
                    this.equipment = foundRepos.Equipment;

                    this.nativeStorage.setItem('wo_data', { locationType: this.locationType, room: this.room, publicArea: this.publicArea, equipment: this.equipment })
                      .then(
                        () => { console.log('Stored wo_data!'); },
                        error => { console.error('Error storing wo_data', error); }
                      );
                    this.commonMethod.hideLoader();
                    this.processData();
                  },
                  err => {
                    this.commonMethod.hideLoader();
                    alertVar.present();
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
          /* end api call to get WO location */

        }
      );

    });

    this.maxDate = new Date().getFullYear() + 3;
    let todatDate = new Date();
    let dd = ("0" + todatDate.getDate()).slice(-2);
    let mm = ("0" + ((todatDate.getMonth()) + 1)).slice(-2); //January is 0!
    let yyyy = todatDate.getFullYear();
    this.minDate = yyyy + '-' + mm + '-' + dd;

    this.img[0] = "";
    this.img[1] = "";
    this.workOrderData = {
      descriptions: '',
      priority: 'm',
      status: 'open',
      due_to_date: '',
      assigned_to_id: '',
      maintainable_type: 'Room',
      maintainable_id: '',
      maintenance_checklist_item_id: "",
      first_img_url: "",
      second_img_url: "",
      closed: false
    };

    this.nativeStorage.getItem('user_auth').then(
      accessToken => {
        this.userId = accessToken.user_id;
      });

    this.keyboard.disableScroll(true);


    //To do Need to remove
    //this.projectBaseUrl = baseUrl;
    this.projectBaseUrl = "http://dev.lodgistics.com";

    this.showSub = this.keyboard.onKeyboardShow().subscribe(data => {
      //this.keyboard.disableScroll(true);
      console.log('keyboard is shown');
      console.log("screen height=" + data.keyboardHeight);
    });

    this.hideSub = this.keyboard.onKeyboardHide().subscribe(data => {
      console.log('keyboard is hide');
      this.events.publish('hide:keyboard');
    });

  }

  processData() {
    this.id = this.params.get('id') ? this.params.get('id') : '';
    this.workOrderData.descriptions = this.params.get('value') ? this.params.get('value') : '';
    this.imageFromParent = this.params.get('image_url') ? this.params.get('image_url') : '';
    this.pageName = this.params.get('pageName') ? this.params.get('pageName') : 'feed';
    this.wo_no = this.params.get('wo_no') ? this.params.get('wo_no') : '';
    this.room_id = this.params.get('room_id') ? this.params.get('room_id') : '';
    this.maintenance_checklist_item_id = this.params.get('maintenance_checklist_item_id') ? this.params.get('maintenance_checklist_item_id') : '';

    if (this.wo_no != "") {
      /* strat api call get WO locations */
      let alertVar = this.alertCtrl.create({
        title: 'Error!',
        subTitle: 'Invalid Details!',
        buttons: ['OK']
      });

      this.nativeStorage.getItem('user_auth').then(
        accessToken => {
          if (this.commonMethod.checkNetwork()) {
            this.commonMethod.getData(getWoDataUrl + "/" + this.wo_no, accessToken).subscribe(
              data => {
                let woData = data.json();
                this.img[0] = woData.first_img_url;
                this.img[1] = woData.second_img_url;
                this.workOrderData.descriptions = woData.description;
                this.workOrderData.priority = woData.priority;
                this.workOrderData.status = woData.status;
                this.workOrderData.due_to_date = (woData.due_to_date != null && woData.due_to_date != '') ? woData.due_to_date : '';
                this.workOrderData.assigned_to_id = woData.assigned_to_id;
                this.workOrderData.maintainable_type = woData.maintainable_type;
                this.workOrderData.maintainable_id = woData.maintainable_id;
                this.updateCheckList();
                this.workOrderData.maintenance_checklist_item_id = woData.maintenance_checklist_item_id;
                this.workOrderData.closed = woData.closed;

                // Store the initial work order status in a variable
                this.tempWorkOrderStatus = woData.status;
                //let foundRepos = data.json();
                //console.log("==" + JSON.stringify(foundRepos));

                //this.locationType = foundRepos.location_types;
                //this.room = foundRepos.Room;
                //this.publicArea = foundRepos.PublicArea;
                //this.equipment = foundRepos.Equipment;
                this.commonMethod.hideLoader();
              },
              err => {
                this.commonMethod.hideLoader();
                let res = err.json();
                if (typeof (res.error_message) !== undefined) {
                  let alertVarErr = this.alertCtrl.create({
                    title: 'Error!',
                    subTitle: res.error_message ? res.error_message : 'Invalid Details!',
                    buttons: ['OK']
                  });
                  alertVarErr.present();
                  this.dismiss()
                }
                else {
                  alertVar.present();
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
      /* end api call to get WO location */
    }
    else if (this.room_id != "" && this.room_id != "null" && this.room_id != null) {
      this.workOrderData.maintainable_type == 'Room';
      this.workOrderData.maintainable_id = this.room_id;
      this.updateCheckList();
      this.workOrderData.maintenance_checklist_item_id = this.maintenance_checklist_item_id;
    }


    if (this.imageFromParent != "") {
      this.img[0] = this.imageFromParent;
    }
  }

  dismiss() {
    this.keyboard.close();
    this.viewCtrl.dismiss('');
  }

  createWorkOrder() {
    //alert(this.workOrderData);
    //console.log(JSON.stringify(this.workOrderData));

    if (this.imageFromParent != "") {
      this.workOrderData.first_img_url = this.imageFromParent;
    }
    else if (this.img[0] != "") {
      this.workOrderData.first_img_url = this.img[0];
    }
    if (this.img[1] != "") {
      this.workOrderData.second_img_url = this.img[1];
    }

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
          let objData = {};
          if (this.workOrderData.maintainable_type == 'Equipment') {
            this.workOrderData.maintenance_checklist_item_id = "";
          }

          if (this.pageName == "feed" && this.id != "") {
            objData = { 'feed_id': this.id, 'work_order': { description: this.workOrderData.descriptions, priority: this.workOrderData.priority, status: this.workOrderData.status, assigned_to_id: this.workOrderData.assigned_to_id, maintainable_type: this.workOrderData.maintainable_type, maintainable_id: this.workOrderData.maintainable_id, maintenance_checklist_item_id: this.workOrderData.maintenance_checklist_item_id, first_img_url: this.workOrderData.first_img_url, second_img_url: this.workOrderData.second_img_url } };
            url = createFeedWorkOrderUrl + "/" + this.id + "/work_orders";
          }
          else if (this.id != "") {
            objData = { 'chat_message_id': this.id, 'work_order': { description: this.workOrderData.descriptions, priority: this.workOrderData.priority, status: this.workOrderData.status, assigned_to_id: this.workOrderData.assigned_to_id, maintainable_type: this.workOrderData.maintainable_type, maintainable_id: this.workOrderData.maintainable_id, maintenance_checklist_item_id: this.workOrderData.maintenance_checklist_item_id, first_img_url: this.workOrderData.first_img_url, second_img_url: this.workOrderData.second_img_url } };
            url = createMessageWorkOrderUrl + "/" + this.id + "/work_orders";
          }
          else {
            objData = { 'work_order': { description: this.workOrderData.descriptions, priority: this.workOrderData.priority, status: this.workOrderData.status, assigned_to_id: this.workOrderData.assigned_to_id, maintainable_type: this.workOrderData.maintainable_type, maintainable_id: this.workOrderData.maintainable_id, maintenance_checklist_item_id: this.workOrderData.maintenance_checklist_item_id, first_img_url: this.workOrderData.first_img_url, second_img_url: this.workOrderData.second_img_url } };
            url = createWorkOrderUrl;
          }

          if (this.workOrderData.due_to_date.trim() != "") {
            objData['work_order'].due_to_date = this.workOrderData.due_to_date;
          }

          this.commonMethod.postData(url, objData, accessToken).subscribe(
            data => {
              let foundRepos = data.json();
              console.log(foundRepos);
              this.commonMethod.hideLoader();
              this.viewCtrl.dismiss({ id: this.id, work_order_id: foundRepos.id, work_order_url: foundRepos.work_order_url, work_order_status: foundRepos.status });
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

  showGalleryPrompt(index) {

    let actionSheet = this.actionSheetCtrl.create({
      title: '',
      enableBackdropDismiss: false,
      buttons: [
        {
          text: 'Gallery',
          icon: 'ios-image',
          handler: () => {
            console.log('Gallery clicked');
            this.accessGallery(index);
          }
        }, {
          text: 'Camera',
          icon: 'ios-camera',
          handler: () => {
            console.log('Camera clicked');
            this.openCamera(index);
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
    actionSheet.present();
  }

  accessGallery(index) {
    this.camera.getPicture({
      quality: 50
      , destinationType: this.camera.DestinationType.FILE_URI
      , sourceType: this.camera.PictureSourceType.PHOTOLIBRARY
      , encodingType: this.camera.EncodingType.JPEG
      , mediaType: this.camera.MediaType.PICTURE
      , targetWidth: 800 //what widht you want after capaturing
      , targetHeight: 800
    }).then((imageData) => {
      //this.sendImage(imageData);
      //this.img[index]=imageData;
      imageData = imageData.substring(0, imageData.indexOf('?'));
      this.uploadImageOnAws(imageData, index);
    }, (err) => {
      console.log(err);
    });
  }

  openCamera(index) {
    const options: CameraOptions = {
      quality: 50
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
      //this.sendImage(imageData);
      //this.img[index]=imageData;
      this.uploadImageOnAws(imageData, index);
    }, (err) => {
      // Handle error
    });

  }

  uploadImageOnAws(imageData, index) {
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
                this.img[index] = s3FileUrl;
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

  removeImg(index) {
    this.img[index] = "";
    if (index == 0) {
      this.imageFromParent = "";
    }
  }

  getLabelName() {
    if (this.workOrderData.maintainable_type == "Maintenance::Room") {
      return "Room";
    } else if (this.workOrderData.maintainable_type == "Other") {
      return "Other";
    } else if (this.workOrderData.maintainable_type == "Maintenance::Equipment") {
      return "Equipment";
    } else if (this.workOrderData.maintainable_type == "Maintenance::PublicArea") {
      return "Area";
    }
    else {
      return "";
    }
  }

  // getAllMembersFromDb() {
  //   this.nativeStorage.getItem('user_auth').then(
  //     accessToken => {
  //       this.userId = accessToken.user_id;

  //       this.sqlite.create({
  //         name: 'data.db',
  //         location: 'default'
  //       }).then((db: SQLiteObject) => {

  //         db.executeSql("SELECT * FROM members WHERE user_id!='" + this.userId + "' AND is_maintenance_dep='1' ORDER BY name ASC", {}).then((allMembers) => {
  //           console.log("SELECT MEMBERS FROM DB: " + JSON.stringify(allMembers));

  //           if (allMembers.rows.length > 0) {
  //             for (let i = 0; i < allMembers.rows.length; i++) {
  //               if (this.mentioned_user_ids != '' && this.mentioned_user_ids != null && this.mentioned_user_ids.length == 1 && this.mentioned_user_ids[0] == allMembers.rows.item(i).user_id) {
  //                 this.workOrderData.assigned_to_id = allMembers.rows.item(i).user_id;
  //               }

  //               let tempUserInfo = {
  //                 "id": allMembers.rows.item(i).user_id,
  //                 "name": allMembers.rows.item(i).name,
  //                 "image": allMembers.rows.item(i).image
  //               };

  //               this.members.push(tempUserInfo);
  //             }
  //           }




  //         }, (error1) => {
  //           console.log("SELECT MEMBERS ERROR: " + JSON.stringify(error1));
  //         });

  //       }).catch(e => console.log(e));

  //     },
  //     error => {
  //       return '';
  //     }
  //   );
  // }

  updateCheckList() {
    if ((this.roomCheckListItems.length <= 0 && this.workOrderData.maintainable_type == 'Room') || (this.publicAreaCheckListItems.length <= 0 && this.workOrderData.maintainable_type == 'PublicArea')) {
      /* strat api call room check list items */
      let alertVar = this.alertCtrl.create({
        title: 'Error!',
        subTitle: 'Invalid Details!',
        buttons: ['OK']
      });

      this.nativeStorage.getItem('user_auth').then(
        accessToken => {
          if (this.commonMethod.checkNetwork()) {
            let url = "";
            if (this.roomCheckListItems.length <= 0 && this.workOrderData.maintainable_type == 'Room') {
              url = getRoomCheckListItemsUrl;
            }
            else {
              url = getPublicAreaCheckListItemsUrl;
            }

            this.commonMethod.getData(url, accessToken).subscribe(
              data => {

                if (this.roomCheckListItems.length <= 0 && this.workOrderData.maintainable_type == 'Room') {
                  this.roomCheckListItems = data.json();
                  //console.log("==" + JSON.stringify(this.roomCheckListItems));
                }
                else {
                  this.publicAreaCheckListItems = data.json();
                  //console.log("==" + JSON.stringify(this.publicAreaCheckListItems));
                }

                this.commonMethod.hideLoader();
              },
              err => {
                this.commonMethod.hideLoader();
                alertVar.present();
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
      /* end api call room check list items */
    }




  }

  updateSelection() {
    this.workOrderData.maintainable_id = "";
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
                this.viewCtrl.dismiss();
              }
            });
        }, 2000);
      });
    });
  }

  updateWorkOrder() {
    //alert(this.workOrderData);
    //console.log(JSON.stringify(this.workOrderData));
    if (this.img[0] != "") {
      this.workOrderData.first_img_url = this.img[0];
    }
    if (this.img[1] != "") {
      this.workOrderData.second_img_url = this.img[1];
    }

    /* create WO api call */
    let alertVar = this.alertCtrl.create({
      title: 'Error!',
      subTitle: 'Invalid Details!',
      buttons: ['OK']
    });

    this.nativeStorage.getItem('user_auth').then(
      accessToken => {
        if (this.commonMethod.checkNetwork()) {

          let objData = {};
          if (this.workOrderData.maintainable_type == 'Equipment') {
            this.workOrderData.maintenance_checklist_item_id = "";
          }

          objData = { 'work_order': { description: this.workOrderData.descriptions, priority: this.workOrderData.priority, status: this.workOrderData.status, assigned_to_id: this.workOrderData.assigned_to_id, maintainable_type: this.workOrderData.maintainable_type, maintainable_id: this.workOrderData.maintainable_id, maintenance_checklist_item_id: this.workOrderData.maintenance_checklist_item_id, first_img_url: this.workOrderData.first_img_url, second_img_url: this.workOrderData.second_img_url } };
          objData['work_order'].due_to_date = this.workOrderData.due_to_date;

          this.commonMethod.putData(updateWoDataUrl + "/" + this.wo_no, objData, accessToken).subscribe(
            data => {
              let foundRepos = data.json();
              console.log(foundRepos);
              this.commonMethod.hideLoader();
              //this.viewCtrl.dismiss();
              if (this.tempWorkOrderStatus != this.workOrderData.status && this.workOrderData.status.toLocaleUpperCase() === 'closed'.toLocaleUpperCase()) {
                // TODO: call close work order api
                this.closeWoCall(accessToken, foundRepos.id, foundRepos.id, foundRepos.work_order_url, foundRepos.status)
              } else {
                this.viewCtrl.dismiss({ id: this.id, work_order_id: foundRepos.id, work_order_url: foundRepos.work_order_url, work_order_status: foundRepos.status });
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


  /**
   * To close work order...
   */
  closeWoCall(accessToken, id, workOrderId, workOrderUrl, workOrderStatus) {
    let objData = {};
    if (this.commonMethod.checkNetwork()) {
      //this.woData[i].closeInProgress = true;
      this.commonMethod.putData(closeWoUrl + "/" + id + "/close", objData, accessToken).subscribe(
        data => {
          console.log("ResponseCloseWO: " + JSON.stringify(data.json()));
          this.viewCtrl.dismiss({ id: id, work_order_id: workOrderId, work_order_url: workOrderUrl, work_order_status: workOrderStatus });
          //this.closeWo(i);
          //this.woData[i].closeInProgress = false;
          //this.getWoData();
        },
        err => {
          // this.woData[i].closeInProgress = false;
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
  }

  confirmCloseWorkOrder() {
    let alert = this.alertCtrl.create({
      message: "Confirm deletion of WO #" + this.wo_no + ". This action cannot be undone. Once deleted, the work order cannot be accessed. Are you sure you want to do this?",
      cssClass: 'confirm-work-order',
      enableBackdropDismiss: false,
      buttons: [
        {
          text: 'No!',
          handler: data => {
            console.log('No clicked');
          }
        },
        {
          text: "YES I'm sure!",
          handler: data => {
            console.log('Yes clicked');
            this.closeWorkOrder();
          }
        }
      ]
    });
    alert.present();
  }

  closeWorkOrder() {

    /* create WO api call */
    let alertVar = this.alertCtrl.create({
      title: 'Error!',
      subTitle: 'Invalid Details!',
      buttons: ['OK']
    });

    this.nativeStorage.getItem('user_auth').then(
      accessToken => {
        if (this.commonMethod.checkNetwork()) {

          let objData = {};
          this.commonMethod.putData(updateWoDataUrl + "/" + this.wo_no + "/close", objData, accessToken).subscribe(
            data => {
              let foundRepos = data.json();
              console.log(foundRepos);
              this.commonMethod.hideLoader();
              this.viewCtrl.dismiss();
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

  closeKeyBoard() {
    this.keyboard.close();
  }

  getAssignableUsers() {
    let alertVar = this.alertCtrl.create({
      title: 'Error!',
      subTitle: 'Invalid Details!',
      buttons: ['OK']
    });

    this.nativeStorage.getItem('user_auth').then(
      accessToken => {
        if (this.commonMethod.checkNetwork()) {
          this.commonMethod.getDataWithoutLoder(getAssignableUsersUrl, accessToken).timeout(60000).subscribe(
            data => {
              //this.commonMethod.hideLoader();
              let allMembers = data.json();
              this.members = allMembers;
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
}

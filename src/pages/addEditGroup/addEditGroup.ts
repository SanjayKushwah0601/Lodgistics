import { Component, NgZone, trigger, transition, style, animate, state } from '@angular/core';
import { ViewController, NavController, NavParams, Platform, AlertController, ActionSheetController, Events } from 'ionic-angular';
import { ViewChild } from '@angular/core';
import { Navbar } from 'ionic-angular';
import { NativeStorage } from '@ionic-native/native-storage';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { Camera, CameraOptions } from '@ionic-native/camera';
import { srviceMethodsCall } from '../../services/serviceMethods';
import { Validator } from '../../validator';
import { FormBuilder, FormGroup } from '@angular/forms';
import { addEditGroupUrl } from '../../services/configURLs';
import { getAllMembersUrl } from '../../services/configURLs';
import { getAwsSignedUrl,getRolesAndDepartmentsUrl } from '../../services/configURLs';
import { ChattingPage } from '../chatting/chatting';
import { GroupChatPage } from '../groupChat/groupChat';
import { Keyboard } from '@ionic-native/keyboard';
import { Transfer, FileUploadOptions, TransferObject } from '@ionic-native/transfer';
import { File } from '@ionic-native/file';

//import 'aws-sdk/dist/aws-sdk';
//const AWS = (<any>window).AWS;

declare var navigator: any;
declare var Connection: any;

@Component({
  selector: 'page-addeditgroup',
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
  templateUrl: 'addEditGroup.html',
  providers: [srviceMethodsCall, NativeStorage, SQLite, Keyboard, Camera, Transfer, File]
})
export class AddEditGroupPage {
  @ViewChild(Navbar) navbar: Navbar;
  public foundRepos: any;
  public groupForm: FormGroup;
  public group = "";
  public tempGroupName;
  public users = [];
  public groupInfo: any;
  public userId: any;
  public groupCreatorName: string;
  public groupOwnerId: any;
  public base64Image = "";
  public groupS3FileUrl = "";
  public isUpdateGroup = false;
  public buttonEnable = false;
  public isNewImageAvailable = false;
  public showButton = false;
  public addClassContent = false;
  public actionSheet: any;

  public selectedTab: string = "user";
  public roleItems= [];
  public totalRow=1;
  public rolesData = [];
  public departmentsData = [];

  public formData=[];
  public createButton=false;
  public createButtonGroup=false;
  constructor(public navCtrl: NavController, public keyboard: Keyboard, public zone: NgZone, public platform: Platform, public alertCtrl: AlertController, public nativeStorage: NativeStorage, public commonMethod: srviceMethodsCall, private _FB: FormBuilder, public navParams: NavParams, private sqlite: SQLite, private viewCtrl: ViewController, private camera: Camera, private transfer: Transfer, private file: File, public actionSheetCtrl: ActionSheetController, public events: Events) {

    //this.commonMethod.showLoader();

    this.groupForm = _FB.group({
      group: Validator.groupCreateValidator
    });
    //this.group = this.groupForm.controls['group'];

    this.sqlite.create({
      name: 'data.db',
      location: 'default'
    }).then((db: SQLiteObject) => {
      // this.commonMethod.showLoader();

      db.executeSql('CREATE TABLE IF NOT EXISTS members(user_id INTEGER, hotel_token TEXT, name TEXT, image TEXT, role TEXT, title TEXT)', {})
        .then((dbRes) => {
          console.log("TABLE CREATED: " + JSON.stringify(dbRes));

          let allExistingIds = [];
          db.executeSql("SELECT * FROM members", []).then((dataSQL) => {
            console.log("TABLE DATA: " + JSON.stringify(dataSQL));

            if (dataSQL.rows.length > 0) {
              for (var i = 0; i < dataSQL.rows.length; i++) {
                allExistingIds.push({
                  user_id: dataSQL.rows.item(i).user_id
                });
              }
            }

            /*  get member api call start */

            let alertVar = this.alertCtrl.create({
              title: 'Error!',
              subTitle: 'Invalid Details!',
              buttons: ['OK']
            });

            this.nativeStorage.getItem('user_auth').then(
              accessToken => {

                this.userId = accessToken.user_id;

                if (this.commonMethod.checkNetwork()) {

                  this.commonMethod.getData(getAllMembersUrl, accessToken).subscribe(
                    data => {
                      //this.foundRepos = data.json();
                      this.users = data.json();
                      console.error(this.users);

                      /* For edit group only */
                      if (this.navParams.get('groupInfo')) {


                        this.groupInfo = this.navParams.get('groupInfo');
                        this.group = this.groupInfo.name;
                        this.tempGroupName = this.group;
                        this.groupOwnerId = this.groupInfo.owner_id;
                        this.base64Image = (typeof this.groupInfo.image_url != 'undefined') ? this.groupInfo.image_url : "";

                        for (let i = 0; i < this.groupInfo.users.length; i++) {
                          for (let j = 0; j < this.users.length; j++) {
                            if (this.groupInfo.users[i].id == this.users[j].id) {
                              this.users[j].inGroup = true;
                            }
                            if (this.groupInfo.users[i].id == this.groupInfo.owner_id) {
                              this.groupCreatorName = this.groupInfo.users[i].name;
                            }

                          }
                        }
                        this.buttonEnable = true;
                      } else {
                        this.tempGroupName = "CREATE GROUP";
                        this.groupOwnerId = this.userId;
                        this.buttonEnable = false;
                      }

                      for (let i = 0; i < this.users.length; i++) {
                        let insertFlag = true;
                        for (let j = 0; j < allExistingIds.length; j++) {
                          if (this.users[i].id == allExistingIds[j].user_id) {
                            insertFlag = false;
                          }
                        }

                        let is_maintenance_dep = 0;
                        for (let val = 0; val < this.users[i].departments.length; val++) {
                          console.log("departments" + this.users[i].departments[val].name);
                          if (this.users[i].departments[val].name == "Maintenance") {
                            is_maintenance_dep = 1;
                          }
                        }
                        console.log("departments maintainance" + is_maintenance_dep);

                        let is_system_user = this.users[i].is_system_user == true ? 1 : 0;
                        if (insertFlag == true) {
                          db.executeSql("INSERT INTO members (user_id, hotel_token, name, image, role, title,is_maintenance_dep, is_system_user) VALUES ('" + this.users[i].id + "','','" + this.users[i].name + "','" + this.users[i].avatar_img_url + "','" + this.users[i].role + "','" + this.users[i].title + "'," + is_maintenance_dep + "," + is_system_user + ")", {}).then((data1) => {

                            console.log("INSERTED: " + JSON.stringify(data1));
                          }, (error1) => {
                            console.log("INSERT ERROR: " + JSON.stringify(error1));
                          });
                        }
                        else {
                          db.executeSql("UPDATE members SET user_id='" + this.users[i].id + "', hotel_token='', name='" + this.users[i].name + "', image='" + this.users[i].avatar_img_url + "', role='" + this.users[i].role + "', is_maintenance_dep=" + is_maintenance_dep + ", is_system_user=" + is_system_user + " WHERE user_id='" + this.users[i].id + "'", {}).then((data1) => {
                            console.log("UPDATED: " + JSON.stringify(data1));
                          }, (error1) => {
                            console.log("UPDATED ERROR: " + JSON.stringify(error1));
                          });
                        }
                      }
                      this.showButton = true;
                      this.commonMethod.hideLoader();

                    },
                    err => {
                      this.commonMethod.hideLoader();
                      alertVar.present();
                      console.error("Error : " + err);
                    },
                    () => {
                      this.commonMethod.hideLoader();
                      console.log('get member Data completed');
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
            /*  get member api call end */

          }, (error) => {
            console.log("ERROR: " + JSON.stringify(error));
          });

        }, (error) => {
          console.error("Unable to execute sql", error);
        }).catch(e => console.log('Executed SQL Error= ' + JSON.stringify(e)));
    }).catch(e => console.log(e));

    this.keyboard.onKeyboardShow().subscribe(data => {
    });

    this.keyboard.onKeyboardHide().subscribe(data => {
      this.events.publish('hide:keyboard');

    });
  }
  ngOnInit() {
    this.formData.push({
      email: '',
      phone_number: '',
      property_token: '',
      name: '',
      role_name: '',
      role_id: '',
      department_name:'',
      department_id: '',
    });
  } 

  ionViewDidEnter() {
this.addClassContent = true;
    this.platform.ready().then(() => {
      this.platform.registerBackButtonAction(() => {
  // Print this event to the console
  
        // Navigate to another page
        this.events.publish('hide:keyboard');
        this.keyboard.close();
        setTimeout(() => {
          if (this.groupInfo && this.groupInfo.id) {
  
            this.openGroupCaht();
          } else {
  
            this.navCtrl.pop();
          }
        },
          100);
      });
    });
    this.navbar.backButtonClick = () => {
      ///here you can do wathever you want to replace the backbutton event

    }
    this.navbar.backButtonClick = (e: UIEvent) => {
      // Print this event to the console
      console.log(e);

      // Navigate to another page
      this.events.publish('hide:keyboard');
      this.keyboard.close();
      setTimeout(() => {
        if (this.groupInfo && this.groupInfo.id) {

          this.openGroupCaht();
        } else {

          this.navCtrl.pop();
        }
      },
        100);

    }

    this.getRolesAndDepartmentsData();
    this.roleItems = [1,2];
    //this.totalRow=1;
    //this.roleItems.push(this.totalRow);
   // this.totalRow+=1;
    //this.roleItems.push(this.totalRow);
    this.addOther();

  }
  
  addEditGroup(formData) {
    this.platform.ready().then(() => {
      var networkState = navigator.connection.type;
      var states = {};
      states[Connection.UNKNOWN] = 'Unknown connection';
      states[Connection.ETHERNET] = 'Ethernet connection';
      states[Connection.WIFI] = 'WiFi connection';
      states[Connection.CELL_2G] = 'Cell 2G connection';
      states[Connection.CELL_3G] = 'Cell 3G connection';
      states[Connection.CELL_4G] = 'Cell 4G connection';
      states[Connection.CELL] = 'Cell generic connection';
      states[Connection.NONE] = 'No network connection';

      if (networkState != Connection.NONE) {
        let allIds = [];

        for (let i = 0; i < this.users.length; i++) {
          if (this.users[i].inGroup == true) {
            allIds.push(this.users[i].id);
          }
        }

        let objData = {};
        if (this.groupS3FileUrl) {
          objData = { 'chat': { 'name': formData.group, 'user_ids': allIds, 'is_private': false, 'image_url': this.groupS3FileUrl } };
        }
        else {
          objData = { 'chat': { 'name': formData.group, 'user_ids': allIds, 'is_private': false } };
        }

        let alertVar = this.alertCtrl.create({
          title: 'Error!',
          subTitle: 'Invalid Details!',
          buttons: ['OK']
        });

        if (this.groupInfo && this.groupInfo.id) {
          this.nativeStorage.getItem('user_auth').then(
            accessToken => {

              if (this.commonMethod.checkNetwork()) {
                this.commonMethod.putData(addEditGroupUrl + "/" + this.groupInfo.id, objData, accessToken).subscribe(
                  data => {

                    this.foundRepos = data.json();
                    console.error(this.foundRepos);
                    //  this.navCtrl.setRoot(ChattingPage);
                    this.groupInfo = this.foundRepos;
                    this.events.publish('hide:keyboard');
                    this.keyboard.close();
                    this.commonMethod.hideLoader();
                    this.openGroupCaht();
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
          this.nativeStorage.getItem('user_auth').then(
            accessToken => {

              if (this.commonMethod.checkNetwork()) {
                this.commonMethod.postData(addEditGroupUrl, objData, accessToken).subscribe(
                  data => {
                    this.foundRepos = data.json();
                    this.events.publish('hide:keyboard');
                    this.keyboard.close();
                    this.groupInfo = this.foundRepos;
                    this.commonMethod.hideLoader();
                    this.openGroupCaht();
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

      } else {
        let alertVar = this.alertCtrl.create({
          title: 'Network Error!',
          subTitle: 'No network connection.',
          buttons: ['OK']
        });
        alertVar.present();
      }

    });
  }

  updateMember(i) {
    this.isUpdateGroup = true;
    if (this.groupInfo && this.groupInfo.id && this.groupInfo.owner_id == this.userId) {
      this.users[i].wasInGroup = this.users[i].inGroup == true ? true : false;
      this.users[i].inGroup = this.users[i].inGroup == true ? false : true;
    } else if (!this.groupInfo) {
      this.users[i].wasInGroup = this.users[i].inGroup == true ? true : false;
      this.users[i].inGroup = this.users[i].inGroup == true ? false : true;
    }
  }

  openGroupCaht() {
    let insertChatGroupUsersQuery = 'INSERT INTO chat_group_users (group_id, user_id, is_admin, deleted_at, created_at) VALUES ';
    let updateChatGroupsData = "";
    let updateChatGroupUsersQuery = "UPDATE chat_group_users SET group_id = (case ";
    let updateChatGroupUsersGroupIdData = "";
    let updateChatGroupUsersUserIdData = "Else group_id End), user_id = (case ";
    let insertChatGroupUsersData = "";

    this.sqlite.create({
      name: 'data.db',
      location: 'default'
    }).then((db: SQLiteObject) => {
      let allExistingUserIds = [];

      db.executeSql("SELECT * FROM chat_group_users WHERE group_id='" + this.groupInfo.id + "'", []).then((dataUserSQL) => {
        console.log("GROUP USER TABLE DATA: " + JSON.stringify(dataUserSQL));
        if (dataUserSQL.rows.length > 0) {
          for (let k = 0; k < dataUserSQL.rows.length; k++) {
            allExistingUserIds.push({
              user_id: dataUserSQL.rows.item(k).user_id
            });
          }
        }

        for (let k = 0; k < this.groupInfo.users.length; k++) {
          let insertUserFlag = true;
          for (let l = 0; l < allExistingUserIds.length; l++) {
            if (this.groupInfo.users[k].id == allExistingUserIds[l].user_id) {
              insertUserFlag = false;
            }
          }
          if (insertUserFlag == true) {
            insertChatGroupUsersData = insertChatGroupUsersData + "('" + this.groupInfo.id + "','" + this.groupInfo.users[k].id + "','0','','" + this.groupInfo.users[k].joined_at + "'),";
            console.log("insertChatGroupUsersData  " + insertChatGroupUsersData);
          }
          else {

            updateChatGroupUsersGroupIdData = updateChatGroupUsersGroupIdData + "when user_id='" + this.groupInfo.users[k].id + "' AND group_id='" + this.groupInfo.id + "' then '" + this.groupInfo.id + "' ";
            updateChatGroupUsersUserIdData = updateChatGroupUsersUserIdData + "when user_id='" + this.groupInfo.users[k].id + "' AND group_id='" + this.groupInfo.id + "' then '" + this.groupInfo.users[k].id + "' ";
          }

        }

        if (insertChatGroupUsersData != "") {
          db.executeSql(insertChatGroupUsersQuery + insertChatGroupUsersData.substring(0, insertChatGroupUsersData.length - 1), {}).then((dataUser1) => {
            console.log("Data  == GROUP USER INSERTED: " + JSON.stringify(dataUser1));
            this.navCtrl.push(GroupChatPage, { groupInfo: this.groupInfo }).then(() => {
              // first we find the index of the current view controller:
              const index = this.viewCtrl.index;
              // then we remove it from the navigation stack
              this.navCtrl.remove(index);
            });
          }, (errorUser1) => {
            console.log("Data  == GROUP USER INSERT ERROR: " + JSON.stringify(errorUser1));
          });
        } else {
          this.navCtrl.push(GroupChatPage, { groupInfo: this.groupInfo }).then(() => {
            // first we find the index of the current view controller:
            const index = this.viewCtrl.index;
            // then we remove it from the navigation stack
            this.navCtrl.remove(index);
          });
        }

        if (updateChatGroupUsersGroupIdData != "") {
          console.log("chat_group_users Data  == " + updateChatGroupUsersQuery + updateChatGroupUsersGroupIdData + updateChatGroupUsersUserIdData + "Else user_id End)");
          db.executeSql(updateChatGroupUsersQuery + updateChatGroupUsersGroupIdData + updateChatGroupUsersUserIdData + "Else user_id End)", {}).then((dataUser1) => {
          }, (errorUser1) => {
            console.log("GROUP USER UPDATED ERROR: " + JSON.stringify(errorUser1));
          });
        }

      }, (errorUser) => {
        console.log("1 ERROR: " + JSON.stringify(errorUser));
      });
    });


  }

  showGalleryPrompt() {
    if (this.userId == this.groupOwnerId) {
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
      this.base64Image = imageData;
      this.isUpdateGroup = true;
      this.isNewImageAvailable = true;
      //this.uploadImageOnAws(imageData);
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
      this.base64Image = imageData;
      this.isUpdateGroup = true;
      this.isNewImageAvailable = true;
      //this.uploadImageOnAws(imageData);
    }, (err) => {
      // Handle error
    });

  }

  updateGroupInfo(formData) {

    if (this.base64Image != "" && this.isNewImageAvailable == true) {
      let commonMethod = this.commonMethod;
      let transfer = this.transfer;
      let time = new Date().getTime();
      var imageName = this.userId + "_" + time + "_" + this.base64Image.substr(this.base64Image.lastIndexOf('/') + 1);

      commonMethod.showLoader();

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
                this.buttonEnable = false;

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
                  this.groupS3FileUrl = s3FileUrl;
                  //commonMethod.hideLoader();
                  this.addEditGroup(formData);

                }, (err) => {
                  // error
                  console.log("tt=" + JSON.stringify(err));
                  commonMethod.hideLoader();
                  this.buttonEnable = false;

                });


              },
              err => {
                alertVar.present();
                console.error("Error : " + err);
                commonMethod.hideLoader();

                this.buttonEnable = false;

              },
              () => {
                this.buttonEnable = false;

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
      if (this.base64Image != "") {
        this.groupS3FileUrl = this.base64Image;
      }
      this.addEditGroup(formData);
    }


  }

  updateAction(event: any) {
    this.isUpdateGroup = true;
    if (event.target.value.trim().length > 0) {
      this.buttonEnable = true;
      this.createButtonGroup=true;
    } else {
      this.buttonEnable = false;
    }

  }

  membersInGroup() {
    let count = 0;
    for (let i = 0; i < this.users.length; i++) {
      if (this.users[i].inGroup == true || this.users[i].id == this.groupOwnerId) {
        count++;
      }
    }
    return count;
  }

  showSelectedLabel() {
    let count = 0;
    for (let i = 0; i < this.users.length; i++) {
      if (this.users[i].inGroup == true || this.users[i].id == this.groupOwnerId) {
        count++;
      }
    }
    return (count <= 1) ? 'Only You are in the group' : count + ' Selected';
  }

  ionViewWillLeave() {
    this.addClassContent = false;
  }

  valchange() {
    this.zone.run(() => {
      this.group = this.group;
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
              //  alert("111");
              if (click.click && this.actionSheet != undefined) {
                this.actionSheet.dismiss();
              }
            });
        }, 2000);
      });
    });
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

  addOther() {
   // this.totalRow++;
    //this.roleItems.unshift(this.totalRow);
    if(this.formData.length>1){
      this.formData.unshift({
        property_token: '',
        role_name: '',
        role_id: '',
        department_name:'',
        department_id: '',
      });
    }else{
      this.formData.push({
        property_token: '',
        role_name: '',
        role_id: '',
        department_name:'',
        department_id: '',
      });
    }
  }

  // selectRole() {
  //   let actionSheet = this.actionSheetCtrl.create({
  //     title: 'Select Role',
  //   });
  //   for (var i = 0; i < this.rolesData.length; i++) {
  //     actionSheet.addButton({ text: this.rolesData[i].name });
  //   }
  //   actionSheet.present();
  // }
  selectRole(index) {
    let actionSheet = this.actionSheetCtrl.create({
      title: 'Select Role',
    });
    for (var i = 0; i < this.rolesData.length; i++) {
      let thisObj=this;
      let name=this.rolesData[i].name;
      let id=this.rolesData[i].id;
      actionSheet.addButton({ text: name ,handler: () => { thisObj.formData[index].role_name=name; thisObj.formData[index].role_id=id; thisObj.checkDuplicate(index);  console.log(name + " id is"+ id); thisObj.canCreateGroup(); } });
  
    }
    actionSheet.present();
    this.canCreateGroup();
  }
  selectDepartment(index) {
    let actionSheet = this.actionSheetCtrl.create({
      title: 'Select Department',
    });
    for (var i = 0; i < this.departmentsData.length; i++) {
      let thisObj=this;
      let name=this.departmentsData[i].name;
      let id=this.departmentsData[i].id;
      actionSheet.addButton({ text: name ,handler: () => { thisObj.formData[index].department_name=name; thisObj.formData[index].department_id=id;   thisObj.checkDuplicate(index); console.log(name + " id is"+ id); thisObj.canCreateGroup(); } });
    }
    actionSheet.present();
   
  }
  canAddMore(){
    let status=false;
    if(this.formData.length>1){
      status=true;
      for(let j=0;j<this.formData.length;j++){
        if( this.formData[j].department_id=='' || this.formData[j].role_id=='' ){
          status=false;
        }
      }
    }
    return status;
  }
  canCreateGroup(){
    console.log("create group function");
    let status=false;
    if(this.formData.length>=1){
      for(let j=0;j<this.formData.length;j++){
        if( this.formData[j].department_id!='' && this.formData[j].role_id!=''){
          status=true;
          this.createButton=true;
          console.log("create group function inside if ");
          console.log("createButton"+this.createButton);
          console.log("createButtonGroup"+this.createButtonGroup);
        }
      }
    }
  }

  checkDuplicate(i){
    if( this.formData[i].department_id!='' && this.formData[i].role_id!='' ){
      for(let j=0;j<this.formData.length;j++){
        if( i!=j && this.formData[j].department_id!='' && this.formData[j].role_id!='' && this.formData[j].department_id==this.formData[i].department_id && this.formData[j].role_id==this.formData[i].role_id){
          
          let alertVar = this.alertCtrl.create({
            title: 'Error!',
            subTitle: 'Selection already exist!',
            buttons: ['OK']
          });
          alertVar.present();

          this.formData[i].department_id="";
          this.formData[i].department_name="";
          this.formData[i].role_id="";
          this.formData[i].role_name="";
        }
      }
    }
  }

  // selectDepartment() {
  //   let actionSheet = this.actionSheetCtrl.create({
  //     title: 'Select Department',
  //   });
  //   for (var i = 0; i < this.departmentsData.length; i++) {
  //     actionSheet.addButton({ text: this.departmentsData[i].name });
  //   }
  //   actionSheet.present();
  // }


}

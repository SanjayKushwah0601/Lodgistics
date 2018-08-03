import { Component, ViewChild, trigger, transition, style, animate, state, NgZone } from '@angular/core';
import { NavController, AlertController, Platform, NavParams, Content, ModalController, Navbar, Events, ActionSheetController } from 'ionic-angular';
import { srviceMethodsCall } from '../../services/serviceMethods';
import { NativeStorage } from '@ionic-native/native-storage';
import { Keyboard } from '@ionic-native/keyboard';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { FeedsPage } from '../feeds/feeds';
import { getRolesAndDepartmentsUrl, inviteUsersUrl } from '../../services/configURLs';
import 'web-animations-js/web-animations.min';

import 'rxjs/Rx';
import {
  WORKER_RENDER_APP,
  WORKER_RENDER_PLATFORM,
  WORKER_SCRIPT
} from '@angular';

@Component({
  selector: 'page-inviteUsers',
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
  templateUrl: 'inviteUsers.html',
  providers: [srviceMethodsCall, NativeStorage, Keyboard, SQLite]
})

export class InviteUsersPage {
  @ViewChild(Navbar) navbar: Navbar;
  @ViewChild(Content) content: Content;

  public foundRepos = [];
  public feedNotificationCount = 0;
  public messagesNotificationCount = 0;
  public interval: any;
  public userPermissions: any;
  public isPopupOpen = false;
  public alert: any;
  public spinner = false;
  public userId = "";
  public rolesData = [];
  public departmentsData = [];
  public inviteUser: any;
  public formData = [];
  public mask = ['(', /[1-9]/, /\d/, /\d/, ')', ' ', /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/];
  public emailValidationReg = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

  constructor(public navCtrl: NavController, public commonMethod: srviceMethodsCall, public alertCtrl: AlertController, public nativeStorage: NativeStorage, public keyboard: Keyboard, private sqlite: SQLite, public zone: NgZone, public modalCtrl: ModalController, public platform: Platform, public params: NavParams, public events: Events, public actionSheetCtrl: ActionSheetController) {

    this.userPermissions = {
      "wo_access": {
        "view_listing": false,
        "can_create": false,
        "can_close": false
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
        },
        error => {
          return false;
        }
      );
    }, 1000);

  }
  ngOnInit() {
    this.formData.push({
      email: '',
      phone_number: '',
      property_token: '',
      name: '',
      role_name: '',
      role_id: '',
      department_name: '',
      department_id: '',
    });
  }

  ionViewDidEnter() {
    console.log("page loaded");
    this.getRolesAndDepartmentsData();
    this.foundRepos = [];
    this.addOtherUser();

    this.nativeStorage.setItem('lastPage', { "pageName": InviteUsersPage.name, "index": this.navCtrl.getActive().index });
  }

  ionViewWillLeave() {
    console.log("Looks like I'm about to leave :(, clear notification Interval");
    window.clearInterval(this.interval);
  }

  closekeyboard() {
    this.keyboard.close();
  }

  addOtherUser() {
    if (this.formData.length > 1) {
      this.formData.unshift({
        email: '',
        phone_number: '',
        property_token: '',
        name: '',
        role_name: '',
        role_id: '',
        department_name: '',
        department_id: '',
      });
    } else {
      this.formData.push({
        email: '',
        phone_number: '',
        property_token: '',
        name: '',
        role_name: '',
        role_id: '',
        department_name: '',
        department_id: '',
      });
    }
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

  selectRole(index) {
    let actionSheet = this.actionSheetCtrl.create({
      title: 'Select Role',
    });
    for (var i = 0; i < this.rolesData.length; i++) {
      let thisObj = this;
      let name = this.rolesData[i].name;
      let id = this.rolesData[i].id;
      actionSheet.addButton({ text: name, handler: () => { thisObj.formData[index].role_name = name; thisObj.formData[index].role_id = id; console.log(name + " id is" + id) } });
    }
    actionSheet.present();
  }

  selectDepartment(index) {
    let actionSheet = this.actionSheetCtrl.create({
      title: 'Select Department',
    });
    for (var i = 0; i < this.departmentsData.length; i++) {
      let thisObj = this;
      let name = this.departmentsData[i].name;
      let id = this.departmentsData[i].id;
      actionSheet.addButton({ text: name, handler: () => { thisObj.formData[index].department_name = name; thisObj.formData[index].department_id = id; console.log(name + " id is" + id) } });
    }
    actionSheet.present();
  }

  invite() {
    this.spinner = true;
    let objData = { users: [] };

    let alertVar = this.alertCtrl.create({
      title: 'Error!',
      subTitle: 'Invalid Details!',
      buttons: ['OK']
    });
    this.nativeStorage.getItem('user_auth').then(
      accessToken => {

        for (let i = 0; i < this.formData.length; i++) {
          if (this.formData[i].phone_number != '' && this.formData[i].department_id != '' && this.formData[i].role_id != '') {
            let user = {
              phone_number: this.formData[i].phone_number.replace(/\D+/g, ''),
              property_token: accessToken.property_token,
              name: this.formData[i].name,
              email: this.formData[i].email,
              role_id: this.formData[i].role_id,
              department_id: this.formData[i].department_id,
            }
            objData.users.push(user);
          }
        }

        if (this.commonMethod.checkNetwork()) {

          this.spinner = true;
          this.commonMethod.postDataWithoutLoder(inviteUsersUrl, objData, accessToken).subscribe(
            data => {
              let foundRepos = data.json();
              console.log(foundRepos);
              this.spinner = false;
              this.navCtrl.setRoot(FeedsPage);
            },
            err => {
              this.spinner = false;
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

  canAddMore() {
    let status = false;
    if (this.formData.length > 1) {
      status = true;
      for (let j = 0; j < this.formData.length; j++) {
        if ((this.formData[j].email != '' && !this.emailValidationReg.test(this.formData[j].email)) || this.formData[j].phone_number == '' || this.formData[j].department_id == '' || this.formData[j].role_id == '') {
          status = false;
        }
      }
    }
    return status;
  }

  canInviteUser() {
    let status = false;
    if (this.formData.length >= 1) {
      for (let j = 0; j < this.formData.length; j++) {
        if ((this.formData[j].email == '' || (this.formData[j].email != '' && this.emailValidationReg.test(this.formData[j].email))) && this.formData[j].phone_number != '' && this.formData[j].department_id != '' && this.formData[j].role_id != '') {
          status = true;
        }
      }
    }
    if (this.spinner) {
      status = false;
    }
    return status;
  }

}



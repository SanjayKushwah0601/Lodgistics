import { Component, ViewChild, trigger, transition, style, animate, state, NgZone } from '@angular/core';
import { NavController, AlertController, Platform, NavParams, Content, ModalController, Navbar, Events } from 'ionic-angular';
import { srviceMethodsCall } from '../../services/serviceMethods';
import { NativeStorage } from '@ionic-native/native-storage';
import { Keyboard } from '@ionic-native/keyboard';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { getAllMembersUrl } from '../../services/configURLs';
import { InviteUsersPage } from '../inviteUsers/inviteUsers';
import { IntroInviteUsersPage } from '../introInviteUsers/introInviteUsers';

@Component({
  selector: 'page-teamListing',
  templateUrl: 'teamListing.html',
  providers: [srviceMethodsCall, NativeStorage, Keyboard, SQLite]
})

export class TeamListingPage {
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

  constructor(public navCtrl: NavController, public commonMethod: srviceMethodsCall, public alertCtrl: AlertController, public nativeStorage: NativeStorage, public keyboard: Keyboard, private sqlite: SQLite, public zone: NgZone, public modalCtrl: ModalController, public platform: Platform, public params: NavParams, public events: Events) {

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

    //this.openIntro();
  }

  ionViewDidEnter() {
    console.log("page loaded");
    this.foundRepos = [];
    this.nativeStorage.setItem('lastPage', { "pageName": TeamListingPage.name, "index": this.navCtrl.getActive().index });
    this.getMembers();
  }

  ionViewWillLeave() {
    console.log("Looks like I'm about to leave :(, clear notification Interval");
    window.clearInterval(this.interval);
  }

  closekeyboard() {
    this.keyboard.close();
  }

  getMembers() {
    let alertVar = this.alertCtrl.create({
      title: 'Error!',
      subTitle: 'Invalid Details!',
      buttons: ['OK']
    });

    this.nativeStorage.getItem('user_auth').then(
      accessToken => {
        console.log("access token details  : " + JSON.stringify(accessToken));

        if (this.commonMethod.checkNetwork()) {
          this.spinner = true;
          this.commonMethod.getDataWithoutLoder(getAllMembersUrl, accessToken).subscribe(
            data => {
              this.foundRepos = data.json();
              this.spinner = false;
              console.log(this.foundRepos);
              //alert(this.foundRepos); 
            },
            err => {
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
          this.commonMethod.showNetworkError();
        }
      },
      error => {
        return '';
      }
    );
  }

  add() {
    this.navCtrl.push(InviteUsersPage);
  }

  openIntro() {
    let modal = this.modalCtrl.create(IntroInviteUsersPage);
    modal.onDidDismiss(data => {
    });
    modal.present();
  }




}



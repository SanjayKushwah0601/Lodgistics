import { Component, NgZone } from '@angular/core';
import { AlertController, Platform, ModalController, NavParams, ViewController, Events } from 'ionic-angular';


@Component({
  selector: 'page-introInviteUsers',
  templateUrl: 'introInviteUsers.html'
})

export class IntroInviteUsersPage {

  public tempMessageData: any;

  constructor(public platform: Platform, public params: NavParams, public viewCtrl: ViewController, public zone: NgZone, modalCtrl: ModalController, public events: Events) {

  }

  dismiss() {
    this.viewCtrl.dismiss('');
  }

}

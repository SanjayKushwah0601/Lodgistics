import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController } from 'ionic-angular';


@Component({
  selector: 'page-user-list-popover',
  templateUrl: 'user-list-popover.html',
})
export class UserListPopoverPage {

  private users: any = []

  constructor(public navCtrl: NavController, public navParams: NavParams, public viewCtrl: ViewController) {
    this.users = this.navParams.get('userList')
    console.log(this.users);
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad UserListPopoverPage');
  }

  close() {
    this.viewCtrl.dismiss();
  }
}

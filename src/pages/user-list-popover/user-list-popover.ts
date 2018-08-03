import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController } from 'ionic-angular';


@Component({
  selector: 'page-user-list-popover',
  templateUrl: 'user-list-popover.html',
})
export class UserListPopoverPage {

  private users: any = []

  constructor(public navCtrl: NavController, public navParams: NavParams, public viewCtrl: ViewController) {
    let array = this.navParams.get('userList')
    this.users = Array.from(array);
    console.log(this.users);
    this.users.splice(0, 2)
    // console.log(this.users);
    // this.users = this.users.splice(0, 1)
    console.log(this.users);
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad UserListPopoverPage');
  }

  close() {
    this.viewCtrl.dismiss();
  }
}

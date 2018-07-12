import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Events } from 'ionic-angular';

/**
 * Generated class for the UpdateAppPage page.
 *
 * #isForceUpdate is required parameter
 */

@Component({
  selector: 'page-notificationPermission',
  templateUrl: 'notificationPermission.html',
})
export class NotificationPermissionPage {

  isForceUpdate: boolean = false;

  constructor(public navCtrl: NavController, public navParams: NavParams,public events: Events) {
    
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad UpdateAppPage');
  }

  /**
   * Method will be called when user presses 'Dismiss' button on the screen.
   */
  private navigateBack() {
    this.navCtrl.pop();
  }

  /**
   * Method will be called when user presses 'Update App' button on the screen.
   */
  private updateApp() {
    this.events.publish('update:enableNotificationsStatus');
    this.navCtrl.pop();
  }

}

import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Events, ModalController } from 'ionic-angular';
import { NativeStorage } from '@ionic-native/native-storage';
import { NotificationSettingsPage } from '../notificationSettings/notificationSettings';

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

  constructor(public navCtrl: NavController, public navParams: NavParams, public events: Events,
    private nativeStorage: NativeStorage, private modalCtrl: ModalController) {
    this.nativeStorage.setItem('show_notification_permission', false)
      .then(resp => {
      }, error => {
      });
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
    this.notificationSettings()
  }

  notificationSettings() {
    let modal = this.modalCtrl.create(NotificationSettingsPage);
    // modal.onDidDismiss(data => {
    //   this.closekeyboard();
    // });
    modal.present();
  }

}

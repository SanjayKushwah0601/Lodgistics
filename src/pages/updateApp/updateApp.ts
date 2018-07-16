import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Platform } from 'ionic-angular';
import { Market } from '@ionic-native/market';

/**
 * Generated class for the UpdateAppPage page.
 *
 * #isForceUpdate is required parameter
 */

@Component({
  selector: 'page-updateApp',
  templateUrl: 'updateApp.html',
})
export class UpdateAppPage {

  isForceUpdate: boolean = false;
  public message = "";

  constructor(public navCtrl: NavController, public navParams: NavParams, private market: Market, public plt: Platform) {
    this.isForceUpdate = navParams.get('isForceUpdate') as boolean;
    this.message = navParams.get('message');

    console.log('ionViewDidLoad UpdateAppPage');
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad UpdateAppPage');
  }

  /**
   * Method will be called when user presses 'Dismiss' button on the screen.
   */
  private navigateBack() {
    this.navCtrl.pop()
  }

  /**
   * Method will be called when user presses 'Update App' button on the screen.
   */
  private updateApp() {
    if (this.plt.is('ios')) {
      // This will only print when on iOS
      console.log('I am an iOS device!');
      this.market.open('id1263478956');
    } else {
      this.market.open('com.lodgistics.connect');
    }
    this.navCtrl.pop();
  }

}

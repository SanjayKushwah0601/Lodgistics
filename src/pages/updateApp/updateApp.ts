import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
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

  constructor(public navCtrl: NavController, public navParams: NavParams, private market: Market) {
    this.isForceUpdate = navParams.get('isForceUpdate') as boolean
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
    this.market.open('com.lodgistics.connect');
  }

}

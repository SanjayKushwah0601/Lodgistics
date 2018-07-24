import { Component, NgZone } from '@angular/core';
import { NavController, Platform, NavParams, ViewController } from 'ionic-angular';
import { Keyboard } from '@ionic-native/keyboard';

@Component({
  selector: 'page-feedCreatedSuccessfully',
  templateUrl: 'feedCreatedSuccessfully.html',
  providers: [Keyboard]
})

export class FeedCreatedSuccessfullyPage {

  public timer: any;
  public maxTime = 3;
  private name: string = 'user'

  constructor(public platform: Platform, public params: NavParams, private keyboard: Keyboard, public viewCtrl: ViewController) {

    this.name = this.params.get('name')
    this.keyboard.disableScroll(true);
    this.startTimer();
  }

  startTimer() {
    let thisObj = this;
    this.timer = setTimeout(function () {
      if (thisObj.maxTime > 1) {
        thisObj.startTimer();
      }
      else {
        thisObj.dismiss(true);
      }
      thisObj.maxTime -= 1;
    }, 1000);
  }

  dismiss(redirect) {
    this.keyboard.close();
    this.viewCtrl.dismiss({ redirect: redirect });
  }

}


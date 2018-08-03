import { Component, NgZone } from '@angular/core';
import { NavController, Platform, NavParams, ViewController } from 'ionic-angular';
import { Keyboard } from '@ionic-native/keyboard';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { GroupChatPage } from '../groupChat/groupChat';

@Component({
  selector: 'page-messageSentSuccessfully',
  templateUrl: 'messageSentSuccessfully.html',
  providers: [Keyboard]
})

export class MessageSentSuccessfullyPage {

  private arrivedFrom: string = '' // Mendatory if you want to perform custom behavior after countdown finished
  private message: string = ''
  private navigationMessage: string = ''
  private buttonText: string = ''

  public timer: any;
  public maxTime = 3;
  private isGroup: boolean = false
  private mGroupInfo: any;



  constructor(public platform: Platform, public navCtrl: NavController, public params: NavParams, private keyboard: Keyboard, public viewCtrl: ViewController, private sqlite: SQLite) {

    this.keyboard.disableScroll(true);

    this.arrivedFrom = this.params.get('arrivedFrom')
    this.message = this.params.get('message')
    this.navigationMessage = this.params.get('navigationMessage')
    this.buttonText = this.params.get('buttonText')

    this.isGroup = this.params.get('is_group');
    this.mGroupInfo = this.params.get('group_info')
    this.startTimer();
  }

  startTimer() {
    let thisObj = this;
    this.timer = setTimeout(() => {
      if (thisObj.maxTime > 0) {
        thisObj.maxTime -= 1;
        thisObj.startTimer();
      }
      else {
        debugger
        if (this.arrivedFrom == 'SendMessagePage') {
          if (thisObj.isGroup) {
            thisObj.navigateToGroup(thisObj.mGroupInfo)
            return
          } else {
            thisObj.dismiss(true)
            return
          }
        } else {
          // Default behavior after countdown finished
          thisObj.dismiss(true)
          return
        }
      }
    }, 1000);
  }

  dismiss(redirect) {
    this.keyboard.close();
    this.viewCtrl.dismiss({ redirect: redirect });
  }

  navigateToGroup(mGroupInfo) {
    this.viewCtrl.dismiss({ redirect: false, group_info: mGroupInfo });
  }
}


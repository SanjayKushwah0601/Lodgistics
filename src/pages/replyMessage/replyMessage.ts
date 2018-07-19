import { Component, NgZone, ViewChild, ElementRef } from '@angular/core';
import { NavController, AlertController, Platform, ModalController, NavParams, ViewController, Events } from 'ionic-angular';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Validator } from '../../validator';
import { srviceMethodsCall } from '../../services/serviceMethods';
import { Keyboard } from '@ionic-native/keyboard';
import { NativeStorage } from '@ionic-native/native-storage';

@Component({
  selector: 'page-replyMessage',
  templateUrl: 'replyMessage.html',
  providers: [srviceMethodsCall, Keyboard, NativeStorage]
})

export class ReplyMessagePage {
  @ViewChild('test') myInput;

  public tempMessageData: any;
  public users: any;
  public mentionStr: any;
  public messageText = "";
  public mentionUsers = [];
  public mentionMembers = [];
  public userId: any;
  public showSub;
  public hideSub;
  public marginBottom = 0;
  public showMentions = false;
  public mentionMembersFilter = [];
  public items = [];
  public oldMsgTextValue = "";

  constructor(private element: ElementRef, public platform: Platform, public params: NavParams, private keyboard: Keyboard, public viewCtrl: ViewController, public zone: NgZone, modalCtrl: ModalController, public commonMethod: srviceMethodsCall, public events: Events, public nativeStorage: NativeStorage) {

    setTimeout(() => {
      this.element.nativeElement.querySelector('#textarea').focus()
    }, 1000);

    this.tempMessageData = this.params.get('message');
    this.users = this.params.get('users');
    this.userId = this.params.get('userId');
    this.mentionMembers = this.params.get('mentionMembers');
    // this.keyboard.disableScroll(true);


    for (let i = 0; i < this.mentionMembers.length; i++) {
      if (this.mentionMembers[i].id != this.userId && this.mentionMembers[i].is_system_user != '1') {
        this.items.push(this.mentionMembers[i]);
      }
    }
    this.mentionMembers = this.items;
    this.mentionMembersFilter = this.mentionMembers;

    let allChatMentions = [];
    if (this.tempMessageData.message_obj.mentioned_user_ids != '' && this.tempMessageData.message_obj.mentioned_user_ids != null) {
      allChatMentions = this.tempMessageData.message_obj.mentioned_user_ids;
    }
    this.mentionStr = this.commonMethod.getMentionString(allChatMentions, this.users);
    this.showSub = this.keyboard.onKeyboardShow().subscribe(data => {
      //this.keyboard.disableScroll(true);
      // this.myInput.setFocus();
      console.log('keyboard is shown');
      console.log("screen height=" + data.keyboardHeight);

      this.zone.run(() => {
        //this.checkPageHeight();
        this.marginBottom = data.keyboardHeight;

      });

    });

    this.hideSub = this.keyboard.onKeyboardHide().subscribe(data => {
      console.log('keyboard is hide');
      // this.events.publish('hide:keyboard');
      //this.classnameForFooter = "openKeyboard";
      this.marginBottom = 0;

    });

  }



  dismiss() {
    // this.events.publish('hide:keyboard');
    // this.keyboard.close();
    this.viewCtrl.dismiss('');
  }

  send() {
    // this.events.publish('hide:keyboard');
    // this.keyboard.close();
    this.viewCtrl.dismiss({ msg: this.messageText.trim(), mentionUsers: this.mentionUsers });
  }

  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  removeLastInstance(badtext, str) {
    var charpos = str.toLowerCase().lastIndexOf(badtext.toLowerCase());
    if (charpos < 0) return str;
    let ptone = str.substring(0, charpos);
    let pttwo = str.substring(charpos + (badtext.length));
    return (ptone + pttwo);
  }
  selectUser(e, memberInfo, add) {
    let mentionAdded = true;

    if (this.showMentions == true && this.messageText != "") {
      let strArray = this.messageText.trim().split(" ");
      // Display array values on page
      for (var i = 0; i < strArray.length; i++) {
        if (strArray[i].charAt(0) == "@" && strArray.length == (i + 1)) {
          this.zone.run(() => {
            this.messageText = this.removeLastInstance(strArray[i], this.messageText);
            /* this is only for android */
            if (this.messageText.trim() == "") {
              this.messageText = this.messageText.trim();
            }
            this.mentionMembersFilter = this.items;
            this.messageText = this.messageText;

            this.messageText = this.messageText + "@" + memberInfo.name + " ";
            // this.mentionMembers=this.items;
            mentionAdded = false;
          });
        }
      }
    }
    if (this.mentionUsers.length > 0) {
      let insertFlag = true;
      for (let i = 0; i < this.mentionUsers.length; i++) {
        if (this.mentionUsers[i].id == memberInfo.id && add != true) {

          let removeStr = "@" + this.mentionUsers[i].name + " ";
          console.log(this.messageText + "  " + this.mentionUsers[i].name + " removeStr" + removeStr);

          this.zone.run(() => {
            console.log(this.messageText + "  " + this.mentionUsers[i].name + " removeStr" + removeStr);
            //this.messageText = this.messageText.replace(removeStr,'');      
            this.messageText = this.messageText.replace(new RegExp(this.escapeRegExp(removeStr), 'g'), '');
          });
          insertFlag = false;
          this.mentionUsers.splice(i, 1);
        }
        else if (this.mentionUsers[i].id == memberInfo.id) {
          insertFlag = false;
        }
      }
      if (insertFlag == true) {
        this.mentionUsers.push(memberInfo);
        if (mentionAdded) {
          this.zone.run(() => {
            this.messageText = this.messageText + "@" + memberInfo.name + " ";
          });

        }
      }
    }
    else {
      this.mentionUsers.push(memberInfo);
      if (mentionAdded) {
        this.zone.run(() => {
          this.messageText = this.messageText + "@" + memberInfo.name + " ";
        });

      }
    }

    this.showMentions = false;
    if (e != undefined) {
      e.preventDefault();
    }
  }

  selectAllMention(e, flag) {
    if (flag) {
      this.mentionUsers = [];
      for (let i = 0; i < this.mentionMembers.length; i++) {
        if (this.mentionMembers[i].id != this.userId && this.mentionMembers[i].is_system_user != 1) {
          this.mentionUsers.push(this.mentionMembers[i]);
          this.zone.run(() => {
            if (this.messageText.indexOf("@" + this.items[i].name) == -1) {
              this.messageText = this.messageText + "@" + this.items[i].name + " ";
            }
          });
        }
      }
    } else {
      for (let i = 0; i < this.mentionUsers.length; i++) {

        let removeStr = "@" + this.mentionUsers[i].name + " ";
        console.log(this.messageText + "  " + this.mentionUsers[i].name + " removeStr" + removeStr);

        this.zone.run(() => {
          console.log(this.messageText + "  " + this.mentionUsers[i].name + " removeStr" + removeStr);
          this.messageText = this.messageText.replace(new RegExp(this.escapeRegExp(removeStr), 'g'), '');
        });
      }
      this.mentionUsers = [];

    }
    e.preventDefault();

  }

  showSelected(id) {
    let className = false;
    for (let i = 0; i < this.mentionUsers.length; i++) {
      if (this.mentionUsers[i].id == id) {
        className = true;
      }
    }
    return className;
  }

  updateName(sourceText) {
    return sourceText = sourceText.replace(/ /g, "<small style='color:#fff;'>.</small>");
  }

  changeModelValue(e) {
    this.zone.run(() => {
      this.messageText = this.messageText;
      this.mentionMembersFilter = this.mentionMembers;
    });
  }

  keyDownCheck(e) {
    // e.preventDefault();
    this.oldMsgTextValue = this.messageText;
    console.log("11ketdown" + this.messageText);
  }

  preventFocusChange(e) {
    // e.preventDefault();
  }

  valchange(e) {

    console.log("==" + e.key);
    //console.log("=="+e.keyCode);
    //console.log("==" + JSON.stringify(e));
    //if (e.key != "Backspace") {   // only for ios
    if (!(this.oldMsgTextValue.length > this.messageText.length))   // only for android
    {

      this.zone.run(() => {
        //this.messageText = this.messageText;

        //this.mentionMembersFilter=this.mentionMembers;

        if (this.messageText && this.messageText != "") {
          let strArray = this.messageText.trim().split(" ");
          // Display array values on page
          for (var i = 0; i < strArray.length; i++) {
            if (strArray[i].charAt(0) == "@" && strArray.length == (i + 1)) {
              this.showMentions = true;
              let val = strArray[i].toString().substr(1);
              if (val.trim() != "") {
                let tempMentions = [];
                for (let l = 0; l < this.mentionMembersFilter.length; l++) {

                  let tempUserName = this.mentionMembersFilter[l].name.toLowerCase().split(" ");
                  if (this.mentionMembersFilter[l] != undefined && this.mentionMembersFilter[l].id != this.userId && tempUserName[0] == val.toLowerCase()) {
                    //this.showMentions=false;
                    this.selectUser(undefined, this.mentionMembersFilter[l], true);
                    tempMentions = this.mentionMembersFilter;
                  }
                  else if (this.mentionMembersFilter[l] != undefined && this.mentionMembersFilter[l].id != this.userId && this.mentionMembersFilter[l].name.toLowerCase().search(val.toLowerCase()) > -1) {
                    tempMentions.push(this.mentionMembersFilter[l]);
                  }
                }
                this.mentionMembersFilter = tempMentions;
              }
            }
            else {
              this.showMentions = false;
            }
          }
        }
        else {
          this.showMentions = false;
        }

      });
    }
  }
  ionViewDidLoad() {
    console.log("I'm alive!");
    this.platform.ready().then(() => {
      this.platform.pause.subscribe(() => {
        console.log("pause");
      });
      this.platform.resume.subscribe(() => {
        console.log("resume");
        setTimeout(() => {
          this.nativeStorage.getItem('notificatio_click').then(
            click => {
              if (click.click) {
                this.viewCtrl.dismiss('');
              }
            });
        }, 2000);
      });
    });
  }
}

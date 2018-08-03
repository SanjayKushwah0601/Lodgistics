import { Component, NgZone, ViewChild, ElementRef } from '@angular/core';
import { NavController, NavParams, Content, AlertController, Platform, Events, ViewController } from 'ionic-angular';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Validator } from '../../validator';
import { srviceMethodsCall } from '../../services/serviceMethods';
import { getFeedsUrl, getMentionables } from '../../services/configURLs';
import { NativeStorage } from '@ionic-native/native-storage';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { Keyboard } from '@ionic-native/keyboard';
import { createFeedUrl } from '../../services/configURLs';
import { Navbar } from 'ionic-angular';
import { ChattingPage } from '../chatting/chatting';
import { MyMentionPage } from '../myMention/myMention';
import { ProfilePage } from '../profile/profile';
import { FeedsPage } from '../feeds/feeds';
import { MyVideosPage } from '../myVideos/myVideos';
import { CreateFeedsPage } from '../createFeeds/createFeeds';
import { TranslationService } from '../../providers/translation.service';
import { WorkOrderPage } from '../workOrder/workOrder';
import { TaskChecklistPage } from '../taskChecklist/taskChecklist';
import { TaskChecklistDetailPage } from '../taskChecklistDetail/taskChecklistDetail';
import { UtilMethods } from '../../services/utilMethods';

@Component({
  selector: 'page-feedDetail',
  templateUrl: 'feedDetail.html',
  providers: [UtilMethods, srviceMethodsCall, NativeStorage, Keyboard, SQLite, TranslationService]
})
export class FeedDetailPage {
  @ViewChild(Navbar) navbar: Navbar;
  @ViewChild(Content) content: Content;
  @ViewChild('mainScreenHeight') elementView: ElementRef;

  public foundRepos: any;
  public comment;
  public commentForm: FormGroup;
  public classnameForFooter = '';
  public currentdate = new Date(new Date().setHours(0, 0, 0, 0));
  public members = [];
  public mentionUsers = [];
  public userId: any;
  public postButtonEnable = false;
  public isKeyboardOpen = false;
  public showSub;
  public hideSub;
  public scrollTopPos = 0;
  public feedComment = "";
  public feed_comment_id;
  public isPopupOpen = false;
  public feedID;
  public highlightComment = false;
  public touchtime = 0;
  public showMentions = false;
  public mentionMembers = [];
  public totalMentionUsers = 0;
  public alert: any;
  public oldFeedTextValue = "";
  public spinner = false;
  public apiInProgress = false;

  constructor(public navCtrl: NavController, public _FB: FormBuilder, public commonMethod: srviceMethodsCall, private viewCtrl: ViewController, public alertCtrl: AlertController, public nativeStorage: NativeStorage, public navParams: NavParams, private keyboard: Keyboard, public zone: NgZone, private sqlite: SQLite, public platform: Platform, public events: Events, public translationservice: TranslationService, public utilMethods: UtilMethods) {

    this.getAllMembersFromDb();

    this.checkPageHeight();
    this.feedID = this.navParams.get('feed_id');
    this.feed_comment_id = this.navParams.get('feed_comment_id');

    this.zone.run(() => {
      this.postButtonEnable = false;
      this.feedComment = "";
    });
    this.showSub = this.keyboard.onKeyboardShow().subscribe(data => {
      this.keyboard.disableScroll(true);
      console.log('keyboard is shown');

      this.zone.run(() => {
        let dimensions = this.content.getContentDimensions();
        let scrollTop = this.content.scrollTop;
        let contentHeight = dimensions.contentHeight;
        let scrollHeight = dimensions.scrollHeight;
        console.log("contentHeight= " + contentHeight + "   scrollHeight= " + scrollHeight + " scrollTop= " + scrollTop);
        this.scrollTopPos = scrollTop;
        let totalHeight = parseInt(data.keyboardHeight) + scrollTop;
        this.content.scrollTo(0, totalHeight);
        this.platform.ready().then(() => {
          if (this.elementView != undefined && parseInt(this.elementView.nativeElement.offsetHeight) >= 144) {
            this.isKeyboardOpen = true;

            if (data.keyboardHeight > 230) {
              this.classnameForFooter = "openKeyboardWithSpellCheck";
            } else {
              this.classnameForFooter = "openKeyboard";
            }
          }
          else {
            this.isKeyboardOpen = false;
            if (data.keyboardHeight > 230) {
              this.classnameForFooter = "openKeyboardWithSpellCheck2";
            } else {
              this.classnameForFooter = "openKeyboard2";
            }
          }
        });

      });

    });

    this.hideSub = this.keyboard.onKeyboardHide().subscribe(data => {
      console.log('keyboard is hide');
      this.events.publish('hide:keyboard');

      this.isKeyboardOpen = false;
      this.zone.run(() => {
        let totalHeight = this.scrollTopPos;
        this.content.scrollTo(0, totalHeight);
        this.classnameForFooter = "closeKeyboard";
        this.checkPageHeight();
      });
    });


    this.commentForm = _FB.group({
      comment: Validator.feedCreateValidator
    });
    this.comment = this.commentForm.controls['comment'];

    let alertVar = this.alertCtrl.create({
      title: 'Error!',
      subTitle: 'Invalid Details!',
      buttons: ['OK']
    });


    this.nativeStorage.getItem('user_auth').then(
      accessToken => {
        this.userId = accessToken.user_id;

        if (this.commonMethod.checkNetwork()) {
          this.spinner = true;
          this.commonMethod.getDataWithoutLoder(getFeedsUrl + '/' + this.navParams.get('feed_id'), accessToken).subscribe(
            data => {
              this.foundRepos = data.json();
              this.spinner = false;
              if (this.feed_comment_id != null) {
                setTimeout(() => {
                  this.highlightComment = true;

                  this.scrollTo(this.feed_comment_id);
                  this.highlightComment = true;
                  setTimeout(() => {
                    this.highlightComment = false;
                  }, 2500);
                }, 500);
              }
            },
            err => {
              this.spinner = false;
              alertVar.present();
              console.error("Error : " + err);
            },
            () => {
              console.log('getData completed');
            }
          );

        }
        else {
          this.commonMethod.showNetworkError();
        }

      },
      error => {
        return '';
      }
    );

  }
  onKey(event: any) { // without type info
    //this.values += event.target.value + ' | ';
    if (event.target.value.trim().length > 0) {
      this.zone.run(() => {
        this.postButtonEnable = true;
      });
    } else {
      this.zone.run(() => {
        this.postButtonEnable = false;
      });
    }
  }
  closekeyboard() {
    this.classnameForFooter = "closeKeyboard";
    this.keyboard.close();
  }
  commentOnFeed(formData) {
    let feedCommentData = formData.comment.trim();
    feedCommentData = this.utilMethods.nlToBr(feedCommentData);
    //feedCommentData = this.commonMethod.replaceURLWithHTMLLinks(feedCommentData);

    let mentionId = [];
    if (this.mentionUsers.length > 0) {
      for (let i = 0; i < this.mentionUsers.length; i++) {
        mentionId.push(this.mentionUsers[i].id);
        // feedCommentData = feedCommentData.replace("@"+this.mentionUsers[i].name,'');

        let mention_user_id = this.mentionUsers[i].id;
        this.commonMethod.updateMentionsDb(mention_user_id, 'post', 1);
      }
      this.mentionUsers = [];
    }



    let objData = { 'feed': { 'body': feedCommentData, 'parent_id': this.navParams.get('feed_id'), mentioned_user_ids: mentionId } };

    let alertVar = this.alertCtrl.create({
      title: 'Error!',
      subTitle: 'Invalid Details!',
      buttons: ['OK']
    });

    this.nativeStorage.getItem('user_auth').then(
      accessToken => {

        if (this.commonMethod.checkNetwork()) {

          this.apiInProgress = true;
          this.commonMethod.postDataWithoutLoder(createFeedUrl, objData, accessToken).subscribe(
            data => {
              //this.foundRepos1 = data.json();
              //console.error(this.foundRepos1);
              /* code to reload page data */
              this.keyboard.close();
              this.commentForm.reset();
              this.zone.run(() => {
                this.postButtonEnable = false;
                this.feedComment = "";
              });
              this.nativeStorage.getItem('user_auth').then(
                accessToken => {
                  this.commonMethod.getDataWithoutLoder(getFeedsUrl + '/' + this.navParams.get('feed_id'), accessToken).subscribe(
                    data => {
                      this.foundRepos = data.json();
                      this.apiInProgress = false;
                      //console.error(this.foundRepos);

                      setTimeout(() => {
                        this.checkPageHeight();
                      }, 800);
                      //alert(this.foundRepos); 
                    },
                    err => {
                      this.apiInProgress = false;
                      alertVar.present();
                      console.error("Error : " + err);
                    },
                    () => {
                      console.log('getData completed');
                    }
                  );
                },
                error => {
                  return '';
                }
              );


            },
            err => {
              this.apiInProgress = false;
              alertVar.present();
              console.error("Error : " + err);
            },
            () => {
              console.log('getData completed');
            }
          );

        }
        else {
          this.commonMethod.showNetworkError();
        }

      },
      error => {
        return '';
      }
    );
  }

  // TODO: Need to move this function into utility folder. 
  updateHtml(val, mentioned_targets) {
    let allChatMentions = [];
    if (mentioned_targets != '' && mentioned_targets != null) {
      allChatMentions = mentioned_targets;
    }

    // let mentionStr = this.commonMethod.getMentionString(allChatMentions, this.members);
    // if (mentionStr != "") {
    //   // val = mentionStr + val;
    // }

    let newValue = this.commonMethod.getTextValueNew(allChatMentions, this.members, val);
    if (newValue != "") {
      val = newValue;
    }

    return val.replace(/text-decoration-line/g, "text-decoration");
  }

  //TODO: Need to move this function into utility folder. 
  updateHtml1(val) {
    let allChatMentions = [];
    let newValue = this.commonMethod.getTextValueNew(allChatMentions, this.members, val);
    if (newValue != "") {
      val = newValue;
    }

    return val.replace(/text-decoration-line/g, "text-decoration");
  }

  getAllMembersFromDb() {
    this.sqlite.create({
      name: 'data.db',
      location: 'default'
    }).then((db: SQLiteObject) => {

      db.executeSql("SELECT members.*,user_mentions.total FROM members LEFT JOIN user_mentions on user_mentions.user_id=members.user_id AND type='post' AND type_id='1' ORDER BY user_mentions.total DESC, members.name ASC", {}).then((allMembers) => {
        console.log("SELECT MEMBERS FROM DB: " + JSON.stringify(allMembers));

        if (allMembers.rows.length > 0) {
          for (let i = 0; i < allMembers.rows.length; i++) {
            let tempUserInfo = {
              "id": allMembers.rows.item(i).user_id,
              "name": allMembers.rows.item(i).name,
              "image": allMembers.rows.item(i).image,
              "is_system_user": allMembers.rows.item(i).is_system_user,
              "total": allMembers.rows.item(i).total,
              "type": 'User',
            };

            if (allMembers.rows.item(i).user_id != this.userId && allMembers.rows.item(i).is_system_user != 1) {
              this.totalMentionUsers += 1;
            }

            this.members.push(tempUserInfo);
            console.log(JSON.stringify(this.members));
          }
        }
        this.nativeStorage.getItem('mentionable')
          .then((data) => {
            if (data) {
              for (let i = 0; i < data.departments.length; i++) {
                let tempUserInfo = {
                  "id": data.departments[i].id,
                  "name": data.departments[i].name,
                  "type": 'Department',
                  "image": 'https://vertua.com.ph/wp-content/uploads/2015/03/avatar.png',
                  // "total": allMembers.rows.item(i).total
                };
                this.totalMentionUsers += 1;
                this.members.push(tempUserInfo);
              }
              console.log(data)
            } else {
              this.getMentionableFromServer()
            }
          }).catch((err) => {
            this.getMentionableFromServer()
          })

      }, (error1) => {
        console.log("SELECT MEMBERS ERROR: " + JSON.stringify(error1));
      });

    }).catch(e => console.log(e));
  }

  getMentionableFromServer() {
    this.nativeStorage.getItem('user_auth').then(
      accessToken => {
        if (this.commonMethod.checkNetwork()) {
          this.commonMethod.getDataWithoutLoder(getMentionables, accessToken).subscribe(
            data => {
              let foundRepos = data.json();
              for (let i = 0; i < foundRepos.departments.length; i++) {
                let tempUserInfo = {
                  "id": foundRepos.departments[i].id,
                  "name": foundRepos.departments[i].name,
                  "type": 'Department',
                  "image": 'https://vertua.com.ph/wp-content/uploads/2015/03/avatar.png',
                };
                this.members.push(tempUserInfo);
              }

              console.log(foundRepos)
            }, err => {
              // alertVar.present();
              console.error("Error : " + err);
            },
            () => {
              console.log('getData completed');
            })
        }
      })
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
    if (this.showMentions == true && this.feedComment != "") {
      let strArray = this.feedComment.trim().split(" ");
      // Display array values on page
      for (var i = 0; i < strArray.length; i++) {
        if (strArray[i].charAt(0) == "@" && strArray.length == (i + 1)) {
          //this.zone.run(() => {
          this.feedComment = this.removeLastInstance(strArray[i], this.feedComment);
          //});
          /* this is only for android */
          if (this.feedComment.trim() == "") {
            this.feedComment = this.feedComment.trim();
          }
          this.feedComment = this.feedComment + "@" + memberInfo.name + " ";
          mentionAdded = false;
        }
      }
    }
    if (this.mentionUsers.length > 0) {
      let insertFlag = true;
      for (let i = 0; i < this.mentionUsers.length; i++) {
        if (this.mentionUsers[i].id == memberInfo.id && add != true) {
          let removeStr = "@" + this.mentionUsers[i].name + " ";
          console.log(this.feedComment + "  " + this.mentionUsers[i].name + " removeStr" + removeStr);

          this.zone.run(() => {
            console.log(this.feedComment + "  " + this.mentionUsers[i].name + " removeStr" + removeStr);
            //this.feedComment = this.feedComment.replace(removeStr,''); 
            this.feedComment = this.feedComment.replace(new RegExp(this.escapeRegExp(removeStr), 'g'), '');
            // this.feedText = this.feedText.trim();
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
            if (this.feedComment && this.feedComment.length > 0 && !this.feedComment.endsWith(' ')) {
              this.feedComment = this.feedComment + " "
            }
            this.feedComment = this.feedComment + "@" + memberInfo.name + " ";
          });
        }
      }
    }
    else {
      this.mentionUsers.push(memberInfo);
      if (mentionAdded) {
        this.zone.run(() => {
          if (this.feedComment && this.feedComment.length > 0 && !this.feedComment.endsWith(' ')) {
            this.feedComment = this.feedComment + " "
          }
          this.feedComment = this.feedComment + "@" + memberInfo.name + " ";
        });
      }
    }

    this.showMentions = false;
    if (e != undefined) {
      e.preventDefault();
      //e.stopPropagation();
    }
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

  showImage(url) {
    this.isPopupOpen = true;
    let w = window.screen.width / 100 * 45;
    //let imgStyle="width='"+w+"px"+' height='"+w+"px"+'";
    //console.log(w);
    this.alert = this.alertCtrl.create({
      title: '',
      message: '<div class="img-loader"></div><img src="' + url + '" class="loaded-image" alt="Loading..." >',
      cssClass: 'image_upload_alert show-image-alert',
      buttons: [
        {
          text: 'Close',
          role: 'cancel',
          handler: data => {
            console.log('Cancel clicked');
            this.isPopupOpen = false;
          }
        }
      ]
    });
    this.alert.present();
  }

  selectAllMention(flag) {
    if (flag) {
      this.mentionUsers = [];

      for (let i = 0; i < this.members.length; i++) {

        if (this.members[i].id != this.userId && this.members[i].is_system_user != 1) {
          this.mentionUsers.push(this.members[i]);
          if (this.feedComment.indexOf("@" + this.members[i].name) == -1) {
            this.zone.run(() => {
              this.feedComment = this.feedComment + "@" + this.members[i].name + " ";
            });
          }
        }
      }
    } else {

      for (let i = 0; i < this.mentionUsers.length; i++) {

        let removeStr = "@" + this.mentionUsers[i].name + " ";
        console.log(this.feedComment + "  " + this.mentionUsers[i].name + " removeStr" + removeStr);

        this.zone.run(() => {
          console.log(this.feedComment + "  " + this.mentionUsers[i].name + " removeStr" + removeStr);
          this.feedComment = this.feedComment.replace(new RegExp(this.escapeRegExp(removeStr), 'g'), '');
        });
      }
      this.mentionUsers = [];
    }
    //e.preventDefault();

  }

  ionViewDidEnter() {


    this.platform.ready().then(() => {
      this.platform.registerBackButtonAction(() => {

        // console.log();
        //this.events.publish('hide:keyboard');
        //this.keyboard.close();
        //setTimeout(() => {
        // this.nativeStorage.getItem("lastPage")
        //   .then(
        //   pageDetail => {
        //     if (pageDetail.pageName) {

        //       if (pageDetail.index) {
        //         if (pageDetail.index != -1) {
        //           this.navCtrl.popTo(pageDetail.index);
        //         } else {
        //           this.navCtrl.setRoot(FeedsPage);
        //         }
        //       } else if (pageDetail.pageName == MyMentionPage.name) {
        //         this.navCtrl.setRoot(MyMentionPage);
        //       } else if (pageDetail.pageName == ChattingPage.name) {
        //         this.navCtrl.setRoot(ChattingPage);
        //       } else if (pageDetail.pageName == ProfilePage.name) {
        //         this.navCtrl.pop({});
        //       }else if (pageDetail.pageName == MyVideosPage.name) {
        //         //this.navCtrl.setRoot(ProfilePage);
        //         this.navCtrl.pop({});
        //       } else if (pageDetail.pageName == CreateFeedsPage.name) {
        //         this.navCtrl.push(CreateFeedsPage)
        //       }else if (pageDetail.pageName == WorkOrderPage.name) {
        //         this.navCtrl.setRoot(WorkOrderPage);
        //       }else if (pageDetail.pageName == TaskChecklistPage.name || pageDetail.pageName == TaskChecklistDetailPage.name) {
        //         this.navCtrl.setRoot(TaskChecklistPage);
        //       } else {
        //         this.navCtrl.setRoot(FeedsPage);
        //       }
        //     }
        //     else {
        //       this.navCtrl.setRoot(FeedsPage);
        //     }
        //   }),
        //   error => {
        //     this.navCtrl.setRoot(FeedsPage);
        //   };


      },
        100);
    });
    //});
    // this.navbar.backButtonClick = () => {
    //   console.log();

    //   this.events.publish('hide:keyboard');
    //   this.keyboard.close();

    //   setTimeout(() => {
    //     this.nativeStorage.getItem("lastPage")
    //       .then(
    //       pageDetail => {
    //         if (pageDetail.pageName) {
    //           // if (pageDetail.index) {
    //           //   if(pageDetail.index!=-1){
    //           //   this.navCtrl.popTo(pageDetail.index);
    //           //   }else{
    //           //     this.navCtrl.setRoot(FeedsPage);
    //           //   }
    //           // } else 
    //           if (pageDetail.pageName == MyMentionPage.name) {
    //             this.navCtrl.setRoot(MyMentionPage);
    //           } else if (pageDetail.pageName == ChattingPage.name) {
    //             this.navCtrl.setRoot(ChattingPage);
    //           } else if (pageDetail.pageName == ProfilePage.name) {
    //             this.navCtrl.pop({});
    //           } else if (pageDetail.pageName == MyVideosPage.name) {
    //             //this.navCtrl.setRoot(ProfilePage);
    //             this.navCtrl.pop({});
    //           }else if (pageDetail.pageName == CreateFeedsPage.name) {
    //             this.navCtrl.push(CreateFeedsPage)
    //           } else if (pageDetail.pageName == WorkOrderPage.name) {
    //             this.navCtrl.setRoot(WorkOrderPage);
    //           }else if (pageDetail.pageName == TaskChecklistPage.name || pageDetail.pageName == TaskChecklistDetailPage.name) {
    //             this.navCtrl.setRoot(TaskChecklistPage);
    //           }else {
    //             this.navCtrl.setRoot(FeedsPage);
    //           }
    //         }
    //         else {
    //           this.navCtrl.setRoot(FeedsPage);
    //         }
    //       }),
    //       error => {
    //         this.navCtrl.setRoot(FeedsPage);
    //       };


    //   },
    //     100);

    // }
    this.navbar.backButtonClick = (e: UIEvent) => {
      // Print this event to the console
      console.log(e);

      // Navigate to another page
      this.events.publish('hide:keyboard');
      this.keyboard.close();
      setTimeout(() => {
        // this.navCtrl.pop();
        this.nativeStorage.getItem("lastPage")
          .then(
            pageDetail => {
              if (pageDetail.pageName) {
                if (pageDetail.pageName == MyMentionPage.name) {
                  this.navCtrl.setRoot(MyMentionPage);
                } else if (pageDetail.pageName == FeedsPage.name) {
                  this.navCtrl.setRoot(FeedsPage);
                } else if (pageDetail.pageName == ProfilePage.name) {
                  this.navCtrl.pop({});
                } else if (pageDetail.pageName == MyVideosPage.name) {
                  //this.navCtrl.setRoot(ProfilePage);
                  this.navCtrl.pop({});
                } else if (pageDetail.pageName == CreateFeedsPage.name) {
                  this.navCtrl.push(CreateFeedsPage)
                } else if (pageDetail.pageName == WorkOrderPage.name) {
                  this.navCtrl.setRoot(WorkOrderPage);
                } else if (pageDetail.pageName == TaskChecklistPage.name || pageDetail.pageName == TaskChecklistDetailPage.name) {
                  this.navCtrl.setRoot(TaskChecklistPage);
                } else {
                  this.navCtrl.setRoot(ChattingPage);
                }
              }
              else {
                this.navCtrl.setRoot(ChattingPage);
              }
            }),
          error => {
            this.navCtrl.setRoot(ChattingPage);
          };
        //this.navCtrl.setRoot(ChattingPage);
      },
        100);

    }

    this.checkPageHeight();

    this.content.ionScrollEnd.subscribe((data) => {

      let dimensions = this.content.getContentDimensions();

      let scrollTop = this.content.scrollTop;
      let contentHeight = dimensions.contentHeight;
      let scrollHeight = dimensions.scrollHeight;
      console.log("contentHeight" + contentHeight + "   scroll h " + scrollHeight + " scrollTop " + scrollTop);


    });

  }

  checkPageHeight() {
    this.platform.ready().then(() => {
      this.zone.run(() => {
        if (this.elementView != undefined && parseInt(this.elementView.nativeElement.offsetHeight) < 144) {
          this.keyboard.disableScroll(true);
          console.log("disableScroll true");
        }
        else {
          this.keyboard.disableScroll(false);
          console.log("disableScroll false");
        }
      });
    });
  }

  imageLoaded() {
    this.checkPageHeight();
  }

  onScroll(e) {
    //this.closekeyboard();
    //alert('hi');
    console.log("==" + e);
  }

  pressScreen() {
    console.log('hi');
  }

  ionViewWillLeave() {
    console.log("Looks like I'm about to leave :(");
    if (this.showSub) {
      this.showSub.unsubscribe();
      console.log("show unsubscribe");
    }
    if (this.hideSub) {
      this.hideSub.unsubscribe();
      console.log("hide unsubscribe");
    }
  }

  scrollTo(elementId: string) {
    if (document.getElementById(elementId) != null && document.getElementById(elementId) != undefined) {
      let yOffset = document.getElementById(elementId).offsetTop;
      this.content.scrollTo(100, yOffset - 100, 2000);
    }
  }

  changeModelValue() {
    this.zone.run(() => {
      this.feedComment = this.feedComment;
      this.mentionMembers = this.members;
    });
  }

  keyDownCheck(e) {
    this.oldFeedTextValue = this.feedComment;
    console.log("11ketdown" + this.feedComment);
  }

  valchange(e) {
    console.log("==" + e.key);
    //console.log("=="+e.keyCode);
    //console.log("==" + JSON.stringify(e));
    //if (e.key != "Backspace") {   // only for ios
    if (!(this.oldFeedTextValue.length > this.feedComment.length))   // only for android
    {
      this.zone.run(() => {
        //this.feedComment=this.feedComment;
        //this.mentionMembers=this.members;
        if (this.feedComment && this.feedComment != "") {
          let strArray = this.feedComment.trim().split(" ");
          // Display array values on page
          for (var i = 0; i < strArray.length; i++) {
            if (strArray[i].charAt(0) == "@" && strArray.length == (i + 1)) {
              this.showMentions = true;
              let val = strArray[i].toString().substr(1);
              if (val.trim() != "") {
                let tempMentions = [];
                for (let l = 0; l < this.members.length; l++) {
                  let tempUserName = this.members[l].name.toLowerCase().split(" ");
                  if (this.members[l] != undefined && this.members[l].id != this.userId && tempUserName[0] == val.toLowerCase()) {
                    //this.showMentions=false;
                    this.selectUser('', this.members[l], true);
                  }
                  else if (this.members[l] != undefined && this.members[l].id != this.userId && this.members[l].name.toLowerCase().search(val.toLowerCase()) > -1) {
                    tempMentions.push(this.members[l]);
                  }
                }
                this.mentionMembers = tempMentions;
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


  translate(title, sourceText, langCode, root, i) {

    sourceText = sourceText.replace(/\n/g, "<br/>");

    // let firstPos = sourceText.indexOf("<span");
    // let lastPos = sourceText.indexOf("</span>");
    let tempStr = "";
    // if (firstPos == 0) {
    //   tempStr = sourceText.substring(firstPos, lastPos + 7);
    //   sourceText = sourceText.substring(lastPos + 7);
    // }

    //alert(i);
    //alert(j);
    //alert(this.foundRepos[i].value[j].id);

    if (this.touchtime == 0) {
      this.touchtime = new Date().getTime();
    } else {
      if (((new Date().getTime()) - this.touchtime) < 400) {
        //alert("double clicked");

        this.touchtime = 0;
        if (title != '' && root == true) {
          this.translateTitle(title, langCode, i);
        }
        //this.foundRepos.replies[i].body = this.foundRepos.replies[i].temp_data;

        if (root == true && this.foundRepos.temp_data != undefined && this.foundRepos.temp_data != "") {
          this.foundRepos.body = this.foundRepos.temp_data;
          this.foundRepos.temp_data = "";
        }
        else if (root == false && this.foundRepos.replies[i].temp_data != undefined && this.foundRepos.replies[i].temp_data != "") {
          this.foundRepos.replies[i].body = this.foundRepos.replies[i].temp_data;
          this.foundRepos.replies[i].temp_data = "";
        }
        else {
          this.commonMethod.showLoader();
          this.translationservice.translateText(sourceText, langCode).subscribe(data => {
            if (data.detectedSourceLanguage == "en") {
              if (root == true) {
                this.foundRepos.temp_data = this.foundRepos.body;
                this.foundRepos.body = tempStr + data.translatedText;
              }
              else {
                this.foundRepos.replies[i].temp_data = this.foundRepos.replies[i].body;
                this.foundRepos.replies[i].body = tempStr + data.translatedText;
              }
              this.commonMethod.hideLoader();
            }
            else {
              this.translationservice.translateText(sourceText, 'en').subscribe(data => {

                if (root == true) {
                  this.foundRepos.temp_data = this.foundRepos.body;
                  this.foundRepos.body = tempStr + data.translatedText;
                }
                else {
                  this.foundRepos.replies[i].temp_data = this.foundRepos.replies[i].body;
                  this.foundRepos.replies[i].body = tempStr + data.translatedText;
                }
                this.commonMethod.hideLoader();
              }, error => {
                this.commonMethod.hideLoader();
                let alert = this.alertCtrl.create({
                  subTitle: 'Error:' + '<br>' + error,
                  buttons: ['OK']
                });
                alert.present();
              });
            }
          }, error => {
            this.commonMethod.hideLoader();
            let alert = this.alertCtrl.create({
              subTitle: 'Error:' + '<br>' + error,
              buttons: ['OK']
            });
            alert.present();
          });
        }

      } else {
        this.touchtime = 0;
      }
    }



  }

  translateTitle(sourceText, langCode, i) {
    sourceText = sourceText.replace(/\n/g, "<br/>");
    let tempStr = "";
    console.log("sourceText=" + sourceText);

    if (this.foundRepos.temp_title_data != undefined && this.foundRepos.temp_title_data != "") {
      this.foundRepos.title = this.foundRepos.temp_title_data;
      this.foundRepos.temp_title_data = "";
    }
    else {
      //this.commonMethod.showLoader();
      this.translationservice.translateText(sourceText, langCode).subscribe(data => {

        if (data.detectedSourceLanguage == "en") {
          this.foundRepos.temp_title_data = this.foundRepos.title;
          this.foundRepos.title = tempStr + data.translatedText;
          //this.commonMethod.hideLoader();
        }
        else {
          this.translationservice.translateText(sourceText, 'en').subscribe(data => {
            this.foundRepos.temp_title_data = this.foundRepos.title;
            this.foundRepos.title = tempStr + data.translatedText;
            //this.commonMethod.hideLoader();
          }, error => {
            //this.commonMethod.hideLoader();
            let alert = this.alertCtrl.create({
              subTitle: 'Error:' + '<br>' + error,
              buttons: ['OK']
            });
            alert.present();
          });
        }

      }, error => {
        //this.commonMethod.hideLoader();
        let alert = this.alertCtrl.create({
          subTitle: 'Error:' + '<br>' + error,
          buttons: ['OK']
        });
        alert.present();
      });
    }
  }


  getUserName(user_id) {
    let userName = "";
    if (user_id != "") {
      for (let l = 0; l < this.members.length; l++) {
        if (this.members[l].id == user_id) {
          userName = this.members[l].name + ":";
        }
      }
    }
    return userName;
  }

  checkMentions() {
    if (this.showMentions == true) {
      this.showMentions = false;
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
              if (click.click && this.alert != undefined) {
                this.alert.dismiss();
              }
            });
        }, 2000);
      });
    });
  }

}

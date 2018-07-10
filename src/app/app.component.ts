import { Component, ViewChild, ElementRef, NgZone } from '@angular/core';
import { Nav, Platform, AlertController, Events, MenuController, ModalController, ToastController } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { NativeStorage } from '@ionic-native/native-storage';
import { Push, PushObject, PushOptions } from '@ionic-native/push';
import { srviceMethodsCall } from '../services/serviceMethods';

import { TutorialPage } from '../pages/tutorial/tutorial';
import { LoginPage } from '../pages/login/login';
import { ProfilePage } from '../pages/profile/profile';
import { FeedsPage } from '../pages/feeds/feeds';
import { CreateFeedsPage } from '../pages/createFeeds/createFeeds';
import { FeedDetailPage } from '../pages/feedDetail/feedDetail';
import { CreateHotelPage } from '../pages/createHotel/createHotel';
import { NewAccountPage } from '../pages/newAccount/newAccount';
import { ForgetPasswordPage } from '../pages/forgetPassword/forgetPassword';
import { ChattingPage } from '../pages/chatting/chatting';
import { TranslationPage } from '../pages/translation/translation';
import { MyMentionPage } from '../pages/myMention/myMention';
import { GroupChatPage } from '../pages/groupChat/groupChat';
import { CreateWorkOrderPage } from '../pages/createWorkOrder/createWorkOrder';
import { ReplyMessagePage } from '../pages/replyMessage/replyMessage';
import { MyVideosPage } from '../pages/myVideos/myVideos';
import { getPrivateOnlyUrl } from '../services/configURLs';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { getGroupsOnlyUrl } from '../services/configURLs';
import { WorkOrderPage } from '../pages/workOrder/workOrder';
import { RoomsMaintenancePage } from '../pages/roomsMaintenance/roomsMaintenance';
import { Keyboard } from '@ionic-native/keyboard';
import { deleteMentionUrl } from '../services/configURLs';
import { getAllMembersUrl } from '../services/configURLs';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { viewWorkOrderUrl } from '../services/configURLs';
import { dbVersion } from '../providers/appConfig';
import { hotelSwitchMsg } from '../providers/appConfig';
import ActionCable from 'actioncable';
import { webSocketBaseUrl } from '../services/configURLs';
import { retry } from 'rxjs/operator/retry';
import { Badge } from '@ionic-native/badge';
import { sendMessageUrl } from '../services/configURLs';
import { baseUrl } from '../services/configURLs';
import { getBroadcastListUrl, getProfileUrl } from '../services/configURLs';
import { getUserPermissionsUrl, updatePushNotificationSettings } from '../services/configURLs';
import { TaskChecklistPage } from '../pages/taskChecklist/taskChecklist';
import { TaskChecklistDetailPage } from '../pages/taskChecklistDetail/taskChecklistDetail';
import { TeamListingPage } from '../pages/teamListing/teamListing';
// import { getTaskListDetailsUrl } from '../services/configURLs';
//import { Deeplinks } from '@ionic-native/deeplinks';
import { NewUserPage } from '../pages/newUser/newUser';
import { EmailComposer } from '@ionic-native/email-composer';
import { Device } from '@ionic-native/device';
import { UpdateAppPage } from '../pages/updateApp/updateApp';

(window as any).handleOpenURL = (url: string) => {
  (window as any).handleOpenURL_LastURL = url;
};

@Component({
  templateUrl: 'app.html',
  providers: [NativeStorage, Push, srviceMethodsCall, SQLite, Keyboard, InAppBrowser, Badge, EmailComposer, Device]
})
export class MyApp {
  @ViewChild(Nav) nav: Nav;
  @ViewChild('content') elementView: ElementRef;

  rootPage: any;
  public chanelCreateData: any;
  public groupReponse: any;
  pages: Array<{ title: string, component: any, icon: any }>;
  public fullAppHeight;
  public keyboardHeight = 0;
  hotelMenu = [];
  currentHotelName = "";
  showHotelMenu = false;
  public cable: any;
  public userPermissions: any;
  public alerts = [];
  public notificationData: any;
  public showNotifyAlert = false;
  public alertCall = false;
  public showPage = true;
  public showChar = { first: false, secound: false, third: false, fourth: false };
  public userId = "";
  public userName = "";
  public displayText1 = "";
  public displayText2 = "";
  public openSideMenuOpt = false;
  public notificationStack = [];
  public usersdata: any;
  public resOne: any;
  public openPageByDeeplink = false;
  public notificationsStatus = false;

  constructor(public platform: Platform, public zone: NgZone, public commonMethod: srviceMethodsCall, public statusBar: StatusBar, public splashScreen: SplashScreen, public nativeStorage: NativeStorage, private push: Push, public alertCtrl: AlertController, private sqlite: SQLite, private keyboard: Keyboard, public events: Events, private iab: InAppBrowser, public menuCtrl: MenuController, private badge: Badge, public modalCtrl: ModalController, public toastCtrl: ToastController, private emailComposer: EmailComposer, private device: Device) {//,private localNotifications: LocalNotifications
    this.initializeApp();

    // override open handler to navigate on further custom url scheme actions
    (window as any).handleOpenURL = (url: string) => {
      setTimeout(() => {
        this.handleOpenUrl(url);
      }, 0);
    };

    // check if app was opened by custom url scheme
    const lastUrl: string = (window as any).handleOpenURL_LastURL || "";
    if (lastUrl && lastUrl !== "") {
      delete (window as any).handleOpenURL_LastURL;
      this.handleOpenUrl(lastUrl);
    }

    // used for an example of ngFor and navigation
    this.userPermissions = {
      "wo_access": {
        "view_listing": false,
        "team": false
      }
    };
    events.subscribe('update:permiossion', () => {
      console.log("update:permiossion");
      this.getWOPermission();
    });

    events.subscribe('update:updateNotificationsStatus', () => {
      console.log("update:updateNotificationsStatus");
      this.updateNotificationsStatus();
    });

    /* If you are updating Work order page title then please also update on in app.html */
    this.pages = [
      //{ title: 'Work Orders', component: WorkOrderPage, icon: 'construct-outline' },
      { title: 'Work Orders', component: WorkOrderPage, icon: 'construct-outline' },
      { title: 'Profile', component: ProfilePage, icon: 'person-outline' }
    ];
    events.subscribe('updateHotel:list', (hotels, index) => {
      // user and time are the same arguments passed in `events.publish(user, time)`
      console.log('updateHotel:list', JSON.stringify(hotels) + index);
      this.hotelMenu = [];
      for (let i = 0; i < hotels.length; i++) {
        if (i == index) {
          this.currentHotelName = hotels[i].name;
        }
        this.hotelMenu.push({ name: hotels[i].name, token: hotels[i].token, created_at: hotels[i].created_at });
      }
    });

    events.subscribe('subscribeInAppNotification', () => {
      this.subscribeAcNotification();
    });

    events.subscribe('logoutUserEvent', () => {
      this.logoutUser();
    });

    this.keyboard.onKeyboardShow().subscribe(data => {

      this.keyboardHeight = data.keyboardHeight;
      let view = this.nav.getActive();
      if (view.component.name == FeedsPage.name || view.component.name == ChattingPage.name || view.component.name == MyMentionPage.name || view.component.name == ProfilePage.name) {
        this.fullAppHeight = window.innerHeight;
      }
      else {
        this.fullAppHeight = window.innerHeight - this.keyboardHeight;
      }
      this.zone.run(() => {
        this.fullAppHeight = this.fullAppHeight;
      });
      console.log("Galaxy show" + this.fullAppHeight);
    });
    events.subscribe('hide:keyboard', () => {
      this.zone.run(() => {
        this.fullAppHeight = window.innerHeight;
      });
    });

    this.keyboard.onKeyboardHide().subscribe(data => {
      this.zone.run(() => {
        this.fullAppHeight = window.innerHeight;
      });
    });
    events.subscribe('login:Notification', (notification) => {
      // alert("view");
      console.log("login:Notification");
      this.nativeStorage.setItem('lastPage', { "pageName": FeedsPage.name, "index": this.nav.getActive().index });
      this.commonMethod.showLoader();
      this.openSpecificPage(notification);
    });


    events.subscribe('show:LoaderPage', () => {
      this.showPage = true;
      this.showChar = { first: false, secound: false, third: false, fourth: false };
      console.log("show:LoaderPage 1");
      this.userName = "";
      this.displayText1 = "";
      this.displayText2 = "";
      this.nativeStorage.getItem('user_auth').then(
        accessToken => {
          // alert("AAA" + JSON.stringify(accessToken));
          this.showLoaderPage(accessToken.user_id);
        });
    });

    events.subscribe('login:Notification', (notification) => {
      // alert("view");
      console.log("login:Notification");
      this.nativeStorage.setItem('lastPage', { "pageName": FeedsPage.name, "index": this.nav.getActive().index });
      this.commonMethod.showLoader();
      this.openSpecificPage(notification);
    });



    //   this.localNotifications.on("click", (notification, state) => {
    //     let data = notification.data;
    //     console.log("======"+JSON.stringify(data));
    //     this.manageNotification(data);
    //     // let alert = this.alertCtrl.create({
    //     //     title: data.message,
    //     //     subTitle: "You just clicked the scheduled notification",
    //     //     buttons: ["OK"]
    //     // });
    //     // alert.present();



    // });


  }

  private handleOpenUrl(url: string) {
    // custom url parsing, etc...
    let params = url.split("/");
    let arrayLength = params.length;
    if (arrayLength > 3 && params[arrayLength - 3] == "create") {
      this.openPageByDeeplink = true;
      let propertyToken = params[arrayLength - 2];
      let confirmationToken = params[arrayLength - 1];
      //alert(propertyToken+"="+confirmationToken);
      this.nav.push(NewUserPage, { propertyToken: propertyToken, confirmationToken: confirmationToken });
    }

    console.log(JSON.stringify(params));
    //this.nav.push(NewUserPage,{propertyToken:'',confirmationToken:''});
    // navigate to page with reactive forms
    // this.navCtrl.push(MyReactiveFormsPage, { param: "my param" });
  }

  manageNotification(notification) {
    //this.badge.decrease(1);

    this.nativeStorage.getItem('user_auth').then(
      accessToken => {

        if (notification.additionalData.foreground) {
          console.log("---" + notification.additionalData);
          if (notification.additionalData.type.property_token && notification.additionalData.type.property_token == accessToken.property_token) {
            this.commonMethod.showLoader();
            this.openSpecificPage(notification);
          } else {

            let confirmAlert = this.alertCtrl.create({
              title: 'New Notification',
              cssClass: 'alert-notification',
              enableBackdropDismiss: false,
              message: hotelSwitchMsg,
              buttons: [{
                text: 'Ignore',
                role: 'cancel'
              }, {
                text: 'Change',
                handler: () => {
                  this.hotelMenu = [];
                  this.nativeStorage.getItem('user_properties').then(
                    hotels => {
                      console.log("userProperties=" + hotels);
                      for (let i = 0; i < hotels.length; i++) {
                        if (hotels[i].token == notification.additionalData.type.property_token) {
                          this.changeHotel(notification.additionalData.type.property_token, hotels[i].name, hotels[i].created_at, notification, false);
                        }
                      }

                    },
                    error => {
                      console.log("userProperties error" + error);
                    }
                  );

                }
              }]
            });
            this.alerts.push(confirmAlert);
            confirmAlert.present();

          }
          this.showNotification();
        } else {

          if (notification.additionalData.inlineReply != undefined && notification.additionalData.inlineReply) {
            console.log("got message = " + JSON.stringify(notification.additionalData));
            //this.sendMessage(notification.additionalData.inlineReply, '', '', '');
          }

          console.log("aaaaaa" + notification.additionalData);
          if (notification.additionalData.type.property_token && notification.additionalData.type.property_token == accessToken.property_token) {
            this.commonMethod.showLoader();
            this.openSpecificPage(notification);
          } else {
            let confirmAlert = this.alertCtrl.create({
              title: 'New Notification',
              cssClass: 'alert-notification',
              enableBackdropDismiss: false,
              message: 'Would you like to change hotel?',
              buttons: [{
                text: 'Ignore',
                role: 'cancel'
              }, {
                text: 'Change',
                handler: () => {
                  this.hotelMenu = [];
                  this.nativeStorage.getItem('user_properties').then(
                    hotels => {
                      console.log("userProperties=" + hotels);
                      for (let i = 0; i < hotels.length; i++) {
                        if (hotels[i].token == notification.additionalData.type.property_token) {
                          // this.hotelMenu.push({ name: hotels[i].name, token: hotels[i].token, created_at:hotels[i].created_at });
                          this.changeHotel(notification.additionalData.type.property_token, hotels[i].name, hotels[i].created_at, notification, false);
                        }
                      }

                    },
                    error => {
                      console.log("userProperties error" + error);
                    }
                  );

                }
              }]
            });
            this.alerts.push(confirmAlert);
            confirmAlert.present();
          }
        }

      },
      error => {
        // this.commonMethod.hideLoader();
        console.log("bbbbbbb" + notification.additionalData);
        if (notification.additionalData.foreground) {
          this.nav.setRoot(LoginPage, { notification: notification });
        } else {
          this.nav.setRoot(LoginPage, { notification: notification });
        }
        return '';
      });


  }
  sendMessage(textMessage, image_url, parent_id, groupID) {

    let mentionId = [];


    let messageText = textMessage.trim();
    // messageText = this.commonMethod.replaceURLWithHTMLLinks(messageText);
    console.log("aaaaa")

    let objData = { chat_message: { message: textMessage, chat_id: 521, mentioned_user_ids: [], image_url: "", responding_to_chat_message_id: 9840 } };//{ 'chat_message': { message: messageText, chat_id: groupID, mentioned_user_ids: mentionId, image_url: image_url, responding_to_chat_message_id: parent_id } };

    this.nativeStorage.getItem('user_auth').then(
      accessToken => {
        if (this.commonMethod.checkNetwork()) {
          this.commonMethod.postDataWithoutLoder(sendMessageUrl, objData, accessToken).subscribe(
            data => {
              console.log(data.json());
            },
            err => {
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
  initializeApp() {
    this.platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      this.hotelMenu = [];
      this.nativeStorage.getItem('user_properties').then(
        hotels => {
          console.log("userProperties=" + hotels);
          for (let i = 0; i < hotels.length; i++) {
            this.hotelMenu.push({ name: hotels[i].name, token: hotels[i].token, created_at: hotels[i].created_at });
          }
        },
        error => {
          console.log("userProperties error" + error);
        }
      );
      this.getWOPermission();
      this.initPushNotification();
      this.subscribeAcNotification();
      this.fullAppHeight = window.innerHeight;

      this.nativeStorage.getItem('user_auth').then(
        accessToken => {
          /* If user login redirect to feed page */
          if (accessToken.access_token && accessToken.access_token != '') {

            /* To manage loader on feed page */
            // this.nativeStorage.setItem('show_feed_loader',true)
            // .then(() => {
            // },
            // error => {
            // });

            this.updateNotificationsStatus();

            this.currentHotelName = accessToken.hotel_name;
            let alertVar = this.alertCtrl.create({
              title: 'Error!',
              subTitle: 'Invalid Details!',
              buttons: ['OK']
            });

            if (accessToken.db_version != null && accessToken.db_version != undefined && accessToken.db_version != dbVersion) {

              this.nativeStorage.setItem('user_auth', { access_token: accessToken.access_token, property_token: accessToken.property_token, hotel_created: accessToken.hotel_created, hotel_name: accessToken.hotel_name, user_id: accessToken.user_id, db_version: dbVersion })
                .then(() => {
                  this.changeHotel(accessToken.property_token, accessToken.hotel_name, accessToken.hotel_created, undefined, true);
                },
                  error => {
                  });
            }
            else {
              this.showLoaderPage(accessToken.user_id);
              if (!this.openPageByDeeplink) {
                this.rootPage = FeedsPage;
              }
            }
          }

        },
        error => {
          if (!this.openPageByDeeplink) {
            this.rootPage = LoginPage;
          }
          //this.rootPage = CreateHotelPage;
          return '';
        }
      );
      this.statusBar.styleDefault();
      this.splashScreen.hide();

      let rootScope = {
        backButtonPressedOnceToExit: false
      };
      this.platform.registerBackButtonAction(() => {
        if (rootScope['backButtonPressedOnceToExit']) {
          this.platform.exitApp();
        }
        else {
          rootScope['backButtonPressedOnceToExit'] = true;
          this.toastCtrl.create({
            message: "Press back button again to exit",
            duration: 2000
          }).present();
          setTimeout(() => {
            rootScope['backButtonPressedOnceToExit'] = false;
          }, 2000);
        }
        return false;
      }, 101);



      // this.deeplinks.routeWithNavController(this.nav, {
      //  '/about-us': NewAccountPage,
      // '/create/:hotelCode': NewAccountPage
      // }).subscribe((match) => {
      // match.$route - the route we matched, which is the matched entry from the arguments to route()
      // match.$args - the args passed in the link
      // match.$link - the full link data
      //   console.log('Successfully matched route', match);
      //}, (nomatch) => {
      // nomatch.$link - the full link data
      // console.error('Got a deeplink that didn\'t match', nomatch);
      // });


    });
  }

  syncMembers(dbRes, db, alertVar) {

    console.log("TABLE CREATED: " + JSON.stringify(dbRes));

    let allExistingIds = [];
    db.executeSql("SELECT * FROM members", []).then((dataSQL) => {
      console.log("TABLE DATA: " + JSON.stringify(dataSQL));

      if (dataSQL.rows.length > 0) {
        for (var i = 0; i < dataSQL.rows.length; i++) {
          allExistingIds.push({
            user_id: dataSQL.rows.item(i).user_id
          });
        }
      }

      /*  get member api call start */
      this.nativeStorage.getItem('user_auth').then(
        accessToken => {

          if (this.commonMethod.checkNetwork()) {
            this.commonMethod.getDataWithoutLoder(getAllMembersUrl, accessToken).subscribe(
              data => {
                //this.foundRepos = data.json();
                let users = data.json();
                console.error(users);


                for (let i = 0; i < users.length; i++) {
                  let insertFlag = true;
                  for (let j = 0; j < allExistingIds.length; j++) {
                    if (users[i].id == allExistingIds[j].user_id) {
                      insertFlag = false;
                    }
                  }
                  let is_maintenance_dep = 0;
                  for (let val = 0; val < users[i].departments.length; val++) {
                    console.log("departments" + users[i].departments[val].name);
                    if (users[i].departments[val].name == "Maintenance") {
                      is_maintenance_dep = 1;
                    }
                  }
                  console.log("departments maintainance" + is_maintenance_dep);

                  let is_system_user = users[i].is_system_user == true ? 1 : 0;
                  if (insertFlag == true) {
                    db.executeSql("INSERT INTO members (user_id, hotel_token, name, image, role, title,is_maintenance_dep,is_system_user) VALUES ('" + users[i].id + "','','" + users[i].name + "','" + users[i].avatar.medium + "','" + users[i].role + "','" + users[i].title + "'," + is_maintenance_dep + "," + is_system_user + ")", {}).then((data1) => {

                      console.log("INSERTED: " + JSON.stringify(data1));
                    }, (error1) => {
                      console.log("INSERT ERROR: " + JSON.stringify(error1));
                    });
                  }
                  else {
                    db.executeSql("UPDATE members SET user_id='" + users[i].id + "', hotel_token='', name='" + users[i].name + "', image='" + users[i].avatar.medium + "', role='" + users[i].role + "', is_maintenance_dep=" + is_maintenance_dep + ", is_system_user=" + is_system_user + " WHERE user_id='" + users[i].id + "'", {}).then((data1) => {
                      console.log("UPDATED: " + JSON.stringify(data1));
                    }, (error1) => {
                      console.log("UPDATED ERROR: " + JSON.stringify(error1));
                    });
                  }

                }

                this.nativeStorage.setItem('user_auth', { access_token: accessToken.access_token, property_token: accessToken.property_token, hotel_created: accessToken.hotel_created, hotel_name: accessToken.hotel_name, user_id: accessToken.user_id, db_version: dbVersion })
                  .then(() => { console.log('Stored item') },
                    error => { console.error('Error storing item', error) }
                  );

              },
              err => {
                //this.commonMethod.hideLoader();
                alertVar.present();
                console.error("Error : " + err);
              },
              () => {
                //this.commonMethod.hideLoader();
                console.log('get member Data completed');
              }
            );

          }
          else {
            this.commonMethod.hideLoader();
            this.commonMethod.showNetworkError();
          }

        },
        error => {
          this.commonMethod.hideLoader();
          return '';
        }
      );
      /*  get member api call end */

    }, (error) => {
      console.log("ERROR: " + JSON.stringify(error));
    });
  }

  openPage(page) {
    // Reset the content nav to have just this page
    // we wouldn't want the back button to show in this scenario
    if (page.component == ProfilePage) {
      this.nav.push(page.component);
    }
    else {
      this.nav.setRoot(page.component);
    }
  }

  openLearningCenter() {
    this.nav.setRoot(MyVideosPage);
  }

  // changeHotel(propertyToken, hotelName, hotelCreated, notification,updateNewVersion) {

  //   if (this.commonMethod.checkNetwork()) {
  //     if(updateNewVersion==true)
  //     {
  //       this.commonMethod.showLoaderForDbSync();
  //     }else{
  //       this.commonMethod.showLoader();
  //     }

  //     let hotelCreatedDate = new Date(hotelCreated);
  //     let dd = ("0" + hotelCreatedDate.getDate()).slice(-2);
  //     let mm = ("0" + ((hotelCreatedDate.getMonth()) + 1)).slice(-2); //January is 0!
  //     let yyyy = hotelCreatedDate.getFullYear();

  //     this.nativeStorage.getItem('user_auth').then(
  //       accessToken => {
  //         //accessToken.db_version

  //         /* disconnect in app notification */
  //         if (this.cable == undefined) {
  //         } else {
  //           this.cable.disconnect();
  //         }

  //         // alert(accessToken.db_version);
  //         // console.log(accessToken.db_version);
  //         this.nativeStorage.remove('user_auth')
  //           .then(
  //           () => {
  //             console.log('Removed item!');
  //             this.nativeStorage.remove('lastPage');
  //             this.nativeStorage.remove('groupInfo');

  //             this.nativeStorage.remove('feedData')
  //               .then(
  //               () => {
  //                 console.log('Removed feedData!');
  //               },
  //               error => console.error('Error storing item', error)
  //               );

  //             this.nativeStorage.remove('wo_data').then(() => {
  //               console.log('Removed wo_data!');
  //             },
  //               error => console.error('Error remove wo_data', error)
  //             );

  //             this.nativeStorage.setItem('user_auth', { access_token: accessToken.access_token, property_token: propertyToken, hotel_created: yyyy + '-' + mm + '-' + dd, hotel_name: hotelName, user_id: accessToken.user_id, db_version: accessToken.db_version })
  //               .then(
  //               () => {
  //                 console.log('Stored item!');

  //                 this.sqlite.deleteDatabase({
  //                   name: 'data.db',
  //                   location: 'default'
  //                 })
  //                   .then((db: SQLiteObject) => {
  //                     console.log('DELETE DATABASE');

  //                     this.sqlite.create({
  //                       name: 'data.db',
  //                       location: 'default'
  //                     }).then((db: SQLiteObject) => {

  //                       db.executeSql('CREATE TABLE IF NOT EXISTS members(user_id INTEGER, hotel_token TEXT, name TEXT, image TEXT, role TEXT,title TEXT, is_maintenance_dep INTEGER, is_system_user INTEGER)', {})
  //                         .then((dbRes) => {

  //                           db.executeSql('CREATE TABLE IF NOT EXISTS chat_group_users(group_id INTEGER, user_id INTEGER, is_admin INTEGER, deleted_at TEXT, created_at TEXT)', {})
  //                             .then((dbUserRes) => {
  //                               console.log("CREATE TABLE chat_group_users" + JSON.stringify(dbUserRes));

  //                               db.executeSql("CREATE TABLE IF NOT EXISTS chat_messages(id INTEGER, sender_id INTEGER,hotel_token TEXT, message TEXT, image TEXT, target_id INTEGER, type TEXT, deleted_at TEXT, created_at TEXT, updated_at TEXT, read_status INTEGER, mentioned_user_ids TEXT, parent_id TEXT, work_order_id INTEGER, work_order_url TEXT, work_order_status TEXT, work_order_closed_by_user_id INTEGER, work_order_closed_at TEXT, work_order_location_detail TEXT, work_order_description TEXT,room_number TEXT,room_id TEXT)", {}).then((data1) => {
  //                                 console.log("MESSAGE TABLE CREATED: " + JSON.stringify(data1));

  //                                 db.executeSql('CREATE TABLE IF NOT EXISTS chat_groups(id INTEGER, name TEXT, hotel_token TEXT, created_by_id INTEGER,deleted_at TEXT,created_at TEXT,updated_at TEXT, image_url TEXT)', {})
  //                                   .then((dbRes) => {
  //                                     console.log("CREATE TABLE chat_groups" + JSON.stringify(dbRes));

  //                                     db.executeSql('CREATE TABLE IF NOT EXISTS user_mentions (type TEXT, type_id INTEGER, user_id INTEGER,total INTEGER)', {})
  //                                       .then((dbRes) => {
  //                                         console.log("CREATE TABLE user_mentions" + JSON.stringify(dbRes));

  //                                         /*  get member api call start */
  //                                         this.nativeStorage.getItem('user_auth').then(
  //                                           accessToken => {

  //                                             this.subscribeAcNotification();

  //                                             if (this.commonMethod.checkNetwork()) {
  //                                               this.commonMethod.getDataWithoutLoder(getAllMembersUrl, accessToken).timeout(60000).subscribe(
  //                                                 data => {
  //                                                   //this.foundRepos = data.json();
  //                                                   let users = data.json();
  //                                                   console.error(users);


  //                                                   for (let i = 0; i < users.length; i++) {
  //                                                     let is_maintenance_dep = 0;
  //                                                     for (let val = 0; val < users[i].departments.length; val++) {
  //                                                       console.log("departments" + users[i].departments[val].name);
  //                                                       if (users[i].departments[val].name == "Maintenance") {
  //                                                         is_maintenance_dep = 1;
  //                                                       }
  //                                                     }
  //                                                     console.log("departments maintainance" + is_maintenance_dep);

  //                                                     let is_system_user = users[i].is_system_user == true ? 1 : 0;
  //                                                     db.executeSql("INSERT INTO members (user_id, hotel_token, name, image, role, title,is_maintenance_dep, is_system_user) VALUES ('" + users[i].id + "','','" + users[i].name + "','" + users[i].avatar_img_url + "','" + users[i].role + "','" + users[i].title + "'," + is_maintenance_dep + "," + is_system_user + ")", {}).then((data1) => {
  //                                                       console.log("INSERTED: " + JSON.stringify(data1));
  //                                                     }, (error1) => {
  //                                                       console.log("INSERT ERROR: " + JSON.stringify(error1));
  //                                                     });
  //                                                   }

  //                                                   this.nativeStorage.getItem('user_properties').then(
  //                                                     properties => {
  //                                                       var index;
  //                                                       for (let i = 0; i < properties.length; i++) {
  //                                                         if (properties[i].token == propertyToken) {
  //                                                           index = i;
  //                                                         }
  //                                                       }
  //                                                       this.events.publish('updateHotel:list', properties, index);

  //                                                       this.events.publish('subscribeInAppNotification');
  //                                                     },
  //                                                     error => {
  //                                                       console.log("userProperties error" + error);
  //                                                     }
  //                                                   );

  //                                                   this.currentHotelName = hotelName;
  //                                                   this.showHotelMenu = false;

  //                                                   this.commonMethod.getDataWithoutLoder(getBroadcastListUrl, accessToken).subscribe(
  //                                                     data => {
  //                                                       let res = data.json();
  //                                                       this.nativeStorage.setItem('broadcast_count', res.length)
  //                                                         .then(
  //                                                         () =>{ console.log('Stored broadcast_count!');
  //                                                         if (notification == undefined || notification == 'undefined') {
  //                                                           this.commonMethod.hideLoader();
  //                                                           this.nav.setRoot(FeedsPage);
  //                                                         } else {
  //                                                           this.nativeStorage.setItem('lastPage', { "pageName": FeedsPage.name, "index": this.nav.getActive().index });

  //                                                           this.openSpecificPage(notification);
  //                                                         }},
  //                                                         error => console.error('Error storing broadcast_count', error)
  //                                                         );
  //                                                     },
  //                                                     err => {
  //                                                       this.commonMethod.hideLoader();
  //                                                       let alertVar = this.alertCtrl.create({
  //                                                         title: 'Error!',
  //                                                         subTitle: 'Invalid Details!',
  //                                                         buttons: ['OK']
  //                                                       }); alertVar.present();
  //                                                     },
  //                                                     () => {
  //                                                       console.log('getData completed');
  //                                                     }
  //                                                   );

  //                                                 },
  //                                                 err => {

  //                                                   this.commonMethod.hideLoader();
  //                                                   let alertVar = this.alertCtrl.create({
  //                                                     title: 'Error!',
  //                                                     subTitle: 'Invalid Details!',
  //                                                     buttons: ['OK']
  //                                                   });
  //                                                   alertVar.present();
  //                                                   console.error("Error : " + err);
  //                                                 },
  //                                                 () => {
  //                                                   //this.commonMethod.hideLoader();
  //                                                   console.log('get member Data completed');
  //                                                 }
  //                                               );

  //                                             }
  //                                             else {
  //                                               this.commonMethod.hideLoader();
  //                                               this.commonMethod.showNetworkError();
  //                                             }

  //                                           },
  //                                           error => {
  //                                             this.commonMethod.hideLoader();
  //                                             return '';
  //                                           }
  //                                         );
  //                                         /*  get member api call end */

  //                                       }, (error) => {
  //                                         console.error("Unable to execute sql user_mentions", error);
  //                                       }).catch(e => console.log('Executed SQL Error= user_mentions' + JSON.stringify(e)));

  //                                   }, (error) => {
  //                                     console.error("Unable to execute sql", error);
  //                                   }).catch(e => console.log('Executed SQL Error= ' + JSON.stringify(e)));

  //                               }, (error) => {
  //                                 console.error("Unable to execute sql", error);
  //                               }).catch(e => console.log('Executed SQL Error= ' + JSON.stringify(e)));

  //                             }, (error) => {
  //                               console.error("Unable to execute sql", error);
  //                             }).catch(e => console.log('Executed SQL Error= ' + JSON.stringify(e)));


  //                         }, (error) => {
  //                           console.error("Unable to execute sql", error);
  //                         }).catch(e => console.log('Executed SQL Error= ' + JSON.stringify(e)));

  //                     });

  //                   })
  //                   .catch(e => console.log(e));
  //               },
  //               error => console.error('Error storing item', error)
  //               );

  //           },
  //           error => console.error('Error storing item', error)
  //           );
  //       },
  //       error => {
  //         this.commonMethod.hideLoader();
  //         return '';
  //       }
  //     );

  //   }
  //   else {
  //     this.commonMethod.showNetworkError();
  //   }

  // }

  changeHotel(propertyToken, hotelName, hotelCreated, notification, updateNewVersion) {

    if (this.commonMethod.checkNetwork()) {
      if (updateNewVersion == true) {
        this.commonMethod.showLoaderForDbSync();
      } else {
        this.commonMethod.showLoader();
      }

      this.nativeStorage.getItem('user_auth').then(
        accessToken => {

          let tokenValue = { access_token: accessToken.access_token, property_token: propertyToken };

          if (this.commonMethod.checkNetwork()) {
            this.commonMethod.getDataWithoutLoder(getAllMembersUrl, tokenValue).timeout(60000).subscribe(
              data => {
                //this.foundRepos = data.json();
                this.usersdata = data.json();

                console.log(this.usersdata);
                this.commonMethod.getDataWithoutLoder(getBroadcastListUrl, tokenValue).subscribe(
                  data => {
                    this.resOne = data.json();
                    console.log(this.resOne);
                    this.getUserPermissions(this.resOne, this.usersdata, propertyToken, hotelName, hotelCreated, notification, updateNewVersion, tokenValue);
                  },
                  err => {
                    this.commonMethod.hideLoader();

                    let alertVar = this.alertCtrl.create({
                      title: 'Error!',
                      subTitle: 'Invalid Details!',
                      buttons: ['OK']
                    }); alertVar.present();

                  },
                  () => {
                    console.log('getData completed');

                  }
                );

              },
              err => {
                this.commonMethod.hideLoader();

                let alertVar = this.alertCtrl.create({
                  title: 'Error!',
                  subTitle: 'Invalid Details!',
                  buttons: ['OK']
                });
                alertVar.present();
                console.error("Error : " + err);
              },
              () => {
                //this.commonMethod.hideLoader();
                console.log('get member Data completed');
              }
            );
          }
          else {
            this.commonMethod.hideLoader();
            this.commonMethod.showNetworkError();

          }

        },
        error => {
          this.commonMethod.hideLoader();
          return '';
        }
      );

    }
    else {
      this.commonMethod.showNetworkError();
    }

  }

  initPushNotification() {
    // to check if we have permission
    this.push.hasPermission()
      .then((res: any) => {
        if (res.isEnabled) {
          console.log('We have permission to send push notifications');
        } else {
          console.log('We do not have permission to send push notifications');
        }

      });
    // to initialize push notifications
    const options: PushOptions = {
      android: {
        senderID: '51863109530',
        icon: "ic_launcher"

      },
      ios: {
        alert: 'true',
        badge: true,
        clearBadge: "true",
        sound: 'true'
      },
      windows: {}
    };

    const pushObject: PushObject = this.push.init(options);

    pushObject.on('notification').subscribe((notification: any) => {

      console.log('Received a notification', JSON.stringify(notification));

      console.log("ccccc" + notification.additionalData);

      if (notification.additionalData.foreground) {
        //this.notificationData = notification;
        this.notificationStack.push(notification);
        if (this.showNotifyAlert == false) {
          this.showNotification();
        } else {
          this.showNotifyAlert = true;
        }

        // this.zone.run(() => {
        //   this.showNotifyAlert = true;
        // }); setTimeout(() => {
        //   this.zone.run(() => {
        //     this.showNotifyAlert = false;
        //   });
        // }, 15000);
      } else {
        this.platform.ready().then(() => {
          this.nativeStorage.setItem('notificatio_click', { click: true }).then(
            () => {
              this.manageNotification(notification);

              setTimeout(() => {
                console.log('Stored notificatio_click! true');
                this.zone.run(() => {
                  this.nativeStorage.setItem('notificatio_click', { click: false }).then(
                    () => {

                      console.log('Stored notificatio_click! false');
                    },
                    error => console.error('Error storing notificatio_click', error)
                  );
                });
              }, 10000);

            },
            error => {
              console.error('Error storing notificatio_click', error);
              this.manageNotification(notification);
            }
          );
        });


      }

    });
    pushObject.on('registration').subscribe((registration: any) => {
      console.log('Device registered', JSON.stringify(registration));
      //alert(registration.registrationId); 

      this.nativeStorage.setItem('device_token', { tokenId: registration.registrationId }).then(
        () => console.log('Stored device_token!'),
        error => console.error('Error storing device_token', error)
      );

    });
    pushObject.on('error').subscribe(error => console.error('Error with Push plugin', error));

    pushObject.on('accept').subscribe(obj => {
      console.log('accept a notification', JSON.stringify(obj));

      this.sendMessage(obj.additionalData.inlineReply, "", "", "");
    });
    pushObject.on('reject').subscribe(obj => console.log('reject a notification', JSON.stringify(obj)));

  }


  openSpecificPage(notification) {
    debugger
    //TODO: Your logic here
    let view = this.nav.getActive();
    this.menuCtrl.close();
    this.nativeStorage.getItem('user_auth').then(
      accessToken => {
        // alert(JSON.stringify(notification));
        this.zone.run(() => {
          this.showNotifyAlert = false;
        });
        if (accessToken.access_token != undefined && accessToken.access_token != '') {
          if (notification.additionalData == undefined || notification.additionalData.type == undefined) {
            this.commonMethod.hideLoader;
          } else {
            let typeName = notification.additionalData.type.name;
            let detail = notification.additionalData.type.detail;
            if (typeName == "feed") {
              this.commonMethod.hideLoader();
              this.openFeeds(detail.feed_id, detail.notified_user_mention_id);
            } else if (typeName == "feed_comment") {

              if (detail.notified_user_mention_id == undefined) {
                this.commonMethod.hideLoader();
                this.nav.push(FeedDetailPage, { feed_id: detail.feed_id, feed_comment_id: detail.feed_comment_id });
              } else {
                this.openDetail(detail.feed_id, detail.notified_user_mention_id, detail.feed_comment_id);
              }

            } else if (typeName == "group_chat" || typeName == "direct_chat") {
              console.log(detail.is_acknowledged + " 1q acknowledge");

              this.nativeStorage.getItem('groupInfo').then(group => {
                if (detail.chat_id == group.groupID && notification.additionalData.foreground) {
                  // this.commonMethod.hideLoader();

                  this.notifyChat(detail.chat_message_id, detail.notified_user_mention_id, detail.is_acknowledged);
                } else {
                  this.nativeStorage.setItem('groupInfo', { "groupID": detail.chat_id });
                  if (typeName == "direct_chat") {
                    this.commonMethod.hideLoader();
                    this.openPrivateChat(detail.chat_id, detail.chat_message_id, detail.chat_message_created_at, detail.notified_user_mention_id, detail.is_acknowledged);
                  } else {
                    this.openGroupCaht(detail.chat_id, detail.chat_message_id, detail.chat_message_created_at, detail.notified_user_mention_id, detail.is_acknowledged);
                  }

                }

              },
                error => {
                  this.nativeStorage.setItem('groupInfo', { "groupID": detail.chat_id });

                  if (typeName == "direct_chat") {
                    this.commonMethod.hideLoader();
                    this.openPrivateChat(detail.chat_id, detail.chat_message_id, detail.chat_message_created_at, detail.notified_user_mention_id, detail.is_acknowledged);
                  } else {
                    this.openGroupCaht(detail.chat_id, detail.chat_message_id, detail.chat_message_created_at, detail.notified_user_mention_id, detail.is_acknowledged);
                  }

                }
              );


            }
            else if (typeName == "wo_added") {
              this.commonMethod.hideLoader();
              let view = this.nav.getActive();
              if (view.component.name == "LoginPage") {
                this.nav.setRoot(WorkOrderPage);
              }
              this.editWorkOrder(detail.work_order_id);
              if (view.component.name == "FeedsPage") {
                this.nav.setRoot(FeedsPage);
              } else if (view.component.name == "MyMentionPage") {
                this.nav.setRoot(MyMentionPage);
              } else if (view.component.name == "ChattingPage") {
                this.nav.setRoot(ChattingPage);
              } else if (view.component.name == "WorkOrderPage") {
                this.nav.setRoot(WorkOrderPage);
              } else if (view.component.name == "ProfilePage") {
                this.nav.setRoot(FeedsPage);
              } else if (view.component.name == "TaskChecklistPage") {
                this.nav.setRoot(TaskChecklistPage);
              }
              // this.nav.setRoot(WorkOrderPage, { id: detail.work_order_id });
            } else if (typeName == "unchecked_mentions") {
              this.commonMethod.hideLoader();
              this.nav.setRoot(MyMentionPage);
            } else if (typeName == "group_unread_messages") {
              this.commonMethod.hideLoader();
              this.nav.setRoot(ChattingPage);
            } else if (typeName == "private_unread_messages") {
              this.commonMethod.hideLoader();
              this.nav.setRoot(ChattingPage, { show_private_list: true });
            } else if (typeName == "group_create") {
              this.commonMethod.hideLoader();
              this.openGroupCaht(detail.chat_id, undefined, undefined, undefined, detail.is_acknowledged);

            } else if (typeName == "task_list_record") {
              this.commonMethod.hideLoader();
              this.openReviewCheckList(detail);
            } else if (typeName == "wo_completed") {
              this.commonMethod.hideLoader();
              this.nav.setRoot(FeedsPage, {
                openWoPopup: true,
                wo_id: notification.additionalData.type.detail.work_order_id
              });
            }
            else {
              this.commonMethod.hideLoader();
              this.nav.setRoot(MyMentionPage);
            }
          }
        }
        else {
          // alert("A");
          this.commonMethod.hideLoader();
          this.nav.setRoot(LoginPage);
        }
      },
      error => {
        this.zone.run(() => {
          this.showNotifyAlert = false;
        });
        this.commonMethod.hideLoader();
        return '';
      }
    );
  }


  openWorkOrderPage(id) {

    this.nativeStorage.getItem('user_auth').then(
      accessToken => {

        let token = accessToken.access_token ? accessToken.access_token : '';
        let property_token = accessToken.property_token ? accessToken.property_token : '';
        let url = viewWorkOrderUrl + "?authorization=" + token + "&property_token=" + property_token + "&id=" + id;
        console.log(url);
        let browser = this.iab.create(url, '_blank', 'location=no,closebuttoncaption=Back,toolbar=yes,EnableViewPortScale=yes,toolbarposition=top');
        console.log("link viewed");
        browser.on('exit').subscribe(
          () => {
            console.log('done');
            this.nav.setRoot(FeedsPage);
          },
          err => console.error(err));

      },
      error => {
        return '';
      }
    );

    //this.navCtrl.setRoot(WorkOrderPage,{id:id,page:'group_chat',group_data:this.groupInfo});
  }

  notifyChat(id, mention_id, is_acknowledged) {

    let objData = { status: 'checked' };
    let alertVar = this.alertCtrl.create({
      title: 'Error!',
      subTitle: 'Invalid Details!',
      buttons: ['OK']
    });

    this.nativeStorage.getItem('user_auth').then(
      accessToken => {

        if (this.commonMethod.checkNetwork() && mention_id != undefined) {
          this.commonMethod.putData(deleteMentionUrl + "/" + mention_id, objData, accessToken).subscribe(
            data => {
              this.commonMethod.hideLoader();

              this.events.publish("notifyChat", id, is_acknowledged);
            },
            err => {
              this.commonMethod.hideLoader();
              alertVar.present();
              console.error("Error : " + err);
            },
            () => {
              this.commonMethod.hideLoader();
              console.log('getData completed');
            }
          );

        }
        else if (mention_id == undefined) {
          this.commonMethod.hideLoader();
          this.events.publish("notifyChat", id, is_acknowledged);
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
  openDetail(id, mention_id, feed_comment_id) {

    let objData = { status: 'checked' };
    let alertVar = this.alertCtrl.create({
      title: 'Error!',
      subTitle: 'Invalid Details!',
      buttons: ['OK']
    });

    this.nativeStorage.getItem('user_auth').then(
      accessToken => {

        if (this.commonMethod.checkNetwork() && mention_id != undefined) {
          // this.commonMethod.showLoader();
          this.commonMethod.putData(deleteMentionUrl + "/" + mention_id, objData, accessToken).subscribe(
            data => {

              this.commonMethod.hideLoader();
              this.nav.push(FeedDetailPage, { feed_id: id, feed_comment_id: feed_comment_id });
            },
            err => {
              this.commonMethod.hideLoader();
              alertVar.present();
              console.error("Error : " + err);
            },
            () => {
              this.commonMethod.hideLoader();
              console.log('getData completed');
            }
          );

        } else if (mention_id == undefined) {
          this.commonMethod.hideLoader();
          this.nav.push(FeedDetailPage, { feed_id: id, feed_comment_id: feed_comment_id });
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
  openFeeds(id, mention_id) {

    let objData = { status: 'checked' };
    let alertVar = this.alertCtrl.create({
      title: 'Error!',
      subTitle: 'Invalid Details!',
      buttons: ['OK']
    });

    this.nativeStorage.getItem('user_auth').then(
      accessToken => {

        if (this.commonMethod.checkNetwork() && mention_id != undefined) {
          // this.commonMethod.showLoader();
          this.commonMethod.putData(deleteMentionUrl + "/" + mention_id, objData, accessToken).subscribe(
            data => {

              this.commonMethod.hideLoader();
              this.nav.setRoot(FeedsPage, { feedId: id });
              //  this.nav.push(FeedDetailPage, { feed_id: id, feed_comment_id: feed_comment_id });
            },
            err => {
              this.commonMethod.hideLoader();
              alertVar.present();
              console.error("Error : " + err);
            },
            () => {
              this.commonMethod.hideLoader();
              console.log('getData completed');
            }
          );

        } else if (mention_id == undefined) {
          this.commonMethod.hideLoader();
          this.nav.setRoot(FeedsPage, { feedId: id });
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
  openGroupCaht(id, chat_message_id, message_date, mention_id, is_acknowledged) {



    this.sqlite.create({
      name: 'data.db',
      location: 'default'
    }).then((db: SQLiteObject) => {

      db.executeSql("SELECT chat_groups.*,chat_group_users.user_id FROM chat_groups LEFT JOIN chat_group_users ON chat_group_users.group_id=chat_groups.id WHERE chat_groups.id='" + id + "'", {}).then((allData) => {
        console.log("SELECT chat_groups.*,chat_group_users.user_id FROM chat_groups LEFT JOIN chat_group_users ON chat_group_users.group_id=chat_groups.id WHERE chat_groups.id='" + id + "'" + JSON.stringify(allData));

        if (allData.rows.length > 0) {
          this.commonMethod.hideLoader();

          this.goToGroupChat(id, chat_message_id, message_date, mention_id, is_acknowledged);
        }
        else {

          console.log("Group data not available!");
          /* Start DB code */
          let insertChatGroupsData = "";
          let updateChatGroupsData = "";
          let updateImageChatGroupsData = "";
          let updateChatGroupsQuery = "Update chat_groups SET name = (case ";
          let updateImageChatGroupsQuery = "Update chat_groups SET image_url = (case ";
          let tempVal = 0;
          let insertChatGroupUsersData = "";
          let updateChatGroupUsersGroupIdData = "";
          let updateChatGroupUsersUserIdData = "Else group_id End), user_id = (case ";
          let insertChatGroupUsersQuery = 'INSERT INTO chat_group_users (group_id, user_id, is_admin, deleted_at, created_at) VALUES ';
          let updateChatGroupUsersQuery = "UPDATE chat_group_users SET group_id = (case ";
          let insertChatGroupsQuery = 'INSERT INTO chat_groups (id, name, hotel_token, created_by_id, deleted_at, created_at, updated_at, image_url) VALUES ';
          let alertVar = this.alertCtrl.create({
            title: 'Error!',
            subTitle: 'Invalid Details!',
            buttons: ['OK']
          });

          this.nativeStorage.getItem('user_auth').then(
            accessToken => {

              if (this.commonMethod.checkNetwork()) {

                this.commonMethod.getData(getGroupsOnlyUrl + "?chat_id=" + id, accessToken).subscribe(
                  data => {
                    this.groupReponse = data.json();
                    this.sqlite.create({
                      name: 'data.db',
                      location: 'default'
                    }).then((db: SQLiteObject) => {

                      let allExistingIds = [];
                      db.executeSql("SELECT * FROM chat_groups", []).then((dataSQL) => {
                        console.log("GROUPS TABLE DATA: " + JSON.stringify(dataSQL));

                        if (dataSQL.rows.length > 0) {
                          for (let i = 0; i < dataSQL.rows.length; i++) {
                            allExistingIds.push({
                              id: dataSQL.rows.item(i).id
                            });
                          }
                        }

                        for (let i = 0; i < this.groupReponse.length; i++) {
                          let insertFlag = true;
                          for (let j = 0; j < allExistingIds.length; j++) {
                            if (this.groupReponse[i].chat.id == allExistingIds[j].id) {
                              insertFlag = false;
                            }
                          }

                          if (insertFlag == true) {
                            insertChatGroupsData = insertChatGroupsData + "('" + this.groupReponse[i].chat.id + "','" + this.groupReponse[i].chat.name + "','','" + this.groupReponse[i].chat.owner_id + "','','" + this.groupReponse[i].chat.created_at + "','','" + this.groupReponse[i].chat.image_url + "'),";
                          }
                          else {
                            updateChatGroupsData = updateChatGroupsData + "when id = " + this.groupReponse[i].chat.id + " then '" + this.groupReponse[i].chat.name + "' ";
                            updateImageChatGroupsData = updateImageChatGroupsData + "when id = " + this.groupReponse[i].chat.id + " then '" + this.groupReponse[i].chat.image_url + "' ";

                            if (i == this.groupReponse.length - 1) {
                              console.log("Update  chat_groups Data == " + updateChatGroupsQuery + updateChatGroupsData + " Else name End)");
                              if (updateChatGroupsData != "") {
                                db.executeSql(updateChatGroupsQuery + updateChatGroupsData + " Else name End)", {}).then((data1) => {
                                  console.log("UPDATED: " + JSON.stringify(data1));
                                }, (error1) => {
                                  console.log("UPDATED ERROR: " + JSON.stringify(error1));
                                });
                                db.executeSql(updateImageChatGroupsQuery + updateImageChatGroupsData + " Else image_url End)", {}).then((data1) => {
                                  console.log("UPDATED: " + JSON.stringify(data1));
                                }, (error1) => {
                                  console.log("UPDATED ERROR: " + JSON.stringify(error1));
                                });

                              }
                            }
                          }

                          /* Group users DB code start */
                          // db.executeSql('CREATE TABLE IF NOT EXISTS chat_group_users(group_id INTEGER, user_id INTEGER, is_admin INTEGER, deleted_at TEXT, created_at TEXT)', {})
                          //   .then((dbUserRes) => {
                          //     console.log("GROUP USER TABLE CREATED: " + JSON.stringify(dbUserRes));

                          let allExistingUserIds = [];
                          db.executeSql("SELECT * FROM chat_group_users WHERE group_id='" + this.groupReponse[i].chat.id + "'", []).then((dataUserSQL) => {
                            console.log("GROUP USER TABLE DATA: " + JSON.stringify(dataUserSQL));
                            tempVal = tempVal + 1;
                            if (dataUserSQL.rows.length > 0) {
                              for (let k = 0; k < dataUserSQL.rows.length; k++) {
                                allExistingUserIds.push({
                                  user_id: dataUserSQL.rows.item(k).user_id
                                });
                              }
                            }

                            for (let k = 0; k < this.groupReponse[i].chat.users.length; k++) {
                              let insertUserFlag = true;
                              for (let l = 0; l < allExistingUserIds.length; l++) {
                                if (this.groupReponse[i].chat.users[k].id == allExistingUserIds[l].user_id) {
                                  insertUserFlag = false;
                                }
                              }
                              if (insertUserFlag == true) {
                                insertChatGroupUsersData = insertChatGroupUsersData + "('" + this.groupReponse[i].chat.id + "','" + this.groupReponse[i].chat.users[k].id + "','0','','" + this.groupReponse[i].chat.users[k].joined_at + "'),";
                                console.log("insertChatGroupUsersData  " + insertChatGroupUsersData);
                              }
                              else {

                                updateChatGroupUsersGroupIdData = updateChatGroupUsersGroupIdData + "when user_id='" + this.groupReponse[i].chat.users[k].id + "' AND group_id='" + this.groupReponse[i].chat.id + "' then '" + this.groupReponse[i].chat.id + "' ";
                                updateChatGroupUsersUserIdData = updateChatGroupUsersUserIdData + "when user_id='" + this.groupReponse[i].chat.users[k].id + "' AND group_id='" + this.groupReponse[i].chat.id + "' then '" + this.groupReponse[i].chat.users[k].id + "' ";
                              }

                            }

                            if (tempVal == this.groupReponse.length) {
                              if (insertChatGroupUsersData != "") {
                                db.executeSql(insertChatGroupUsersQuery + insertChatGroupUsersData.substring(0, insertChatGroupUsersData.length - 1), {}).then((dataUser1) => {
                                  console.log("Data  == GROUP USER INSERTED: " + JSON.stringify(dataUser1));

                                  if (insertChatGroupsData != "") {
                                    db.executeSql(insertChatGroupsQuery + insertChatGroupsData.substring(0, insertChatGroupsData.length - 1), {}).then((data1) => {
                                      console.log("Data  == GROUPS INSERTED: " + JSON.stringify(data1));
                                      this.commonMethod.hideLoader();
                                      this.goToGroupChat(id, chat_message_id, message_date, mention_id, is_acknowledged);
                                    }, (error1) => {
                                      console.log("Data  == GROUPS INSERT ERROR: " + JSON.stringify(error1));
                                    });
                                  }

                                }, (errorUser1) => {
                                  console.log("Data  == GROUP USER INSERT ERROR: " + JSON.stringify(errorUser1));
                                });
                              } else if (updateChatGroupUsersGroupIdData == "") {
                                this.commonMethod.hideLoader();
                              }
                              if (updateChatGroupUsersGroupIdData != "") {
                                console.log("chat_group_users Data  == " + updateChatGroupUsersQuery + updateChatGroupUsersGroupIdData + updateChatGroupUsersUserIdData + "Else user_id End)");
                                db.executeSql(updateChatGroupUsersQuery + updateChatGroupUsersGroupIdData + updateChatGroupUsersUserIdData + "Else user_id End)", {}).then((dataUser1) => {

                                  if (insertChatGroupsData != "") {
                                    db.executeSql(insertChatGroupsQuery + insertChatGroupsData.substring(0, insertChatGroupsData.length - 1), {}).then((data1) => {
                                      console.log("Data  == GROUPS INSERTED: " + JSON.stringify(data1));
                                      this.commonMethod.hideLoader();
                                      this.goToGroupChat(id, chat_message_id, message_date, mention_id, is_acknowledged);
                                    }, (error1) => {
                                      console.log("Data  == GROUPS INSERT ERROR: " + JSON.stringify(error1));
                                    });
                                  }

                                  console.log(" 1 GROUP USER UPDATED: " + JSON.stringify(dataUser1) + "  " + i + "  " + this.groupReponse.length);
                                }, (errorUser1) => {
                                  console.log("GROUP USER UPDATED ERROR: " + JSON.stringify(errorUser1));
                                });
                              }
                            }
                          }, (errorUser) => {
                            console.log("1 ERROR: " + JSON.stringify(errorUser));
                          });

                          /* Group SQL code end  */

                        }

                      }, (error) => {
                        console.log("2 ERROR: " + JSON.stringify(error));
                      });



                      // }, (error) => {
                      //   console.error("Unable to execute sql", error);
                      // }).catch(e => console.log('Executed SQL Error= ' + JSON.stringify(e)));
                    }).catch(e => console.log(e));

                    this.commonMethod.hideLoader();

                  },
                  err => {
                    this.commonMethod.hideLoader();
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

          /* End DB code */

        }
      }, (error1) => {
        console.log("SELECT MEMBERS ERROR: " + JSON.stringify(error1));
      });

    }).catch(e => console.log(e));

    //  }
  }
  openPrivateChat(id, message_id, message_date, mention_id, is_acknowledged) {
    this.commonMethod.showLoader();
    let alertVar = this.alertCtrl.create({
      title: 'Error!',
      subTitle: 'Invalid Details!',
      buttons: ['OK']
    });
    this.nativeStorage.getItem('user_auth').then(
      accessToken => {

        if (this.commonMethod.checkNetwork()) {

          this.commonMethod.getData(getPrivateOnlyUrl + "?chat_id=" + id + "&is_private=true", accessToken).subscribe(
            data => {
              // this.commonMethod.hideLoader();

              this.chanelCreateData = data.json();
              console.log(this.chanelCreateData);
              // this.navCtrl.setRoot(ChattingPage);
              let privateInfoData = {
                "private_chat": true,
                "id": this.chanelCreateData[0].chat.id,
                "name": this.chanelCreateData[0].target_user.name,
                "created_at": this.chanelCreateData[0].chat.created_at,
                "owner_id": this.chanelCreateData[0].chat.owner_id,
                "message_date": message_date,
                "message_id": message_id,
                "highlight_message": true,
                "call": true,
                "is_acknowledged": is_acknowledged,
                "users": []
              };
              privateInfoData.users.push({ "id": this.chanelCreateData[0].chat.users[0].id });
              privateInfoData.users.push({ "id": this.chanelCreateData[0].chat.users[1].id });

              console.log(JSON.stringify(privateInfoData));
              // this.commonMethod.hideLoader();
              // this.nav.push(GroupChatPage, { groupInfo: privateInfoData });
              let objData = { status: 'checked' };
              let alertVar = this.alertCtrl.create({
                title: 'Error!',
                subTitle: 'Invalid Details!',
                buttons: ['OK']
              });

              this.nativeStorage.getItem('user_auth').then(
                accessToken => {

                  if (this.commonMethod.checkNetwork() && mention_id != undefined) {

                    this.commonMethod.putData(deleteMentionUrl + "/" + mention_id, objData, accessToken).subscribe(
                      data => {
                        this.commonMethod.hideLoader();
                        this.nav.push(GroupChatPage, { groupInfo: privateInfoData });
                      },
                      err => {
                        this.commonMethod.hideLoader();
                        alertVar.present();
                        console.error("Error : " + err);
                      },
                      () => {
                        this.commonMethod.hideLoader();
                        console.log('getData completed');
                      }
                    );

                  } else if (mention_id == undefined) {
                    this.commonMethod.hideLoader();
                    this.nav.push(GroupChatPage, { groupInfo: privateInfoData });
                  }
                  else {
                    this.commonMethod.hideLoader();
                    this.commonMethod.showNetworkError();
                  }

                },
                error => {
                  return '';
                }
              );

            },
            err => {
              this.commonMethod.hideLoader();
              alertVar.present();
              console.error("Error : " + err);
            },
            () => {
              this.commonMethod.hideLoader();
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

  goToGroupChat(id, message_id, message_date, mention_id, is_acknowledged) {
    let groupInfoData = {
      "id": id,
      "name": "",
      "image_url": "",
      "created_at": "",
      "owner_id": "",
      "message_date": "",
      "message_id": "",
      "highlight_message": true,
      "call": true,
      "is_acknowledged": is_acknowledged,
      "users": []
    };
    this.sqlite.create({
      name: 'data.db',
      location: 'default'
    }).then((db: SQLiteObject) => {

      db.executeSql("SELECT chat_groups.*,chat_group_users.user_id FROM chat_groups LEFT JOIN chat_group_users ON chat_group_users.group_id=chat_groups.id WHERE chat_groups.id='" + id + "'", {}).then((allData) => {
        console.log("SELECT chat_groups.*,chat_group_users.user_id FROM chat_groups LEFT JOIN chat_group_users ON chat_group_users.group_id=chat_groups.id WHERE chat_groups.id='" + id + "'" + JSON.stringify(allData));

        if (allData.rows.length > 0) {
          for (let i = 0; i < allData.rows.length; i++) {
            if (i == 0) {
              groupInfoData = {
                "id": allData.rows.item(i).id,
                "name": allData.rows.item(i).name,
                "image_url": allData.rows.item(i).image_url,
                "created_at": allData.rows.item(i).created_at,
                "owner_id": allData.rows.item(i).created_by_id,
                "message_date": message_date,
                "message_id": message_id,
                "highlight_message": true,
                "call": true,
                "is_acknowledged": is_acknowledged,
                "users": []
              };
            }
            groupInfoData.users.push({ "id": allData.rows.item(i).user_id });
          }

          console.log(JSON.stringify(groupInfoData));
          let objData = { status: 'checked' };
          let alertVar = this.alertCtrl.create({
            title: 'Error!',
            subTitle: 'Invalid Details!',
            buttons: ['OK']
          });

          this.nativeStorage.getItem('user_auth').then(
            accessToken => {

              if (this.commonMethod.checkNetwork() && mention_id != undefined) {

                this.commonMethod.putData(deleteMentionUrl + "/" + mention_id, objData, accessToken).subscribe(
                  data => {
                    // this.foundRepos.splice(index, 1);
                    this.commonMethod.hideLoader();
                    this.nav.push(GroupChatPage, { groupInfo: groupInfoData });
                  },
                  err => {
                    this.commonMethod.hideLoader();
                    alertVar.present();
                    console.error("Error : " + err);
                  },
                  () => {
                    this.commonMethod.hideLoader();
                    console.log('getData completed');
                  }
                );

              } else if (mention_id == undefined) {
                this.commonMethod.hideLoader();
                this.nav.push(GroupChatPage, { groupInfo: groupInfoData });
              }
              else {
                this.commonMethod.showNetworkError();
              }

            },
            error => {
              return '';
            }
          );



          //   this.nav.push(GroupChatPage, { groupInfo: groupInfoData });

        }
        else {
          this.commonMethod.hideLoader();
          alert("Group data not available!");
        }
      }, (error1) => {
        console.log("SELECT MEMBERS ERROR: " + JSON.stringify(error1));
      });

    }).catch(e => console.log(e));
  }

  showHideHotel() {
    this.showHotelMenu = this.showHotelMenu == true ? false : true;
  }

  logoutUser() {
    this.nativeStorage.getItem('user_auth').then(
      accessToken => {
        // alert(accessToken.db_version);
        // console.log(accessToken.db_version);
        let dbver;
        if (accessToken.db_version == undefined) {
          dbver = null;
        } else {
          dbver = accessToken.db_version;
        }
        this.nativeStorage.setItem('prev_db_version', dbver).then(() => {
          console.log('Stored item! dbversion');
          this.nativeStorage.setItem('prev_user_id', accessToken.user_id)
            .then(
              () => {

                if (this.cable == undefined) {
                } else {
                  this.cable.disconnect();
                }

                this.nativeStorage.setItem('prev_user_property_id', accessToken.property_token)
                  .then(
                    () => console.log('Stored prev_user_property_id!'),
                    error => console.error('Error storing prev_user_property_id', error)
                  );

                console.log('Stored item!');
                this.nativeStorage.remove('user_auth')
                  .then(
                    () => {
                      console.log('Removed item!');
                      this.nativeStorage.remove('lastPage');
                      this.nativeStorage.remove('groupInfo');
                      this.nativeStorage.remove('user_properties');
                      this.nativeStorage.remove('user_permissions');
                      this.nativeStorage.remove('broadcast_count');

                      this.nativeStorage.remove('feedData')
                        .then(
                          () => {
                            console.log('Removed feedData!');
                          },
                          error => console.error('Error storing item', error)
                        );

                      this.nativeStorage.remove('wo_data').then(() => {
                        console.log('Removed wo_data!');
                      },
                        error => console.error('Error remove wo_data', error)
                      );
                      this.nav.setRoot(LoginPage);
                    },
                    error => console.error('Error storing item', error)
                  );

              },
              error => console.error('Error storing item', error)
            );
        },

          error => console.error('Error storing item', error));

      },
      error => {
        this.nav.setRoot(LoginPage);
        return '';
      }
    );
  }


  subscribeAcNotification() {
    let propertyToken = '';
    let authToken = '';
    let userId = '';

    setTimeout(() => {
      this.nativeStorage.getItem('user_auth').then(
        accessToken => {
          propertyToken = accessToken.property_token;
          authToken = accessToken.access_token;
          userId = accessToken.user_id;

          let clientUrl = webSocketBaseUrl + "cable?property_token=" + propertyToken + "&auth_token=" + authToken;
          this.cable = ActionCable.createConsumer(clientUrl);
          let thisObj = this;

          this.cable.subscriptions.create({ channel: 'InAppNotificationsChannel', user_id: userId }, {
            connected: function () { console.log("cable: connected =" + 'InAppNotificationsChannel' + userId); },             // onConnect 
            disconnected: function () { console.log("cable: disconnected =" + 'InAppNotificationsChannel' + userId); },       // onDisconnect
            received: function (data) {
              console.log("InAppNotificationsChannel subscriptions =" + JSON.stringify(data)); // or update UI
              thisObj.updateNotificationCount(data);
            }
          });

        },
        error => {
          return '';
        }
      );

    }, 500);
  }

  updateNotificationCount(data) {
    //this.badge.increase(1);
    this.nativeStorage.getItem('user_notifications').then(
      notifications => {
        let feedCount = notifications.feed_count;
        let messageCount = notifications.message_count;
        let woCount = notifications.wo_count ? notifications.wo_count : 0;
        if (data.notification_type == 'new_feed') {
          feedCount = feedCount + 1;
        }
        if (data.notification_type == 'unread_message') {
          messageCount = messageCount + 1;
        }
        if (data.notification_type == 'new_work_order') {
          woCount = woCount + 1;
        }

        this.nativeStorage.setItem('user_notifications', { feed_count: feedCount, message_count: messageCount, wo_count: woCount })
          .then(
            () => console.log('Stored user_notifications!'),
            error => console.error('Error storing user_notifications', error)
          );
      },
      error => {
        return '';
      }
    );
  }
  getWOPermission() {
    this.commonMethod.getUserPermissions().then(
      permissions => {
        this.userPermissions = permissions;
      },
      error => {
        return false;
      }
    );
  }
  logSwipe() {
    this.zone.run(() => {
      this.showNotifyAlert = false;
      this.showNotification();
    });
  }
  someFunction(event) {
    //   alert(event.direction);

  }
  updateHtml(text): string {
    text = text.replace(/\n/g, "<br/>");
    // text = text.replace(/\n/g, " ");
    return text;
  }

  toWordUperCase(str) {
    return str.replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
  }

  showLoaderPage(userId) {
    let thisObj = this;
    this.nativeStorage.getItem('show_feed_loader').then(
      showLoader => {
        if (showLoader == true) {
          this.showPage = false;
          /* To manage loader on feed page */
          this.nativeStorage.setItem('show_feed_loader', false)
            .then(() => {
            },
              error => {
              });

          this.sqlite.create({
            name: 'data.db',
            location: 'default'
          }).then((db: SQLiteObject) => {

            console.log("location----: " + JSON.stringify(db));

            db.executeSql("SELECT name FROM members WHERE user_id='" + userId + "'", {}).then((allMembers) => {
              console.log("SELECT user name FROM DB: " + JSON.stringify(allMembers));

              if (allMembers.rows.length > 0) {
                for (let i = 0; i < allMembers.rows.length; i++) {

                  let fullNAme = this.toWordUperCase(allMembers.rows.item(i).name).split(" ");
                  this.userName = fullNAme[0] + "!";
                  let d = new Date();
                  let time = d.getHours();
                  if (time >= 5 && time < 12) {
                    this.displayText1 = "Good";
                    this.displayText2 = "Morning,";
                  }
                  else if (time >= 12 && time < 17) {
                    this.displayText1 = "Good";
                    this.displayText2 = "Afternoon,";
                  }
                  else if (time >= 17 && time < 21) {
                    this.displayText1 = "Good";
                    this.displayText2 = "Evening,";
                  }
                  //else if(time>=21 && time<5)
                  else {
                    this.displayText1 = "Hello,";
                    this.displayText2 = "";
                  }

                  setTimeout(function () {
                    thisObj.showChar.first = true;

                    setTimeout(function () {
                      thisObj.showChar.secound = true;

                      setTimeout(function () {
                        thisObj.showChar.third = true;

                        setTimeout(function () {
                          thisObj.showChar.fourth = true;

                          setTimeout(function () {
                            thisObj.showPage = true;
                            //thisObj.content.resize();
                          }, 3500);

                        }, 1000);

                      }, 500);

                    }, 500);

                  }, 500);

                }
              } else {
                thisObj.showPage = true;
              }

            }, (error1) => {
              console.log("SELECT MEMBERS ERROR: " + JSON.stringify(error1));
            });

          }).catch(e => console.log(e));




        }
      },
      error => {
        return '';
      }
    );
  }

  openSideMenu() {
    this.openSideMenuOpt = this.openSideMenuOpt == true ? false : true;
  }

  openWebPage(webUrl) {

    this.openSideMenuOpt = false;
    this.menuCtrl.close();
    this.nativeStorage.getItem('user_auth').then(
      accessToken => {
        let token = accessToken.access_token ? accessToken.access_token : '';
        let property_token = accessToken.property_token ? accessToken.property_token : '';
        let url = baseUrl + webUrl + "?authorization=" + token + "&property_token=" + property_token;
        console.log(url);
        let browser = this.iab.create(url, '_blank', 'location=no,closebuttoncaption=Back,toolbar=yes,EnableViewPortScale=yes,toolbarposition=top');
        console.log("link viewed");
        browser.on('exit').subscribe(
          () => {
            console.log('done');
            this.nav.setRoot(FeedsPage);
          },
          err => console.error(err));
      },
      error => {
        return '';
      }
    );
    //this.navCtrl.setRoot(WorkOrderPage,{id:id,page:'group_chat',group_data:this.groupInfo});
  }
  openWoPage() {
    this.nav.setRoot(WorkOrderPage);
  }

  openMentionsPage() {
    this.nav.setRoot(MyMentionPage);
  }

  openProfilePage() {
    this.nav.push(ProfilePage);
  }

  openTeamPage() {
    this.nav.push(TeamListingPage);
  }

  openTaskChecklistPage() {
    this.nav.setRoot(TaskChecklistPage);
  }

  editWorkOrder(wo_no) {
    let modal = this.modalCtrl.create(CreateWorkOrderPage, { wo_no: wo_no });
    modal.onDidDismiss(data => {

    });
    modal.present();
  }

  openPM() {
    let thisObj = this;
    setTimeout(() => {
      /* to solve android navigation issue */
      thisObj.openSideMenuOpt = false;
    }, 1000);
    this.nav.setRoot(RoomsMaintenancePage);
  }

  showNotification() {
    if (this.notificationStack.length > 0) {
      console.log("Array length 1 =" + this.notificationStack.length);
      console.log(JSON.stringify(this.notificationStack));
      this.notificationData = this.notificationStack[0];
      if (this.notificationStack.length > 1) {
        this.notificationStack = this.notificationStack.splice(0, 1);
      } else {
        this.notificationStack = [];
      }

      console.log("Array length 2 =" + this.notificationStack.length);
      this.zone.run(() => {
        this.showNotifyAlert = true;
      });
      let thisObj = this;
      setTimeout(() => {
        thisObj.zone.run(() => {
          thisObj.showNotifyAlert = false;
          console.log("call showNotification");
          thisObj.showNotification();
        });
      }, 15000);

    }
  }

  insertData(resOne, usersdata, propertyToken, hotelName, hotelCreated, notification, updateNewVersion) {
    let hotelCreatedDate = new Date(hotelCreated);
    let dd = ("0" + hotelCreatedDate.getDate()).slice(-2);
    let mm = ("0" + ((hotelCreatedDate.getMonth()) + 1)).slice(-2); //January is 0!
    let yyyy = hotelCreatedDate.getFullYear();

    this.nativeStorage.getItem('user_auth').then(
      accessToken => {
        //accessToken.db_version

        /* disconnect in app notification */
        if (this.cable == undefined) {
        } else {
          this.cable.disconnect();
        }

        // alert(accessToken.db_version);
        // console.log(accessToken.db_version);
        this.nativeStorage.remove('user_auth')
          .then(
            () => {
              console.log('Removed item!');
              this.nativeStorage.remove('lastPage');
              this.nativeStorage.remove('groupInfo');

              this.nativeStorage.remove('feedData')
                .then(
                  () => {
                    console.log('Removed feedData!');
                  },
                  error => console.error('Error storing item', error)
                );

              this.nativeStorage.remove('wo_data').then(() => {
                console.log('Removed wo_data!');
              },
                error => console.error('Error remove wo_data', error)
              );

              this.nativeStorage.setItem('user_auth', { access_token: accessToken.access_token, property_token: propertyToken, hotel_created: yyyy + '-' + mm + '-' + dd, hotel_name: hotelName, user_id: accessToken.user_id, db_version: accessToken.db_version })
                .then(
                  () => {
                    console.log('Stored item!');

                    this.sqlite.deleteDatabase({
                      name: 'data.db',
                      location: 'default'
                    })
                      .then((db: SQLiteObject) => {
                        console.log('DELETE DATABASE');

                        this.sqlite.create({
                          name: 'data.db',
                          location: 'default'
                        }).then((db: SQLiteObject) => {

                          db.executeSql('CREATE TABLE IF NOT EXISTS members(user_id INTEGER, hotel_token TEXT, name TEXT, image TEXT, role TEXT,title TEXT, is_maintenance_dep INTEGER, is_system_user INTEGER)', {})
                            .then((dbRes) => {

                              db.executeSql('CREATE TABLE IF NOT EXISTS chat_group_users(group_id INTEGER, user_id INTEGER, is_admin INTEGER, deleted_at TEXT, created_at TEXT)', {})
                                .then((dbUserRes) => {
                                  console.log("CREATE TABLE chat_group_users" + JSON.stringify(dbUserRes));

                                  db.executeSql("CREATE TABLE IF NOT EXISTS chat_messages(id INTEGER, sender_id INTEGER,hotel_token TEXT, message TEXT, image TEXT, target_id INTEGER, type TEXT, deleted_at TEXT, created_at TEXT, updated_at TEXT, read_status INTEGER, mentioned_user_ids TEXT, parent_id TEXT, work_order_id INTEGER, work_order_url TEXT, work_order_status TEXT, work_order_closed_by_user_id INTEGER, work_order_closed_at TEXT, work_order_location_detail TEXT, work_order_description TEXT,room_number TEXT,room_id TEXT)", {}).then((data1) => {
                                    console.log("MESSAGE TABLE CREATED: " + JSON.stringify(data1));

                                    db.executeSql('CREATE TABLE IF NOT EXISTS chat_groups(id INTEGER, name TEXT, hotel_token TEXT, created_by_id INTEGER,deleted_at TEXT,created_at TEXT,updated_at TEXT, image_url TEXT)', {})
                                      .then((dbRes) => {
                                        console.log("CREATE TABLE chat_groups" + JSON.stringify(dbRes));

                                        db.executeSql('CREATE TABLE IF NOT EXISTS user_mentions (type TEXT, type_id INTEGER, user_id INTEGER,total INTEGER)', {})
                                          .then((dbRes) => {
                                            console.log("CREATE TABLE user_mentions" + JSON.stringify(dbRes));

                                            /*  get member api call start */
                                            this.nativeStorage.getItem('user_auth').then(
                                              accessToken => {

                                                this.subscribeAcNotification();



                                                //this.foundRepos = data.json();
                                                let users = this.usersdata;
                                                console.error(users);


                                                for (let i = 0; i < users.length; i++) {
                                                  let is_maintenance_dep = 0;
                                                  for (let val = 0; val < users[i].departments.length; val++) {
                                                    console.log("departments" + users[i].departments[val].name);
                                                    if (users[i].departments[val].name == "Maintenance") {
                                                      is_maintenance_dep = 1;
                                                    }
                                                  }
                                                  console.log("departments maintainance" + is_maintenance_dep);

                                                  let is_system_user = users[i].is_system_user == true ? 1 : 0;
                                                  db.executeSql("INSERT INTO members (user_id, hotel_token, name, image, role, title,is_maintenance_dep, is_system_user) VALUES ('" + users[i].id + "','','" + users[i].name + "','" + users[i].avatar_img_url + "','" + users[i].role + "','" + users[i].title + "'," + is_maintenance_dep + "," + is_system_user + ")", {}).then((data1) => {
                                                    console.log("INSERTED: " + JSON.stringify(data1));
                                                  }, (error1) => {
                                                    console.log("INSERT ERROR: " + JSON.stringify(error1));
                                                  });
                                                }

                                                this.nativeStorage.getItem('user_properties').then(
                                                  properties => {
                                                    var index;
                                                    for (let i = 0; i < properties.length; i++) {
                                                      if (properties[i].token == propertyToken) {
                                                        index = i;
                                                      }
                                                    }
                                                    this.events.publish('updateHotel:list', properties, index);

                                                    this.events.publish('subscribeInAppNotification');
                                                  },
                                                  error => {
                                                    console.log("userProperties error" + error);
                                                  }
                                                );

                                                this.currentHotelName = hotelName;
                                                this.showHotelMenu = false;


                                                let res = this.resOne;
                                                this.nativeStorage.setItem('broadcast_count', res.length)
                                                  .then(
                                                    () => {
                                                      console.log('Stored broadcast_count!');
                                                      if (notification == undefined || notification == 'undefined') {
                                                        this.commonMethod.hideLoader();
                                                        this.nav.setRoot(FeedsPage);
                                                      } else {
                                                        this.nativeStorage.setItem('lastPage', { "pageName": FeedsPage.name, "index": this.nav.getActive().index });

                                                        this.openSpecificPage(notification);
                                                      }
                                                    },
                                                    error => console.error('Error storing broadcast_count', error)
                                                  );

                                              },
                                              error => {
                                                this.commonMethod.hideLoader();
                                                return '';
                                              }
                                            );
                                            /*  get member api call end */

                                          }, (error) => {
                                            console.error("Unable to execute sql user_mentions", error);
                                          }).catch(e => console.log('Executed SQL Error= user_mentions' + JSON.stringify(e)));

                                      }, (error) => {
                                        console.error("Unable to execute sql", error);
                                      }).catch(e => console.log('Executed SQL Error= ' + JSON.stringify(e)));

                                  }, (error) => {
                                    console.error("Unable to execute sql", error);
                                  }).catch(e => console.log('Executed SQL Error= ' + JSON.stringify(e)));

                                }, (error) => {
                                  console.error("Unable to execute sql", error);
                                }).catch(e => console.log('Executed SQL Error= ' + JSON.stringify(e)));


                            }, (error) => {
                              console.error("Unable to execute sql", error);
                            }).catch(e => console.log('Executed SQL Error= ' + JSON.stringify(e)));

                        });

                      })
                      .catch(e => console.log(e));
                  },
                  error => console.error('Error storing item', error)
                );

            },
            error => console.error('Error storing item', error)
          );
      },
      error => {
        this.commonMethod.hideLoader();
        return '';
      }
    );
  }

  getUserPermissions(resOne, usersdata, propertyToken, hotelName, hotelCreated, notification, updateNewVersion, tokenValue) {
    let alertVar = this.alertCtrl.create({
      title: 'Error!',
      subTitle: 'Invalid Details!',
      buttons: ['OK']
    });

    this.nativeStorage.getItem('user_auth').then(
      accessToken => {

        if (this.commonMethod.checkNetwork()) {
          this.commonMethod.getDataWithoutLoder(getUserPermissionsUrl, tokenValue).subscribe(
            data => {
              let res = data.json();
              console.log(JSON.stringify(res));
              this.nativeStorage.setItem('user_permissions', res)
                .then(
                  () => {
                    console.log('Stored user_permissions!');
                    this.events.publish('update:permiossion');
                    this.insertData(resOne, usersdata, propertyToken, hotelName, hotelCreated, notification, updateNewVersion);
                  },
                  error => console.error('Error storing user_permissions', error)
                );
              //alert(this.userData); 
            },
            err => {
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

  openReviewCheckList(detail) {
    if (detail.task_list_record_id > 0) {
      this.nav.push(TaskChecklistDetailPage, { id: '', name: '', task_list_record_id: detail.task_list_record_id, finished_by_name: '', permission_to: 'review', type: 'view_review' });

      // let alertVar = this.alertCtrl.create({
      //   title: 'Error!',
      //   subTitle: 'Invalid Details!',
      //   buttons: ['OK']
      // });
      // this.nativeStorage.getItem('user_auth').then(
      //   accessToken => {
      //     if (this.commonMethod.checkNetwork()) {

      //       this.commonMethod.getData(getTaskListDetailsUrl+"/"+detail.task_list_record_id, accessToken).subscribe(
      //         data => {
      //           let foundRepos = data.json();
      //           console.log(foundRepos);
      //           this.commonMethod.hideLoader();
      //           this.nav.push(TaskChecklistDetailPage,{listData:foundRepos,name:foundRepos.task_list.name,review:true,finished_by_name:foundRepos.finished_by.name,permission_to:'review'});
      //         },
      //         err => {
      //           this.commonMethod.hideLoader();
      //           console.log("Error 1: " + JSON.stringify(err.json()));
      //           let res = err.json();

      //           if (typeof (res.error) !== undefined) {
      //             let alertVarErr = this.alertCtrl.create({
      //               title: 'Error!',
      //               subTitle: res.error ? res.error : 'Invalid Details!',
      //               buttons: ['OK']
      //             });
      //             alertVarErr.present();
      //           }
      //           else {
      //             let alertVarErr = this.alertCtrl.create({
      //               title: 'Error!',
      //               subTitle: 'Invalid Details!',
      //               buttons: ['OK']
      //             });
      //             alertVarErr.present();
      //           }
      //         },
      //         () => {
      //           this.commonMethod.hideLoader();
      //           console.log('getData completed');
      //         }
      //       );
      //     }
      //     else {
      //       this.commonMethod.showNetworkError();
      //     }
      //   },
      //   error => {
      //     return '';
      //   }
      // );
    }
  }

  updateNotifications() {

    let objData = {
      enabled: this.notificationsStatus ? true : false
    };

    let alertVar = this.alertCtrl.create({
      title: 'Error!',
      subTitle: 'Invalid Details!',
      buttons: ['OK']
    });
    this.nativeStorage.getItem('user_auth').then(
      accessToken => {
        if (this.commonMethod.checkNetwork()) {
          //let objData = this.notificationData;
          this.commonMethod.putDataWithoutLoder(updatePushNotificationSettings, objData, accessToken).subscribe(
            data => {
              let foundRepos = data.json();
              //this.updateNotificationsStatus();
            },
            err => {
              //this.commonMethod.hideLoader();
              console.error("Error : " + err);
              let res = err.json();
              if (typeof (res.errors.message) !== undefined) {
                let alertVarErr = this.alertCtrl.create({
                  title: 'Error!',
                  subTitle: res.errors ? res.errors : 'Invalid Details!',
                  buttons: ['OK']
                });
                alertVarErr.present();
              }
              else {
                alertVar.present();
              }
            },
            () => {
              //this.commonMethod.hideLoader();
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

  updateNotificationsStatus() {
    this.nativeStorage.getItem('user_auth').then(
      accessToken => {
        let userId = accessToken.user_id;
        //alert(this.userId)
        if (this.commonMethod.checkNetwork()) {
          //this.spinner=true;
          this.commonMethod.getDataWithoutLoder(getProfileUrl + "/" + userId, accessToken).subscribe(
            data => {
              let userData = data.json();
              this.notificationsStatus = userData.push_notification_enabled;
              this.navigateToUpdateAppPage(false)
            },
            err => {
              console.error("Error : " + err);
            },
            () => {
              //this.commonMethod.hideLoader();
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

  /**
   * Navigate user to update screen page, where user will be having an option to update his app
   * 
   * @param isForceUpdate required parameter to show or hide the dismiss button. 
   * If it is true, user will no longer have the option to dismiss that screen.
   */
  navigateToUpdateAppPage(isForceUpdate: boolean) {
    this.nav.push(UpdateAppPage, {
      isForceUpdate: isForceUpdate
    })
  }

  sendEmail() {

    let emailText = "Device information - <br>";
    emailText += "Platform : " + this.device.platform + " <br>";
    emailText += "Model : " + this.device.model + " <br>";
    emailText += "Version : " + this.device.version + " <br>";
    //console.log(emailText);

    let email = {
      to: 'support@lodgistics.freshdesk.com',
      // cc: 'nikhil@lodgistics.com',
      // bcc: ['john@doe.com', 'jane@doe.com'],
      subject: '',
      body: emailText,
      isHtml: true
    };
    // Send a text message using default options
    this.emailComposer.open(email);
  }



}

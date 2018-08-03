import { Component, ViewChild, NgZone } from '@angular/core';
import { NavController, AlertController, Platform, Events, NavParams } from 'ionic-angular';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Validator } from '../../validator';
import { srviceMethodsCall } from '../../services/serviceMethods';
import { getLoginUrl, getMentionables } from '../../services/configURLs';
import { getAllMembersUrl } from '../../services/configURLs';
import { NativeStorage } from '@ionic-native/native-storage';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { Device } from '@ionic-native/device';
import { FeedsPage } from '../feeds/feeds';
import { ForgetPasswordPage } from '../forgetPassword/forgetPassword';
import { NewAccountPage } from '../newAccount/newAccount';
import { platformName } from '../../providers/appConfig';
import { MyMentionPage } from '../myMention/myMention';
import { locationsUrl } from '../../services/configURLs';
import { dbVersion } from '../../providers/appConfig';
import ActionCable from 'actioncable';
import { getUserPermissionsUrl } from '../../services/configURLs';
import { getBroadcastListUrl } from '../../services/configURLs';
import { NotificationPermissionPage } from '../notificationPermission/notificationPermission';

@Component({
  selector: 'page-login',
  templateUrl: 'login.html',
  providers: [srviceMethodsCall, NativeStorage, SQLite, Device]
})
export class LoginPage {

  public loginForm: FormGroup;
  public email;
  public password;
  public foundRepos;
  public type = "password";
  public showPass = false;
  public users: any;
  public pushRegistrationId: any;
  public locationType: any;
  public room: any;
  public publicArea: any;
  public equipment: any;
  public permissionData: any;
  public cable: any;
  public notification: any;
  public showLoader = false;

  constructor(public navCtrl: NavController, private _FB: FormBuilder, public commonMethod: srviceMethodsCall, public alertCtrl: AlertController, public nativeStorage: NativeStorage, private sqlite: SQLite, private device: Device, public platform: Platform, public events: Events, public navParams: NavParams, public zone: NgZone) {

    this.notification = this.navParams.get('notification');
    this.loginForm = _FB.group({
      email: Validator.loginEmailValidator,
      password: Validator.passwordValidator
    });

    this.email = this.loginForm.controls['email'];
    this.password = this.loginForm.controls['password'];

    this.platform.ready().then(() => {

      this.nativeStorage.getItem('device_token').then(
        data => { console.log(data); this.pushRegistrationId = data.tokenId; },
        error => { console.error(error); }
      );

      this.nativeStorage.getItem('user_auth').then(
        accessToken => {
          /* If user login redirect to feed page */
          if (accessToken.access_token && accessToken.access_token != '') {
            this.navCtrl.setRoot(FeedsPage);
          }
        },
        error => {
          return '';
        }
      );

    });

    //
  }

  doLogin(formData) {
    this.nativeStorage.getItem('device_token').then(
      data => {
        console.log(data); this.pushRegistrationId = data.tokenId;
        this.doLoginWithToken(formData);
      },
      error => {
        console.error(error);
        this.doLoginWithToken(formData);
      }
    );
  }

  doLoginWithToken(formData) {
    //console.log('Form submitted is ', formData);
    //this.myData = formData;
    console.log('Device UUID is: ' + this.device.uuid);
    let objData = { 'user': { 'email': this.loginForm.value["email"], 'password': this.loginForm.value["password"], 'device_platform': platformName, 'device_token': this.pushRegistrationId } };

    let alertVar = this.alertCtrl.create({
      title: 'Error!',
      subTitle: 'Invalid Details!',
      buttons: ['OK']
    });

    if (this.commonMethod.checkNetwork()) {
      this.showLoader = true;
      this.commonMethod.postDataWithoutLoder(getLoginUrl, objData, '').subscribe(
        data => {
          this.foundRepos = data.json();
          let properties = this.foundRepos.user.properties;

          /* To manage loader on feed page */
          this.nativeStorage.setItem('show_feed_loader', true)
            .then(() => {
            },
              error => {
              });

          this.nativeStorage.getItem('prev_user_id').then(
            prevUserId => {
              console.log("prevUserId=" + prevUserId + "  this.foundRepos " + this.foundRepos);

              var index = 0;
              if (this.notification != undefined && (prevUserId > 0 && prevUserId == this.foundRepos.user.id)) {
                for (let i = 0; i < properties.length; i++) {
                  if (properties[i].token == this.notification.additionalData.type.property_token) {
                    index = i;
                  }
                }
              }

              this.nativeStorage.setItem('user_properties', properties)
                .then(
                  () => console.log('Stored user_properties!'),
                  error => console.error('Error storing user_properties', error)
                );

              this.nativeStorage.setItem('user_notifications', { feed_count: 0, message_count: 0 })
                .then(
                  () => console.log('Stored user_notifications!'),
                  error => console.error('Error storing user_notifications', error)
                );

              this.loginStep2(index);
            },
            error => {
              //this.events.publish('updateHotel:list', properties,0);
              //this.events.publish('subscribeInAppNotification');

              this.nativeStorage.setItem('user_properties', properties)
                .then(
                  () => console.log('Stored user_properties!'),
                  error => console.error('Error storing user_properties', error)
                );

              this.nativeStorage.setItem('user_notifications', { feed_count: 0, message_count: 0 })
                .then(
                  () => console.log('Stored user_notifications!'),
                  error => console.error('Error storing user_notifications', error)
                );

              this.loginStep2(0);
            });

        },
        err => {
          //this.commonMethod.hideLoader();
          this.showLoader = false;
          console.log("Error 1: " + JSON.stringify(err.json()));
          let res = err.json();
          if (typeof (res.errors.message) !== undefined) {
            let alertVarErr = this.alertCtrl.create({
              title: 'Error!',
              subTitle: res.errors.message ? res.errors.message : 'Invalid email/username or password.',
              buttons: ['OK']
            });
            alertVarErr.present();
          }
          else {
            let alertVarErr = this.alertCtrl.create({
              title: 'Error!',
              subTitle: 'Invalid email/username or password.',
              buttons: ['OK']
            });
            alertVarErr.present();
          }
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


  }

  loginStep2(propertyIndex) {
    this.nativeStorage.getItem('prev_db_version').then(
      prev_db_version => {
        if (prev_db_version != null && prev_db_version != undefined && prev_db_version != dbVersion) {
          this.nativeStorage.setItem('prev_db_version', dbVersion).then(() => {
            this.loginStep3(propertyIndex, true, true);
          },
            error => {
            });
        } else {
          this.loginStep3(propertyIndex, false, false);
        }
      }, error => {
        console.log("prev_db_version error" + error);
        this.nativeStorage.setItem('prev_user_id', '0')
          .then(
            () => {

              this.nativeStorage.setItem('prev_user_property_id', '')
                .then(
                  () => {
                    console.log('Stored prev_user_property_id!');
                    this.sqlite.create({
                      name: 'data.db',
                      location: 'default'
                    }).then((db: SQLiteObject) => {
                      this.loginStep3(propertyIndex, true, false);
                    });
                  },
                  error => console.error('Error storing prev_user_property_id', error)
                );
            },
            error => console.error('Error storing prev_user_id', error)
          );
      });
  }

  loginStep3(propertyIndex, deleteDb, updateNewVersion) {
    this.nativeStorage.getItem('prev_user_property_id').then(
      prevUserPropertyId => {

        this.nativeStorage.getItem('prev_user_id').then(
          prevUserId => {
            console.log("prevUserId=" + prevUserId);

            if (deleteDb || (prevUserId > 0 && ((prevUserId != this.foundRepos.user.id) || (prevUserPropertyId && prevUserPropertyId != this.foundRepos.user.properties[propertyIndex].token)))) {

              //If DB chaged from old verion  
              if (updateNewVersion == true) {
                //this.commonMethod.hideLoader();
                this.showLoader = false;
                this.commonMethod.showLoaderForDbSync();
              }

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
                                      this.processLogin(propertyIndex, updateNewVersion);

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
            }
            else {
              this.processLogin(propertyIndex, updateNewVersion);
            }
          },
          error => {
            console.log("prevUserId error 2" + error);
            this.processLogin(propertyIndex, updateNewVersion);
          }
        );

      },
      error => {
        console.log("prevUserId error 1" + error);
        this.processLogin(propertyIndex, updateNewVersion);
      });


  }


  processLogin(propertyIndex, updateNewVersion) {
    let alertVar = this.alertCtrl.create({
      title: 'Error!',
      subTitle: 'Invalid Details!',
      buttons: ['OK']
    });

    let hotelCreatedDate = new Date(this.foundRepos.user.properties[propertyIndex].created_at);
    let dd = ("0" + hotelCreatedDate.getDate()).slice(-2);
    let mm = ("0" + ((hotelCreatedDate.getMonth()) + 1)).slice(-2); //January is 0!
    let yyyy = hotelCreatedDate.getFullYear();

    this.nativeStorage.setItem('user_auth', { access_token: this.foundRepos.access_token, property_token: this.foundRepos.user.properties[propertyIndex].token, hotel_created: yyyy + '-' + mm + '-' + dd, hotel_name: this.foundRepos.user.properties[propertyIndex].name, user_id: this.foundRepos.user.id, db_version: dbVersion })
      .then(
        () => {
          console.log('processLogin Stored item!');
          this.events.publish('updateHotel:list', this.foundRepos.user.properties, propertyIndex);
          this.events.publish('subscribeInAppNotification');
          this.events.publish('update:updateNotificationsStatus');
        },
        error => console.error('Error storing item', error)
      );


    this.sqlite.create({
      name: 'data.db',
      location: 'default'
    }).then((db: SQLiteObject) => {

      this.nativeStorage.getItem('prev_db_version').then(
        prev_db_version => {

          // db.executeSql('CREATE TABLE IF NOT EXISTS members(user_id INTEGER, hotel_token TEXT, name TEXT, image TEXT, role TEXT,title TEXT, is_maintenance_dep INTEGER, is_system_user INTEGER)', {})
          //   .then((dbRes) => {
          this.nativeStorage.getItem('prev_db_version').then(
            prev_db_version => {
              // alert(prev_db_version);
              if (prev_db_version != null && prev_db_version != undefined && prev_db_version == dbVersion) {
                this.nativeStorage.setItem('user_auth', { access_token: this.foundRepos.access_token, property_token: this.foundRepos.user.properties[propertyIndex].token, hotel_created: yyyy + '-' + mm + '-' + dd, hotel_name: this.foundRepos.user.properties[propertyIndex].name, user_id: this.foundRepos.user.id, db_version: dbVersion })
                  .then(() => this.insertDb(db, alertVar, updateNewVersion),
                    error => console.error('Error storing item', error)
                  );
              }
              else {
                this.nativeStorage.getItem('user_auth').then(
                  accessToken => {
                    /* If user login redirect to feed page */
                    if (accessToken.access_token && accessToken.access_token != '') {

                      if (accessToken.db_version != null && accessToken.db_version != undefined) {
                        //parseFloat(accessToken.db_version)<dbVersion
                        // if (accessToken.db_version <= 0.1) {
                        //   db.executeSql("ALTER TABLE chat_messages ADD COLUMN work_order_url TEXT", {})
                        //   .then((dbRes) => {
                        //     console.log("chat_messages added");
                        //   }, (error) => {
                        //     console.error("Unable to execute sql", error);
                        //   }).catch(e => console.log('Executed SQL Error= ' + JSON.stringify(e)));

                        //   db.executeSql("ALTER TABLE chat_messages ADD COLUMN work_order_closed_by_user_id INTEGER", {})
                        //   .then((dbRes) => {
                        //     console.log("chat_messages added work_order_closed_by_user_id");
                        //   }, (error) => {
                        //     console.error("Unable to execute sql", error);
                        //   }).catch(e => console.log('Executed SQL Error= ' + JSON.stringify(e)));

                        //   db.executeSql("ALTER TABLE chat_messages ADD COLUMN work_order_closed_at TEXT", {})
                        //   .then((dbRes) => {
                        //     console.log("chat_messages added work_order_closed_at");
                        //   }, (error) => {
                        //     console.error("Unable to execute sql", error);
                        //   }).catch(e => console.log('Executed SQL Error= ' + JSON.stringify(e)));

                        //   db.executeSql("ALTER TABLE chat_messages ADD COLUMN work_order_location_detail TEXT", {})
                        //   .then((dbRes) => {
                        //     console.log("chat_messages added work_order_location_detail");
                        //   }, (error) => {
                        //     console.error("Unable to execute sql", error);
                        //   }).catch(e => console.log('Executed SQL Error= ' + JSON.stringify(e)));

                        //   db.executeSql("ALTER TABLE chat_messages ADD COLUMN work_order_description TEXT", {})
                        //   .then((dbRes) => {
                        //     console.log("chat_messages added work_order_description");
                        //   }, (error) => {
                        //     console.error("Unable to execute sql", error);
                        //   }).catch(e => console.log('Executed SQL Error= ' + JSON.stringify(e)));

                        //   db.executeSql("ALTER TABLE members ADD COLUMN is_system_user INTEGER", {})
                        //   .then((dbRes) => {
                        //     console.log("is_system_user added");
                        //   }, (error) => {
                        //     console.error("Unable to execute sql", error);
                        //   }).catch(e => console.log('Executed SQL Error= ' + JSON.stringify(e)));

                        //   db.executeSql("ALTER TABLE chat_messages ADD COLUMN work_order_status TEXT", {})
                        //   .then((dbRes) => {
                        //     console.log("chat_messages added");
                        //     this.nativeStorage.setItem('user_auth', { access_token: this.foundRepos.access_token, property_token: this.foundRepos.user.properties[propertyIndex].token, hotel_created: yyyy + '-' + mm + '-' + dd, hotel_name: this.foundRepos.user.properties[propertyIndex].name, user_id: this.foundRepos.user.id, db_version: dbVersion })
                        //     .then(() => this.insertDb(dbRes, db, alertVar),
                        //     error => console.error('Error storing item', error)
                        //     );
                        //   }, (error) => {
                        //     console.error("Unable to execute sql", error);
                        //   }).catch(e => console.log('Executed SQL Error= ' + JSON.stringify(e)));
                        // }
                        // else {
                        //   db.executeSql("ALTER TABLE chat_messages ADD COLUMN work_order_id INTEGER", {})
                        //     .then((dbRes) => {
                        //       console.log("chat_messages added");
                        //     }, (error) => {
                        //       console.error("Unable to execute sql", error);
                        //     }).catch(e => console.log('Executed SQL Error= ' + JSON.stringify(e)));
                        //     db.executeSql("ALTER TABLE chat_messages ADD COLUMN room_id TEXT", {})
                        //     .then((dbRes) => {
                        //       console.log("room_id added");
                        //     }, (error) => {
                        //       console.error("Unable to execute sql", error);
                        //     }).catch(e => console.log('Executed SQL Error= ' + JSON.stringify(e)));

                        //     db.executeSql("ALTER TABLE chat_messages ADD COLUMN room_number TEXT", {})
                        //     .then((dbRes) => {
                        //       console.log("room_number added");
                        //     }, (error) => {
                        //       console.error("Unable to execute sql", error);
                        //     }).catch(e => console.log('Executed SQL Error= ' + JSON.stringify(e)));
                        //     db.executeSql("ALTER TABLE chat_messages ADD COLUMN work_order_url TEXT", {})
                        //     .then((dbRes) => {
                        //       console.log("chat_messages added");
                        //     }, (error) => {
                        //       console.error("Unable to execute sql", error);
                        //     }).catch(e => console.log('Executed SQL Error= ' + JSON.stringify(e)));
                        //     db.executeSql("ALTER TABLE chat_messages ADD COLUMN work_order_status TEXT", {})
                        //     .then((dbRes) => {
                        //       console.log("chat_messages added");
                        //     }, (error) => {
                        //       console.error("Unable to execute sql", error);
                        //     }).catch(e => console.log('Executed SQL Error= ' + JSON.stringify(e)));

                        //     db.executeSql("ALTER TABLE chat_messages ADD COLUMN work_order_closed_by_user_id INTEGER", {})
                        //     .then((dbRes) => {
                        //       console.log("chat_messages added work_order_closed_by_user_id");
                        //     }, (error) => {
                        //       console.error("Unable to execute sql", error);
                        //     }).catch(e => console.log('Executed SQL Error= ' + JSON.stringify(e)));

                        //     db.executeSql("ALTER TABLE chat_messages ADD COLUMN work_order_closed_at TEXT", {})
                        //     .then((dbRes) => {
                        //       console.log("chat_messages added work_order_closed_at");
                        //     }, (error) => {
                        //       console.error("Unable to execute sql", error);
                        //     }).catch(e => console.log('Executed SQL Error= ' + JSON.stringify(e)));

                        //     db.executeSql("ALTER TABLE chat_messages ADD COLUMN work_order_location_detail TEXT", {})
                        //     .then((dbRes) => {
                        //       console.log("chat_messages added work_order_location_detail");
                        //     }, (error) => {
                        //       console.error("Unable to execute sql", error);
                        //     }).catch(e => console.log('Executed SQL Error= ' + JSON.stringify(e)));

                        //     db.executeSql("ALTER TABLE chat_messages ADD COLUMN work_order_description TEXT", {})
                        //     .then((dbRes) => {
                        //       console.log("chat_messages added work_order_description");
                        //     }, (error) => {
                        //       console.error("Unable to execute sql", error);
                        //     }).catch(e => console.log('Executed SQL Error= ' + JSON.stringify(e)));


                        //     db.executeSql("ALTER TABLE members ADD COLUMN is_system_user INTEGER", {})
                        //     .then((dbRes) => {
                        //       console.log("is_system_user added");
                        //     }, (error) => {
                        //       console.error("Unable to execute sql", error);
                        //     }).catch(e => console.log('Executed SQL Error= ' + JSON.stringify(e)));


                        //   db.executeSql("ALTER TABLE members ADD COLUMN is_maintenance_dep INTEGER", {}).then((dbRes) => {
                        //     db.executeSql("UPDATE members SET is_maintenance_dep = 0;", {}).then((dbRes) => {
                        //       this.nativeStorage.setItem('user_auth', { access_token: this.foundRepos.access_token, property_token: this.foundRepos.user.properties[propertyIndex].token, hotel_created: yyyy + '-' + mm + '-' + dd, hotel_name: this.foundRepos.user.properties[propertyIndex].name, user_id: this.foundRepos.user.id, db_version: dbVersion })
                        //         .then(() => this.insertDb(dbRes, db, alertVar),
                        //         error => console.error('Error storing item', error)

                        //         );
                        //     });
                        //   }, (error) => {
                        //     console.error("Unable to execute sql alter ", error);

                        //   });

                        // }

                      }
                    }
                  });


              }
            });
          // this.insertDb(dbRes,db,alertVar);
          // }, (error) => {
          //   console.error("Unable to execute sql", error);
          // }).catch(e => console.log('Executed SQL Error= ' + JSON.stringify(e)));

        }, (error) => {

          console.log("no previous data");
          // db.executeSql('CREATE TABLE IF NOT EXISTS members(user_id INTEGER, hotel_token TEXT, name TEXT, image TEXT, role TEXT,title TEXT, is_maintenance_dep INTEGER, is_system_user INTEGER)', {})
          //   .then((dbRes) => {

          this.nativeStorage.setItem('user_auth', { access_token: this.foundRepos.access_token, property_token: this.foundRepos.user.properties[propertyIndex].token, hotel_created: yyyy + '-' + mm + '-' + dd, hotel_name: this.foundRepos.user.properties[propertyIndex].name, user_id: this.foundRepos.user.id, db_version: dbVersion })
            .then(() => this.insertDb(db, alertVar, updateNewVersion),
              error => console.error('Error storing item', error)

            );

          // this.insertDb(dbRes,db,alertVar);
          // }, (error) => {
          //   console.error("Unable to execute sql", error);
          // }).catch(e => console.log('Executed SQL Error= ' + JSON.stringify(e)));


        });


    }).catch(e => console.log(e));


  }
  insertDb(db, alertVar, updateNewVersion) {

    //console.log("TABLE CREATED: " + JSON.stringify(dbRes));

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
                this.users = data.json();
                //console.error(this.users);

                for (let i = 0; i < this.users.length; i++) {
                  let insertFlag = true;
                  for (let j = 0; j < allExistingIds.length; j++) {
                    if (this.users[i].id == allExistingIds[j].user_id) {
                      insertFlag = false;
                    }
                  }
                  let is_maintenance_dep = 0;
                  for (let val = 0; val < this.users[i].departments.length; val++) {
                    console.log("departments" + this.users[i].departments[val].name);
                    if (this.users[i].departments[val].name == "Maintenance") {
                      is_maintenance_dep = 1;
                    }
                  }
                  console.log("departments maintainance" + is_maintenance_dep);

                  let is_system_user = this.users[i].is_system_user == true ? 1 : 0;
                  if (insertFlag == true) {
                    db.executeSql("INSERT INTO members (user_id, hotel_token, name, image, role, title,is_maintenance_dep, is_system_user) VALUES ('" + this.users[i].id + "','','" + this.users[i].name + "','" + this.users[i].avatar_img_url + "','" + this.users[i].role + "','" + this.users[i].title + "'," + is_maintenance_dep + "," + is_system_user + ")", {}).then((data1) => {

                      console.log("INSERTED: " + JSON.stringify(data1));
                    }, (error1) => {
                      console.log("INSERT ERROR: " + JSON.stringify(error1));
                    });
                  }
                  else {
                    db.executeSql("UPDATE members SET user_id='" + this.users[i].id + "', hotel_token='', name='" + this.users[i].name + "', image='" + this.users[i].avatar_img_url + "', role='" + this.users[i].role + "', is_maintenance_dep=" + is_maintenance_dep + ", is_system_user=" + is_system_user + " WHERE user_id='" + this.users[i].id + "'", {}).then((data1) => {
                      console.log("UPDATED: " + JSON.stringify(data1));
                    }, (error1) => {
                      console.log("UPDATED ERROR: " + JSON.stringify(error1));
                    });
                  }
                }

                /* DB creation process */
                /* Group users DB code start */
                // db.executeSql('CREATE TABLE IF NOT EXISTS chat_group_users(group_id INTEGER, user_id INTEGER, is_admin INTEGER, deleted_at TEXT, created_at TEXT)', {})

                //   .then((dbUserRes) => {
                //     console.log("CREATE TABLE chat_group_users" + JSON.stringify(dbUserRes));

                //     db.executeSql('CREATE TABLE IF NOT EXISTS chat_groups(id INTEGER, name TEXT, hotel_token TEXT, created_by_id INTEGER,deleted_at TEXT,created_at TEXT,updated_at TEXT, image_url TEXT)', {})
                //       .then((dbRes) => {
                //         console.log("CREATE TABLE chat_groups" + JSON.stringify(dbRes));

                //         db.executeSql("CREATE TABLE IF NOT EXISTS chat_messages(id INTEGER, sender_id INTEGER,hotel_token TEXT, message TEXT, image TEXT, target_id INTEGER, type TEXT, deleted_at TEXT, created_at TEXT, updated_at TEXT, read_status INTEGER, mentioned_user_ids TEXT, parent_id TEXT, work_order_id INTEGER, work_order_url TEXT, work_order_status TEXT, work_order_closed_by_user_id INTEGER, work_order_closed_at TEXT, work_order_location_detail TEXT, work_order_description TEXT,room_number TEXT,room_id TEXT)", {}).then((data1) => {
                //           console.log("MESSAGE TABLE CREATED: " + JSON.stringify(data1));

                //           db.executeSql('CREATE TABLE IF NOT EXISTS user_mentions (type TEXT, type_id INTEGER, user_id INTEGER,total INTEGER)', {})
                //           .then((dbRes) => {
                //             console.log("CREATE TABLE user_mentions" + JSON.stringify(dbRes));

                /* strat api call get Broadcast List */
                if (this.commonMethod.checkNetwork()) {
                  this.showLoader = true;
                  this.commonMethod.getDataWithoutLoder(getBroadcastListUrl, accessToken).subscribe(
                    data => {
                      let res = data.json();
                      this.nativeStorage.setItem('broadcast_count', res.length)
                        .then(
                          () => console.log('Stored broadcast_count!'),
                          error => console.error('Error storing broadcast_count', error)
                        );
                    },
                    err => {
                      if (updateNewVersion) {
                        this.commonMethod.hideLoader();
                      }
                      //this.commonMethod.hideLoader();
                      this.showLoader = false;
                      alertVar.present();
                    },
                    () => {
                      console.log('getData completed');
                    }
                  );

                  this.commonMethod.getDataWithoutLoder(locationsUrl, accessToken).subscribe(
                    data => {
                      let foundRepos = data.json();
                      console.log("==" + JSON.stringify(foundRepos));

                      this.locationType = foundRepos.location_types;
                      this.room = foundRepos.Room;
                      this.publicArea = foundRepos.PublicArea;
                      this.equipment = foundRepos.Equipment;

                      this.nativeStorage.setItem('wo_data', { locationType: this.locationType, room: this.room, publicArea: this.publicArea, equipment: this.equipment })
                        .then(
                          () => {
                            console.log('Stored wo_data!');
                            this.getUserPermissions(updateNewVersion);
                            //this.commonMethod.hideLoader(); 
                          },
                          error => { console.error('Error storing wo_data', error); this.navCtrl.setRoot(FeedsPage); }
                        );

                    },
                    err => {
                      this.showLoader = false;
                      alertVar.present();
                    },
                    () => {
                      console.log('getData completed');
                    }
                  );

                }
                else {
                  this.showLoader = false;
                  //this.commonMethod.hideLoader();
                  if (updateNewVersion) {
                    this.commonMethod.hideLoader();
                  }
                  this.commonMethod.showNetworkError();
                }
                /* end api call to get Broadcast List */

                //       }, (error) => {
                //         console.error("Unable to execute sql user_mentions", error);
                //       }).catch(e => console.log('Executed SQL Error= user_mentions' + JSON.stringify(e)));

                //       }, (error1) => {
                //         console.log("MESSAGE TABLE CREATE ERROR: " + JSON.stringify(error1));
                //       });

                //     }, (error) => {
                //       console.error("Unable to execute sql", error);
                //     }).catch(e => console.log('Executed SQL Error= ' + JSON.stringify(e)));

                // }, (error) => {
                //   console.error("Unable to execute sql", error);
                // }).catch(e => console.log('Executed SQL Error= ' + JSON.stringify(e))).catch(e => console.log(e));

              },
              err => {
                //this.commonMethod.hideLoader();
                if (updateNewVersion) {
                  this.commonMethod.hideLoader();
                }
                this.showLoader = false;
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
            //this.commonMethod.hideLoader();
            if (updateNewVersion) {
              this.commonMethod.hideLoader();
            }
            this.showLoader = false;
            this.commonMethod.showNetworkError();
          }

        },
        error => {
          //this.commonMethod.hideLoader();
          if (updateNewVersion) {
            this.commonMethod.hideLoader();
          }
          this.showLoader = false;
          return '';
        }
      );
      /*  get member api call end */

    }, (error) => {
      console.log("ERROR: " + JSON.stringify(error));
    });
  }

  showPassword() {
    this.showPass = !this.showPass;
    if (this.showPass) {
      this.type = "text";
    }
    else {
      this.type = "password";
    }
  }

  forgetPassword() {
    this.navCtrl.push(ForgetPasswordPage);
  }

  newAccount() {
    this.navCtrl.push(NewAccountPage);
  }

  getUserPermissions(updateNewVersion) {
    let alertVar = this.alertCtrl.create({
      title: 'Error!',
      subTitle: 'Invalid Details!',
      buttons: ['OK']
    });

    this.nativeStorage.getItem('user_auth').then(
      accessToken => {

        if (this.commonMethod.checkNetwork()) {
          this.commonMethod.getDataWithoutLoder(getUserPermissionsUrl, accessToken).subscribe(
            data => {
              let res = data.json();
              this.permissionData = res;
              console.log(JSON.stringify(res));
              this.nativeStorage.setItem('user_permissions', this.permissionData)
                .then(
                  () => {
                    console.log('Stored user_permissions!');
                    this.events.publish('update:permiossion');
                    this.nativeStorage.getItem('prev_user_id').then(
                      prevUserId => {
                        console.log("prevUserId=" + prevUserId + "  " + this.foundRepos.user.id);


                        if (this.notification == undefined || (prevUserId > 0 && prevUserId != this.foundRepos.user.id)) {
                          this.showLoader = false;
                          //this.commonMethod.hideLoader();
                          this.getMentionable()
                        }
                        else {
                          this.showLoader = false;
                          //this.commonMethod.hideLoader();

                          this.events.publish('login:Notification', this.notification);
                        }
                        if (updateNewVersion) {
                          this.commonMethod.hideLoader();
                        }
                      },
                      error => {
                        this.showLoader = false;
                        if (updateNewVersion) {
                          this.commonMethod.hideLoader();
                        }
                        //this.commonMethod.hideLoader();
                        this.navCtrl.setRoot(FeedsPage);
                      });
                  },
                  error => console.error('Error storing user_permissions', error)
                );
              //alert(this.userData); 
            },
            err => {
              this.showLoader = false;
              alertVar.present();
              console.error("Error : " + err);
            },
            () => {
              console.log('getData completed');
            }
          );
        }
        else {
          this.showLoader = false;
          if (updateNewVersion) {
            this.commonMethod.hideLoader();
          }
          this.commonMethod.showNetworkError();
        }

      },
      error => {
        return '';
      }
    );
  }


  getMentionable() {
    this.nativeStorage.getItem('user_auth').then(
      accessToken => {
        if (this.commonMethod.checkNetwork()) {
          this.commonMethod.getDataWithoutLoder(getMentionables, accessToken).subscribe(
            data => {
              let foundRepos = data.json();
              for (let i = 0; i < foundRepos.departments.length; i++) {
                foundRepos.departments[i].name = foundRepos.departments[i].name.toUpperCase()
              }

              this.nativeStorage.setItem('mentionable', foundRepos)
                .then((data) => {
                  this.navCtrl.setRoot(FeedsPage)
                }).catch((err) => { })


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
  valchange() {

    this.zone.run(() => {
      this.password = this.password;
      this.email = this.email;
    });
  }
}

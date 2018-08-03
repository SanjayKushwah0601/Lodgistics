import { Component, Injectable } from '@angular/core';
import { NavController, Platform, NavParams } from 'ionic-angular';
import { FormBuilder, Validators } from '@angular/forms';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { Observable } from 'rxjs/Observable';
import { FeedsPage } from '../feeds/feeds';
import { viewWorkOrderUrl } from '../../services/configURLs';
import { NativeStorage } from '@ionic-native/native-storage';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'page-webHome',
  templateUrl: 'webHomePage.html',
  providers: [InAppBrowser, NativeStorage]
})

export class WebHomePage {

  public id = "";
  public token = "";
  public browser: any;
  constructor(public platform: Platform, public navCtrl: NavController, private iab: InAppBrowser, public params: NavParams, public nativeStorage: NativeStorage, private sanitizer: DomSanitizer) {

    let options = {
      location: 'yes',//Or 'no' 
      hidden: 'no', //Or  'yes'
      clearcache: 'yes',
      clearsessioncache: 'yes',
      zoom: 'yes',//Android only ,shows browser zoom controls 
      hardwareback: 'yes',
      mediaPlaybackRequiresUserAction: 'no',
      shouldPauseOnSuspend: 'no', //Android only 
      closebuttoncaption: 'Close', //iOS only
      disallowoverscroll: 'no', //iOS only 
      toolbar: 'yes', //iOS only 
      enableViewportScale: 'no', //iOS only 
      allowInlineMediaPlayback: 'no',//iOS only 
      presentationstyle: 'pagesheet',//iOS only 
      fullscreen: 'yes',//Windows only    
    };

    this.id = this.params.get('id');

    this.platform.ready().then(() => {


      this.nativeStorage.getItem('user_auth').then(
        accessToken => {

          this.token = accessToken.access_token ? accessToken.access_token : '';
          let property_token = accessToken.property_token ? accessToken.property_token : '';

          //this.iab.create("http://dev.lodgistics.com", "_self", "location=no");
          //let url = viewWorkOrderUrl + "/" + this.id + "?authorization=" + this.token;
          let url = viewWorkOrderUrl + "?authorization=" + this.token + "&property_token=" + property_token;
          console.log(url);
          this.browser = this.iab.create(url, '_blank', 'location=no,closebuttoncaption=Back,toolbar=yes,enableViewportScale=yes,toolbarposition=top');
          console.log("link viewed");
          this.browser.on('exit').subscribe(
            () => {
              console.log('done');
              this.openFeedPage();
            },
            err => console.error(err));

        },
        error => {
          return '';
        }
      );





    });

  }

  openFeedPage() {
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
                this.browser.close();
              } else {
                this.navCtrl.setRoot(FeedsPage);
              }
            },
            error => {
              this.navCtrl.setRoot(FeedsPage);
            });
        }, 500);
      });
    });

    this.nativeStorage.getItem('notificatio_click').then(
      click => {
        if (click.click) {
          this.browser.close();
        } else {
          this.navCtrl.setRoot(FeedsPage);
        }
      },
      error => {
        this.navCtrl.setRoot(FeedsPage);
      });

  }

  getUrl(url) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
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
                this.browser.close();
              }
            });
        }, 2000);
      });
    });
  }

}

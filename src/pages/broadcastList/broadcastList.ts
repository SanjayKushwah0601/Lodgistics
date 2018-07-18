import { Component, NgZone } from '@angular/core';
import { NavController, AlertController, Platform, ModalController, NavParams, ViewController, Events } from 'ionic-angular';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Validator } from '../../validator';
import { srviceMethodsCall } from '../../services/serviceMethods';
import { Keyboard } from '@ionic-native/keyboard';
import { NativeStorage } from '@ionic-native/native-storage';
import { getBroadcastListUrl } from '../../services/configURLs';
import { textLength } from '../../providers/appConfig';
import { TranslationService } from '../../providers/translation.service';

@Component({
  selector: 'page-broadcastList',
  templateUrl: 'broadcastList.html',
  providers: [srviceMethodsCall, Keyboard, NativeStorage]
})

export class BroadcastListPage {

  public showSub;
  public hideSub;
  public foundRepos = [];
  public spinner = true;
  private textLengthValue: number;
  private touchtime: number = 0;

  constructor(public platform: Platform, public params: NavParams, private keyboard: Keyboard, public viewCtrl: ViewController,
    public zone: NgZone, modalCtrl: ModalController, public commonMethod: srviceMethodsCall, public events: Events,
    public alertCtrl: AlertController, public nativeStorage: NativeStorage, private translationservice: TranslationService) {

    this.keyboard.disableScroll(true);
    this.textLengthValue = textLength;


    this.platform.ready().then(() => {

      /* strat api call get WO locations */
      let alertVar = this.alertCtrl.create({
        title: 'Error!',
        subTitle: 'Invalid Details!',
        buttons: ['OK']
      });

      this.nativeStorage.getItem('user_auth').then(
        accessToken => {
          if (this.commonMethod.checkNetwork()) {
            this.spinner = true;
            this.commonMethod.getDataWithoutLoder(getBroadcastListUrl, accessToken).subscribe(
              data => {
                this.foundRepos = data.json();
                console.log("==" + JSON.stringify(this.foundRepos));
                this.spinner = false;

                this.nativeStorage.setItem('broadcast_count', this.foundRepos.length)
                  .then(
                    () => console.log('Stored broadcast_count!'),
                    error => console.error('Error storing broadcast_count', error)
                  );

              },
              err => {
                this.spinner = false;
                alertVar.present();
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
      /* end api call to get WO location */
    });

    this.showSub = this.keyboard.onKeyboardShow().subscribe(data => {
      //this.keyboard.disableScroll(true);
      console.log('keyboard is shown');
      console.log("screen height=" + data.keyboardHeight);
    });

    this.hideSub = this.keyboard.onKeyboardHide().subscribe(data => {
      console.log('keyboard is hide');
      this.events.publish('hide:keyboard');
    });

  }

  dismiss() {
    this.keyboard.close();
    this.viewCtrl.dismiss('');
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
                this.viewCtrl.dismiss();
              }
            });
        }, 2000);
      });
    });
  }


  updateHtml(description, index) {
    if (description != "" && description.length > this.textLengthValue) {
      description = description.substring(0, this.textLengthValue);
      description = description + "...";
    }
    this.foundRepos[index].showMore = true;
    return description;
  }

  updateHtml1(description, index) {
    this.foundRepos[index].showMore = false;
    return description;
  }

  showMore(index) {
    this.foundRepos[index].showMore = false;
  }

  showLess(index) {
    this.foundRepos[index].showMore = true;
  }

  translate(title, sourceText, langCode, i) {
    sourceText = sourceText.replace(/\n/g, "<br/>");

    let tempStr = "";

    console.log("sourceText=" + sourceText);

    if (this.touchtime == 0) {
      this.touchtime = new Date().getTime();
    } else {
      if (((new Date().getTime()) - this.touchtime) < 400) {
        this.touchtime = 0;
        this.translateTitle(title, langCode, i);

        if (this.foundRepos[i].temp_data != undefined && this.foundRepos[i].temp_data != "") {
          this.foundRepos[i].body = this.foundRepos[i].temp_data;
          this.foundRepos[i].temp_data = "";
        }
        else {
          this.commonMethod.showLoader();
          this.translationservice.translateText(sourceText, langCode).subscribe(data => {
            console.log('4')

            if (data.detectedSourceLanguage == "en") {
              this.foundRepos[i].temp_data = this.foundRepos[i].body;
              this.foundRepos[i].body = tempStr + data.translatedText;
              this.commonMethod.hideLoader();
            }
            else {
              this.translationservice.translateText(sourceText, 'en').subscribe(data => {
                console.log('3')

                this.foundRepos[i].temp_data = this.foundRepos[i].body;
                this.foundRepos[i].body = tempStr + data.translatedText;
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

    if (this.foundRepos[i].temp_title_data != undefined && this.foundRepos[i].temp_title_data != "") {
      this.foundRepos[i].title = this.foundRepos[i].temp_title_data;
      this.foundRepos[i].temp_title_data = "";
    }
    else {
      this.translationservice.translateText(sourceText, langCode).subscribe(data => {
        console.log('2')

        if (data.detectedSourceLanguage == "en") {
          this.foundRepos[i].temp_title_data = this.foundRepos[i].title;
          this.foundRepos[i].title = tempStr + data.translatedText;
        }
        else {
          this.translationservice.translateText(sourceText, 'en').subscribe(data => {
            console.log('1')
            this.foundRepos[i].temp_title_data = this.foundRepos[i].title;
            this.foundRepos[i].title = tempStr + data.translatedText;
          }, error => {
            let alert = this.alertCtrl.create({
              subTitle: 'Error:' + '<br>' + error,
              buttons: ['OK']
            });
            alert.present();
          });
        }

      }, error => {
        let alert = this.alertCtrl.create({
          subTitle: 'Error:' + '<br>' + error,
          buttons: ['OK']
        });
        alert.present();
      });
    }
  }
}

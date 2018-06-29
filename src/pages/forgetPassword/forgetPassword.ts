import { Component } from '@angular/core';
import { NavController, AlertController, Platform } from 'ionic-angular';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Validator } from '../../validator';
import { srviceMethodsCall } from '../../services/serviceMethods';
import { forgetPasswordUrl } from '../../services/configURLs';
import { LoginPage } from '../login/login';

@Component({
  selector: 'page-forgetPassword',
  templateUrl: 'forgetPassword.html',
  providers: [srviceMethodsCall]
})

export class ForgetPasswordPage {
  userForm: any;
  email: any;
  public foundRepos;
  public showLoader=false;

  constructor(public navCtrl: NavController, public alertCtrl: AlertController, formBuilder: FormBuilder, public commonMethod: srviceMethodsCall) {
    this.userForm = formBuilder.group({
      email: Validator.emailValidator
    });
  }

  forgetPassword() {

    let alertVar = this.alertCtrl.create({
      subTitle: 'If we find a record for your email in our accounts, an email will be sent to you with instructions for reseting your password.',
      buttons: [
        {
          text: 'OK',
          role: 'signIn',
          handler: () => {
            console.log('signIn clicked');
            this.navCtrl.setRoot(LoginPage);
          }
        }
      ],
      cssClass: 'forget_alert'
    });

    let objData = { 'user': { 'email': this.userForm.value["email"] } };

    this.showLoader=true;
    this.commonMethod.postDataWithoutLoder(forgetPasswordUrl, objData, '').subscribe(
      data => {
        this.foundRepos = data.json();
        alertVar.present();
        this.showLoader=false;
      },
      err => {
        //this.commonMethod.hideLoader();
        this.showLoader=false;
        console.log("Error 1: " + JSON.stringify(err.json()));
        let res = err.json();
        if (typeof (res.error) !== undefined) {
          let alertVarErr = this.alertCtrl.create({
            title: 'Error!',
            subTitle: res.error ? res.error : 'Invalid Details!',
            buttons: ['OK']
          });
          alertVarErr.present();
        }
        else {
          let alertVarErr = this.alertCtrl.create({
            title: 'Error!',
            subTitle: 'Invalid Details!',
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


}

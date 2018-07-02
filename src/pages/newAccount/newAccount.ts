import { Component, NgZone } from '@angular/core';
import { NavController, Events, AlertController, ViewController, NavParams } from 'ionic-angular';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { CreateHotelPage } from '../createHotel/createHotel';
import { srviceMethodsCall } from '../../services/serviceMethods';
import { createHotelUrl } from '../../services/configURLs';
import { Validator } from '../../validator';

import { LoginPage } from '../login/login';

@Component({
    selector: 'page-newAccount',
    templateUrl: 'newAccount.html',
    providers: [srviceMethodsCall]
})
export class NewAccountPage {



    public type = "password";
    public showPass = false;
    public formData: any;
    public hotelInfo: any;
    public accountForm: FormGroup;

    userForm: any;
    message: any;
    constructor(public navCtrl: NavController, private _FB: FormBuilder, public zone: NgZone, public commonMethod: srviceMethodsCall, public alertCtrl: AlertController, private viewCtrl: ViewController, public navParams: NavParams) {

        this.formData = {
            "name": "",
            "street_address": "",
            "state": "",
            "zip_code": "",
            "city": "",
            "user_name": "",
            "accepted": false,
            "hotel_selected": false,
            "user": {
                "name": "",
                "email": "",
                "password": "",
                "phone_number": "",
                "hotel_code": ""
            }
        };

        this.accountForm = _FB.group({
            name: Validator.hotelNameValidator,
            email: Validator.hotelEmailValidator,
            password: Validator.hotelPasswordValidator,
            phone_number: "",
            hotel_code: "",
            accepted: "",
            hotel_selected: ""
        });

        if (this.navParams.get('hotelInfo')) {

            // first we find the index of the current view controller:
            //const index = this.viewCtrl.index;
            // then we remove it from the navigation stack
            //this.navCtrl.remove(index);

            this.zone.run(() => {
                this.formData = this.navParams.get('hotelInfo');
                this.formData.hotel_selected = this.formData.name.trim() != '' ? true : false;
                this.accountForm.value["name"] = this.formData.user.name;
                this.accountForm.value["email"] = this.formData.user.email;
                this.accountForm.value["password"] = this.formData.user.password;
                this.accountForm.value["phone_number"] = this.formData.user.phone_number;
                this.accountForm.value["hotel_code"] = this.formData.user.hotel_code;
                this.accountForm.value["hotel_selected"] = this.formData.hotel_selected;
                console.log(this.formData);
            });
        }
        this.formData.user.hotel_code = this.navParams.get('hotelCode') ? this.navParams.get('hotelCode') : '';
        this.zone.run(() => {
            console.log(this.formData);
            this.accountForm.value["hotel_code"] = this.formData.user.hotel_code;
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

    signin() {
        this.navCtrl.setRoot(LoginPage);
    }

    createHotel() {
        this.zone.run(() => {
            console.log(this.formData);
            this.navCtrl.push(CreateHotelPage, { formData: this.formData });
        });
    }


    create() {
        //this.allowEdit=false;
        let alertVar = this.alertCtrl.create({
            title: 'Error!',
            subTitle: 'Invalid Details!',
            buttons: ['OK']
        });

        if (this.commonMethod.checkNetwork()) {
            let objData = {
                'property': {
                    'name': this.formData.name.trim(),
                    'street_address': this.formData.street_address.trim(),
                    'state': this.formData.state.trim(),
                    'city': this.formData.city.trim(),
                    'zip_code': this.formData.zip_code
                },
                'user': {
                    'name': this.formData.user.name.trim(),
                    'email': this.formData.user.email.trim()
                    //'password': this.formData.user.password.trim(), 
                    //'phone_number': this.formData.user.phone_number.trim(), 
                    //'hotel_code': this.formData.user.hotel_code 
                }
            };

            this.commonMethod.postData(createHotelUrl, objData, '').subscribe(
                data => {
                    let foundRepos = data.json();
                    console.error(foundRepos);
                    this.commonMethod.hideLoader();

                    let alertVarErr = this.alertCtrl.create({
                        //title: 'Error!',
                        subTitle: foundRepos.message ? foundRepos.message : 'Done',
                        buttons: ['OK']
                    });
                    alertVarErr.present();
                    this.navCtrl.setRoot(LoginPage);

                },
                err => {
                    this.commonMethod.hideLoader();
                    console.log("Error 1: " + JSON.stringify(err.json()));
                    let res = err.json();
                    if (typeof (res.message) !== undefined) {
                        let alertVarErr = this.alertCtrl.create({
                            title: 'Error!',
                            subTitle: res.message ? res.message : 'Invalid Details!',
                            buttons: ['OK']
                        });
                        alertVarErr.present();
                    }
                    else if (typeof (res.errors.message) !== undefined) {
                        let alertVarErr = this.alertCtrl.create({
                            title: 'Error!',
                            subTitle: res.errors.message ? res.errors.message : 'Invalid Details!',
                            buttons: ['OK']
                        });
                        alertVarErr.present();
                    }
                    else if (typeof (res.error) !== undefined) {
                        let alertVarErr = this.alertCtrl.create({
                            title: 'Error!',
                            subTitle: res.error ? res.error : 'Invalid Details!',
                            buttons: ['OK']
                        });
                        alertVarErr.present();
                    }
                    else {
                        alertVar.present();
                    }
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
    }




}

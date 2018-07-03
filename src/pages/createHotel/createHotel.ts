import { Component, NgZone } from '@angular/core';
import { NavController, Events, AlertController, ViewController, NavParams } from 'ionic-angular';
import { FormBuilder, Validators } from '@angular/forms';
import { LoginPage } from '../login/login';
import { HTTP } from '@ionic-native/http';
import { srviceMethodsCall } from '../../services/serviceMethods';
import { createHotelUrl } from '../../services/configURLs';
import { NewAccountPage } from '../newAccount/newAccount';

@Component({
    selector: 'page-createHotel',
    templateUrl: 'createHotel.html',
    providers: [HTTP, srviceMethodsCall]
})

export class CreateHotelPage {

    public formData: any;
    public hotelsData = {};
    public showList = false;
    public hotelAddress = "";
    public hotelInfo: any;
    public prevInfo: any;

    constructor(public navCtrl: NavController, private http: HTTP, public zone: NgZone, public commonMethod: srviceMethodsCall, public alertCtrl: AlertController, private viewCtrl: ViewController, public navParams: NavParams) {

        this.formData = {
            name: '',
            address: '',
            city: '',
            state: '',
            zip_code: ''
        };

        this.prevInfo = {
            "name": "",
            "street_address": "",
            "state": "",
            "zip_code": "",
            "city": "",
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

        if (this.navParams.get('formData')) {
            this.prevInfo = this.navParams.get('formData');

            this.formData.name = this.prevInfo.name
            this.formData.address = this.prevInfo.street_address
            this.formData.city = this.prevInfo.city
            this.formData.state = this.prevInfo.state
            this.formData.zip_code = this.prevInfo.zip_code
        }



    }


    signin() {
        this.navCtrl.setRoot(LoginPage);
    }

    getHotels() {

        setTimeout(() => {

            this.formData.name = this.formData.name.replace(/[`~!@#$%^&*()_|+\-=÷¿?;:'",.<>\{\}\[\]\\\/]/gi, '');
            if (this.formData.name.trim() != "") {
                let url = "https://maps.googleapis.com/maps/api/place/textsearch/json?query=" + encodeURI(this.formData.name.trim()) + "+lodging+in+US&key=AIzaSyC-G-qKL13oH9EG6-IqJz-FYCQ6f9r9svs";
                console.log("url =" + url);
                this.http.get(url, {}, {})
                    .then(data => {
                        console.log(data.status);
                        //console.log(data.data); // data received by server
                        console.log(data.headers);
                        console.log(data.data);
                        if (this.formData.name != '') {
                            let temp = JSON.parse(data.data);
                            this.hotelsData = temp.results;
                            this.showList = true;
                        }
                    })
                    .catch(error => {
                        console.error(error.status);
                        console.error(error.error); // error message as string
                        console.error(error.headers);
                    });
            }
            else {
                this.hotelsData = {};
                this.showList = false;
            }
        }, 300);
    }

    selectHotel(row) {
        let latitude = row.geometry.location.lat;
        let longitude = row.geometry.location.lng;
        var url = "https://maps.googleapis.com/maps/api/geocode/json?latlng=" + latitude + "," + longitude + "&sensor=true&key=AIzaSyC-G-qKL13oH9EG6-IqJz-FYCQ6f9r9svs";
        console.log(url);
        this.http.get(url, {}, {})
            .then(data => {
                console.log(data.status);
                //console.log(data.data); // data received by server
                console.log(data.headers);
                console.log(data.data);
                let temp = JSON.parse(data.data);
                if (temp.results[0]) {
                    var locationDetails = temp.results[0].formatted_address;
                    var value = locationDetails.split(",");
                    let count = value.length;
                    let country = value[count - 1];
                    let state = value[count - 2];
                    let city = value[count - 3];
                    let pin = state.split(" ");
                    let pinCode = pin[pin.length - 1];
                    state = state.replace(pinCode, ' ');
                    console.log(country + " | " + state + " | " + city + "  | " + pinCode);
                    this.formData.city = city;
                    this.formData.state = state;
                    this.formData.zip_code = pinCode;
                }
            })
            .catch(error => {
                console.error(error.status);
                console.error(error.error); // error message as string
                console.error(error.headers);
            });
        this.formData.name = row.name;
        this.formData.address = row.formatted_address;
        this.showList = false;
    }


    create() {

        let objData = { 'name': this.formData.name.trim(), 'street_address': this.formData.address.trim(), 'state': this.formData.state.trim(), 'city': this.formData.city.trim(), 'zip_code': this.formData.zip_code };

        this.prevInfo.name = this.formData.name.trim();
        this.prevInfo.street_address = this.formData.address.trim();
        this.prevInfo.state = this.formData.state.trim();
        this.prevInfo.city = this.formData.city.trim();
        this.prevInfo.zip_code = this.formData.zip_code.trim();

        console.log(this.prevInfo);

        this.navCtrl.push(NewAccountPage, { hotelInfo: this.prevInfo }).then(() => {
            // first we find the index of the current view controller:
            const index = this.viewCtrl.index;
            // then we remove it from the navigation stack
            this.navCtrl.remove(index);
            //let index1 = this.viewCtrl.index;
            //this.navCtrl.remove(index1);

        });


        // //this.allowEdit=false;
        // let alertVar = this.alertCtrl.create({
        //     title: 'Error!',
        //     subTitle: 'Invalid Details!',
        //     buttons: ['OK']
        // });

        // if (this.commonMethod.checkNetwork()) {
        //     let objData = { 'property': { 'name': this.formData.name.trim(), 'street_address': this.formData.address.trim(), 'state': this.formData.state.trim(), 'city': this.formData.city.trim(), 'zip_code': this.formData.zip_code } };
        //     this.commonMethod.postData(createHotelUrl, objData, '').subscribe(
        //         data => {
        //             let foundRepos = data.json();
        //             console.error(foundRepos);
        //             this.commonMethod.hideLoader();
        //             //this.navCtrl.push(this.navCtrl.getActive().component);
        //             this.navCtrl.push(NewAccountPage).then(() => {
        //             // first we find the index of the current view controller:
        //             const index = this.viewCtrl.index;
        //             // then we remove it from the navigation stack
        //             this.navCtrl.remove(index);
        //             });
        //         },
        //         err => {
        //             this.commonMethod.hideLoader();
        //             console.log("Error 1: " + JSON.stringify(err.json()));
        //             let res = err.json();
        //             if (typeof (res.errors.message) !== undefined) {
        //               let alertVarErr = this.alertCtrl.create({
        //                 title: 'Error!',
        //                 subTitle: res.errors.message ? res.errors.message : 'Invalid Details!',
        //                 buttons: ['OK']
        //               });
        //               alertVarErr.present();
        //             }
        //             else {
        //               alertVar.present();
        //             }
        //             console.error("Error : " + err);
        //         },
        //         () => {
        //             this.commonMethod.hideLoader();
        //             console.log('getData completed');
        //         }
        //     );
        // }
        // else {
        //     this.commonMethod.showNetworkError();
        // }
    }

}

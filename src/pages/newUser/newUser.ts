import { Component, NgZone } from '@angular/core';
import { NavController, Events, AlertController, ViewController, NavParams ,ActionSheetController} from 'ionic-angular';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Transfer, FileUploadOptions, TransferObject } from '@ionic-native/transfer';
import { File } from '@ionic-native/file';
import { Camera, CameraOptions } from '@ionic-native/camera';
import { NativeStorage } from '@ionic-native/native-storage';
import { Keyboard } from '@ionic-native/keyboard';
import { Http, Headers, RequestOptions } from '@angular/http';
import { getAwsSignedUrl } from '../../services/configURLs';

import { CreateHotelPage } from '../createHotel/createHotel';
import { srviceMethodsCall } from '../../services/serviceMethods';
import { requestConfirmsUrl,createUserUrl } from '../../services/configURLs';
import { Validator } from '../../validator';

import { LoginPage } from '../login/login';

@Component({
    selector: 'page-newUser',
    templateUrl: 'newUser.html',
    providers: [srviceMethodsCall,Camera, Transfer, File,NativeStorage, Keyboard]
})
export class NewUserPage {

    public type = "password";
    public showPass = false;
    public formData: any;
    public hotelInfo: any;
    public accountForm: FormGroup;
    public actionSheet: any;
    public allowEdit = true;
    public base64Image = "";
    public userId = "";
    public confirmationToken="";
    public ID = "";
    public avatar_url="";
    public propertyToken="";
    public hotelName="Hotel";
    // public name="";
    // public title="";
    // public phone_number="";

    userForm: any;
    message: any;
    constructor(public navCtrl: NavController, private _FB: FormBuilder,public zone: NgZone, public commonMethod: srviceMethodsCall, public alertCtrl: AlertController,private viewCtrl: ViewController,public navParams: NavParams,private camera: Camera, private transfer: Transfer,public nativeStorage: NativeStorage, private http: Http,public actionSheetCtrl: ActionSheetController,public events: Events) {
        
        this.formData = {
            "name": "",
            "title": "",
            "phone_number": "",
            "password": "",
            "confirm_password": "",
            "accepted":true
          };

        this.accountForm = _FB.group({
        name: Validator.hotelNameValidator,
        title:Validator.userTitleValidator,
        password: Validator.hotelPasswordValidator,
        confirm_password: Validator.hotelPasswordValidator,
        phone_number:"",
        accepted:""

        });

        // if (this.navParams.get('hotelInfo')) {

        //     // first we find the index of the current view controller:
        //     //const index = this.viewCtrl.index;
        //     // then we remove it from the navigation stack
        //     //this.navCtrl.remove(index);
            
        //     this.zone.run(() => {
        //     this.formData = this.navParams.get('hotelInfo');    
        //     this.formData.hotel_selected=this.formData.name.trim()!=''?true:false;
        //     this.accountForm.value["name"]=this.formData.user.name;
        //     this.accountForm.value["title"]=this.formData.user.title;
        //     this.accountForm.value["email"]=this.formData.user.email;
        //     this.accountForm.value["password"]=this.formData.user.password;
        //     this.accountForm.value["confirm_password"]=this.formData.user.confirm_password;
        //     this.accountForm.value["phone_number"]=this.formData.user.phone_number;
        //     this.accountForm.value["hotel_code"]=this.formData.user.hotel_code;
        //     this.accountForm.value["hotel_selected"]=this.formData.hotel_selected;
        //     console.log(this.formData);
        //     });
        // }
        // this.formData.user.hotel_code = this.navParams.get('hotelCode')?this.navParams.get('hotelCode'):'';
        // this.zone.run(() => {
        //     console.log(this.formData);
        //     this.accountForm.value["hotel_code"]=this.formData.user.hotel_code;
        // });
        this.confirmationToken=this.navParams.get('confirmationToken')?this.navParams.get('confirmationToken'):'';
        this.propertyToken=this.navParams.get('propertyToken')?this.navParams.get('propertyToken'):'';
       this.getConfirmation();
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

    // createHotel() {
    //     this.zone.run(() => {
    //         console.log(this.formData);
    //     this.navCtrl.push(CreateHotelPage,{formData:this.formData});
    //     });
    // }


    create() {
        //this.allowEdit=false;
        let alertVar = this.alertCtrl.create({
            title: 'Error!',
            subTitle: 'Invalid Details!',
            buttons: ['OK']
        });
        //alert("data"+JSON.stringify(this.formData));

        if (this.commonMethod.checkNetwork()) {
            let objData = { 
                'user': { 
                    'name': this.formData.name.trim(), 
                    'title': this.formData.title.trim(),
                    'password': this.formData.password.trim(), 
                    'password_confirmation': this.formData.confirm_password.trim(), 
                    'phone_number': this.formData.phone_number.trim(), 
                    'avatar_img_url':  this.avatar_url
                }  
            };
            console.log(JSON.stringify(objData));

            let accessToken={ access_token:'',property_token:this.propertyToken };

            this.commonMethod.putData(createUserUrl+this.ID+"/confirm", objData, accessToken).subscribe(
                data => {
                    let foundRepos = data.json();
                    console.error(foundRepos);
                    this.commonMethod.hideLoader();

                      let alertVarErr = this.alertCtrl.create({
                        //title: 'Error!',
                        subTitle: foundRepos.message ? foundRepos.message : 'Your account has been created successfully.',
                        buttons: ['OK']
                      });
                      alertVarErr.present();
                      //this.navCtrl.setRoot(LoginPage);
                      this.events.publish('logoutUserEvent');

                },
                err => {
                    this.commonMethod.hideLoader();
                    console.log("Error 1: " + JSON.stringify(err.json()));
                    let res = err.json();
                    // if (typeof (res.message) !== undefined) {
                    //     let alertVarErr = this.alertCtrl.create({
                    //       title: 'Error!',
                    //       subTitle: res.message ? res.message : 'Invalid Details!',
                    //       buttons: ['OK']
                    //     });
                    //     alertVarErr.present();
                    //   }
                    //   else 
                      if (typeof (res.errors.password) !== undefined) {
                        let alertVarErr = this.alertCtrl.create({
                          title: 'Error!',
                          subTitle: res.errors.password[0] ? res.errors.password[0] : 'Invalid Details!',
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
                      console.log("else part error");
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



    showGalleryPrompt() {
        this.actionSheet = this.actionSheetCtrl.create({
          title: '',
          buttons: [
            {
              text: 'Gallery',
              icon: 'ios-image',
              handler: () => {
                console.log('Gallery clicked');
                this.accessGallery();
              }
            }, {
              text: 'Camera',
              icon: 'ios-camera',
              handler: () => {
                console.log('Camera clicked');
                this.openCamera();
              }
            }, {
              text: 'Cancel',
              role: 'cancel',
              handler: () => {
                console.log('Cancel clicked');
              }
            }
          ]
        });
        this.actionSheet.present();
      }
    
      accessGallery() {
        this.camera.getPicture({
          quality: 100
          , destinationType: this.camera.DestinationType.DATA_URL
          , sourceType: this.camera.PictureSourceType.PHOTOLIBRARY
          , encodingType: this.camera.EncodingType.JPEG
          , mediaType: this.camera.MediaType.PICTURE
          , targetWidth: 800 //what widht you want after capaturing
          , targetHeight: 800
        }).then((imageData) => {
          //this.base64Image = imageData;
          this.uploadImageOnAws('data:image/jpeg;base64,' + imageData);
        }, (err) => {
          console.log(err);
        });
      }
    
      openCamera() {
        const options: CameraOptions = {
          quality: 100
          , destinationType: this.camera.DestinationType.DATA_URL
          , sourceType: this.camera.PictureSourceType.CAMERA
          , encodingType: this.camera.EncodingType.JPEG
          , mediaType: this.camera.MediaType.PICTURE
          , targetWidth: 800 //what widht you want after capaturing
          , targetHeight: 800
        };
    
        this.camera.getPicture(options).then((imageData) => {
          // imageData is either a base64 encoded string or a file URI
          // If it's base64:
          //this.base64Image = imageData;
          this.uploadImageOnAws('data:image/jpeg;base64,' + imageData);
        }, (err) => {
          // Handle error
        });
    
      }
    
      uploadImageOnAws(imageData) {
        let commonMethod = this.commonMethod;
        let transfer = this.transfer;
        let time = new Date().getTime();
        var imageName = this.ID + "_" + time + "_" + imageData.substr(imageData.lastIndexOf('/') + 1);
    
        let thisObj = this;
    
    
        let alertVar = this.alertCtrl.create({
          title: 'Error!',
          subTitle: 'Invalid Details!',
          buttons: ['OK']
        });
    
        let queryStr = "?objectName=" + imageName + "&contentType=image/jpeg&uploadType=photo";
        // this.nativeStorage.getItem('user_auth').then(
        //   accessToken => {
    
            if (this.commonMethod.checkNetwork()) {
    
              commonMethod.showLoader();
              this.commonMethod.getDataWithoutLoder(getAwsSignedUrl + queryStr, '').subscribe(
                data => {
                  //this.foundRepos = data.json();
                  let foundRepos = data.json();
                  console.log(foundRepos);
                  let url = foundRepos.signedUrl;
                  let s3FileUrl = foundRepos.s3FileUrl;

    
                  const fileTransfer: TransferObject = transfer.create();
                  let options: FileUploadOptions = {
                    fileKey: 'file',
                    fileName: imageName,
                    mimeType: "image/jpeg",
                    httpMethod: 'PUT',
                    chunkedMode: false,
                    headers: { 'Content-Type': 'image/jpeg' }
                  };
                  var params = {
                    key: "Connect-GroupChat-Images/" + imageName,
                    "acl": "public-read",
                    "region": 'us-east-2'
                  };
                  options.params = params;
                  console.log(JSON.stringify(options));
                  fileTransfer.upload(imageData, url, options).then((data) => {
                    // success
                    console.log("tt1" + JSON.stringify(data));
                    console.log(s3FileUrl);
                    this.base64Image = s3FileUrl;
                    this.avatar_url=s3FileUrl;
                    this.allowEdit = true;
                    commonMethod.hideLoader();
                    /*  code for work order */
    
                  }, (err) => {
                    // error
                    console.log("tt=" + JSON.stringify(err));
                    commonMethod.hideLoader();
                  });
    
    
                },
                err => {
                  commonMethod.hideLoader();
                  alertVar.present();
                  console.error("Error : " + err);
                },
                () => {
                  console.log('getData completed');
                }
              );
    
            }
            else {
              commonMethod.hideLoader();
              this.commonMethod.showNetworkError();
            }
    
        //   },
        //   error => {
        //     return '';
        //   }
        // );
    
    
      }

      getConfirmation(){
        if (this.commonMethod.checkNetwork()) {
            let alertVar = this.alertCtrl.create({
                title: 'Error!',
                subTitle: 'Invalid Details!',
                buttons: ['OK']
            });
            let accessToken={ access_token:'',property_token:this.propertyToken };
            this.commonMethod.getData(requestConfirmsUrl + "?confirmation_token=" + this.confirmationToken, accessToken).subscribe(
            
              data => {
                let userData = data.json();
                console.log(userData);
                this.ID=userData.id;
                this.avatar_url=userData.avatar_img_url;
                this.formData.name=userData.name;
                this.formData.phone_number=userData.phone_number;
                this.accountForm.value["name"]=this.formData.name;
                this.accountForm.value["phone_number"]= this.formData.phone_number;
                this.hotelName=userData.hotel_name;
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
    }

}

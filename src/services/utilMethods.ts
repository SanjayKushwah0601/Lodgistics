import { Component } from '@angular/core';
import { LoadingController, NavController, NavParams, Platform, AlertController } from 'ionic-angular';
import { Network } from '@ionic-native/network';
import 'rxjs/Rx';

@Component({
    providers: [Network]
})

// declare var navigator: any;
// declare var Connection: any;
// @Injectable()
export class UtilMethods {

    public loading;

    constructor(public platform: Platform, public loadingCtrl: LoadingController, private network: Network, public alertCtrl: AlertController) {

    }

    nlToBr(str) {
        return str.replace(/\n/g, "<br />");
    }


}
import { Component } from '@angular/core';
import { LoadingController, NavController, NavParams, Platform, AlertController } from 'ionic-angular';
import { Network } from '@ionic-native/network';
import { NativeStorage } from '@ionic-native/native-storage';
import 'rxjs/Rx';

@Component({
    providers: [Network, NativeStorage]
})

// declare var navigator: any;
// declare var Connection: any;
// @Injectable()
export class UtilMethods {

    public loading;

    constructor(public platform: Platform, public loadingCtrl: LoadingController, private network: Network, public alertCtrl: AlertController, public nativeStorage: NativeStorage) {

    }

    nlToBr(str) {
        return str.replace(/\n/g, "<br />");
    }

    /**
   * Function to clean local feed data. 
   * $totalDays is limit of days to store in local storage.
   */
    updateFeedData(totalDays) {
        this.nativeStorage.getItem('feedData').then(
            feedData => {
                console.log("feedData==" + JSON.stringify(feedData));
                let tempFeedData = feedData.data;
                let lastDate = new Date(feedData.lastDate);
                let tempApiDate = new Date();
                tempApiDate.setMinutes(tempApiDate.getMinutes() - 5);
                let updateAfter = tempApiDate.toString();
                let lastFeedDate = feedData.lastFeedDate;

                if (tempFeedData.length > totalDays) {
                    let tempFeedDataToStore = [];
                    for (let i = 0; i < totalDays; i++) {
                        tempFeedDataToStore.push(tempFeedData[i]);
                        lastDate = tempFeedData[i].date;

                        let d = new Date(tempFeedData[i].date);
                        let dd = ("0" + d.getDate()).slice(-2);
                        let mm = ("0" + ((d.getMonth()) + 1)).slice(-2); //January is 0!
                        let yyyy = d.getFullYear();
                        lastFeedDate = yyyy + '-' + mm + '-' + dd;
                    }

                    this.nativeStorage.setItem('feedData', { data: tempFeedDataToStore, lastDate: lastDate, updateAfter: updateAfter, lastFeedDate: lastFeedDate }).then(
                        () => console.log('feedData Stored updated!'),
                        error => console.error('Error storing feedData', error)
                    );
                }

            },
            error => {
            }
        );
    }


}
import { Component } from '@angular/core';
import { LoadingController, NavController, NavParams, Platform, AlertController } from 'ionic-angular';
import { Http, Headers, RequestOptions } from '@angular/http';
import { Network } from '@ionic-native/network';
import 'rxjs/Rx';
import { MyMentionPage } from '../pages/myMention/myMention';
import { networkCheckError } from '../providers/appConfig';
import { NativeStorage } from '@ionic-native/native-storage';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';

@Component({
    providers: [Network, NativeStorage, SQLite]
})

// declare var navigator: any;
// declare var Connection: any;
// @Injectable()
export class srviceMethodsCall {

    public loading;

    constructor(private http: Http, public platform: Platform, public loadingCtrl: LoadingController, private network: Network, public alertCtrl: AlertController, public nativeStorage: NativeStorage, private sqlite: SQLite) {

    }

    getData(url, accessToken) {

        let headers = new Headers({
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'AUTHORIZATION': accessToken.access_token ? accessToken.access_token : '',
            'PROPERTY-TOKEN': accessToken.property_token ? accessToken.property_token : ''
        });
        let options = new RequestOptions({
            headers: headers
        });

        this.showLoader();

        let repos = this.http.get(url, options);
        return repos;
    }

    postDataWithoutLoder(url, params, accessToken) {
        let headers = new Headers({
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'AUTHORIZATION': accessToken.access_token ? accessToken.access_token : '',
            'PROPERTY-TOKEN': accessToken.property_token ? accessToken.property_token : ''
        });
        let options = new RequestOptions({
            headers: headers
        });

        let repos = this.http.post(url, params, options);
        return repos;
    }

    postData(url, params, accessToken) {
        //         alert(this.checkInternet()+" dd");
        // if(this.checkInternet()){
        this.showLoader();
        let headers = new Headers({
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'AUTHORIZATION': accessToken.access_token ? accessToken.access_token : '',
            'PROPERTY-TOKEN': accessToken.property_token ? accessToken.property_token : ''
        });
        let options = new RequestOptions({
            headers: headers
        });

        let repos = this.http.post(url, params, options);
        return repos;
        // }
    }

    putData(url, params, accessToken) {

        this.showLoader();
        let headers = new Headers({
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'AUTHORIZATION': accessToken.access_token ? accessToken.access_token : '',
            'PROPERTY-TOKEN': accessToken.property_token ? accessToken.property_token : ''
        });
        let options = new RequestOptions({
            headers: headers
        });

        let repos = this.http.put(url, params, options);
        return repos;
    }

    putDataWithoutLoder(url, params, accessToken) {

        let headers = new Headers({
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'AUTHORIZATION': accessToken.access_token ? accessToken.access_token : '',
            'PROPERTY-TOKEN': accessToken.property_token ? accessToken.property_token : ''
        });
        let options = new RequestOptions({
            headers: headers
        });

        let repos = this.http.put(url, params, options);
        return repos;
    }

    getDataWithoutLoder(url, accessToken) {
        let headers = new Headers({
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'AUTHORIZATION': accessToken.access_token ? accessToken.access_token : '',
            'PROPERTY-TOKEN': accessToken.property_token ? accessToken.property_token : ''
        });
        let options = new RequestOptions({
            headers: headers
        });

        let repos = this.http.get(url, options);
        return repos;
    }

    showLoader() {
        this.loading = this.loadingCtrl.create({
            content: 'Please wait...'
        });
        // Show the loader
        this.loading.present();
    }

    hideLoader() {
        // hide the loader
        this.loading.dismiss();
    }
    /*
checkInternet(){
    this.platform.ready().then(() => {
      var networkState = navigator.connection.type;
      var states = {};
      states[Connection.UNKNOWN] = 'Unknown connection';
      states[Connection.ETHERNET] = 'Ethernet connection';
      states[Connection.WIFI] = 'WiFi connection';
      states[Connection.CELL_2G] = 'Cell 2G connection';
      states[Connection.CELL_3G] = 'Cell 3G connection';
      states[Connection.CELL_4G] = 'Cell 4G connection';
      states[Connection.CELL] = 'Cell generic connection';
      states[Connection.NONE] = 'No network connection';
      
      alert("1-"+navigator.connection.type);
      alert("2-"+Connection.NONE);

      if (networkState != Connection.NONE) {
          return false;
      }else{
          return true;
      }
    });
  }
  */

    manageNotifications(notification, accessToken) {
        //alert("=="+notification.message);
        let pageName = "";
        if (accessToken.access_token != undefined && accessToken.access_token != '') {
            pageName = "mention";
        }
        else {
            pageName = "login";
        }
        return pageName;
    }

    getMentionString(allChatMentions, members) {
        let mentionStr = "";
        if (allChatMentions.length > 0 && parseInt(allChatMentions[0]) > 0) {
            mentionStr = "<span class='mention_style'>";
            for (let k = 0; k < allChatMentions.length; k++) {
                for (let l = 0; l < members.length; l++) {
                    if (members[l].id == allChatMentions[k]) {
                        mentionStr += "<span style='color:#BDBDBD;font-size:13px;'>@</span>" + members[l].name + " ";
                    }
                }
            }
            mentionStr += "</span>";
        }
        return mentionStr;
    }

    checkNetwork() {
        if (this.network.type != "none") {
            return true;
        }
        else {
            return false;
        }
    }

    showNetworkError() {
        let alertVar = this.alertCtrl.create({
            title: 'Error!',
            subTitle: networkCheckError,
            buttons: ['OK']
        });
        alertVar.present();
    }

    replaceURLWithHTMLLinks(text) {

        text = text.replace(/<\/?a[^>]*>/g, "");

        var re = /(\(.*?)?\b((?:https?|ftp|file):\/\/[-a-z0-9+&@#\/%?=~_()|!:,.;]*[-a-z0-9+&@#\/%=~_()|])/ig;
        return text.replace(re, function (match, lParens, url) {
            var rParens = '';
            lParens = lParens || '';

            // Try to strip the same number of right parens from url
            // as there are left parens.  Here, lParenCounter must be
            // a RegExp object.  You cannot use a literal
            //     while (/\(/g.exec(lParens)) { ... }
            // because an object is needed to store the lastIndex state.
            var lParenCounter = /\(/g;
            while (lParenCounter.exec(lParens)) {
                var m;
                // We want m[1] to be greedy, unless a period precedes the
                // right parenthesis.  These tests cannot be simplified as
                //     /(.*)(\.?\).*)/.exec(url)
                // because if (.*) is greedy then \.? never gets a chance.
                if (m = /(.*)(\.\).*)/.exec(url) ||
                    /(.*)(\).*)/.exec(url)) {
                    url = m[1];
                    rParens = m[2] + rParens;
                }
            }
            return lParens + "<a href='" + url + "'>" + url + "</a>" + rParens;
        });
    }

    getUserPermissions() {

        return new Promise((resolve, reject) => {

            let permissionObj = {
                "wo_access": {
                    "view_all": false,
                    "view_department": false,
                    "view_own": false,
                    "view_assigned_to": false,
                    "view_listing": false,
                    "can_create": false,
                    "priority": false,
                    "status": false,
                    "due_to_date": false,
                    "assigned_to_id": false,
                    "assignable": false,
                    "team": false,
                    "can_delete": false,
                    "can_edit": false,
                    "can_close": false
                }
            };

            this.nativeStorage.getItem('user_permissions').then(
                permissions => {
                    let woPermissions = permissions["6"] ? permissions["6"] : [];
                    let rootObj = permissions["root"] ? permissions["root"] : [];
                    for (let i = 0; i < woPermissions.length; i++) {
                        if (woPermissions[i].action == "index" && woPermissions[i].permitted == true) {
                            permissionObj.wo_access.view_listing = true;
                            for (let j = 0; j < woPermissions[i].options.length; j++) {
                                if (woPermissions[i].options[j].option == "all" && woPermissions[i].options[j].permitted == true) {
                                    permissionObj.wo_access.view_all = true;
                                }
                                if (woPermissions[i].options[j].option == "department" && woPermissions[i].options[j].permitted == true) {
                                    permissionObj.wo_access.view_department = true;
                                }
                                if (woPermissions[i].options[j].option == "own" && woPermissions[i].options[j].permitted == true) {
                                    permissionObj.wo_access.view_own = true;
                                }
                                if (woPermissions[i].options[j].option == "assigned_to" && woPermissions[i].options[j].permitted == true) {
                                    permissionObj.wo_access.view_assigned_to = true;
                                }
                            }
                        }
                        if (woPermissions[i].action == "create" && woPermissions[i].permitted == true) {
                            permissionObj.wo_access.can_create = true;
                        }
                        if (woPermissions[i].action == "destroy" && woPermissions[i].permitted == true) {
                            permissionObj.wo_access.can_delete = true;
                        }
                        if (woPermissions[i].action == "edit_closed" && woPermissions[i].permitted == true) {
                            permissionObj.wo_access.can_close = true;
                        }
                        if (woPermissions[i].action == "edit" && woPermissions[i].permitted == true) {
                            permissionObj.wo_access.view_listing = true;
                            permissionObj.wo_access.can_edit = true;
                            for (let j = 0; j < woPermissions[i].options.length; j++) {
                                if (woPermissions[i].options[j].option == "priority" && woPermissions[i].options[j].permitted == true) {
                                    permissionObj.wo_access.priority = true;
                                }
                                if (woPermissions[i].options[j].option == "status" && woPermissions[i].options[j].permitted == true) {
                                    permissionObj.wo_access.status = true;
                                }
                                if (woPermissions[i].options[j].option == "due_to_date" && woPermissions[i].options[j].permitted == true) {
                                    permissionObj.wo_access.due_to_date = true;
                                }
                                if (woPermissions[i].options[j].option == "assigned_to_id" && woPermissions[i].options[j].permitted == true) {
                                    permissionObj.wo_access.assigned_to_id = true;
                                }
                            }
                        }
                        if (woPermissions[i].action == "assignable" && woPermissions[i].permitted == true) {
                            permissionObj.wo_access.assignable = true;
                        }
                    }

                    for (let i = 0; i < rootObj.length; i++) {
                        if ((rootObj[i].name == "Team" || rootObj[i].name == "team") && rootObj[i].permitted == true) {
                            permissionObj.wo_access.team = true;
                        }
                    }

                    return resolve(permissionObj);
                },
                error => {
                    return reject(false);
                }
            );

        });

    }

    updateMentionsDb(user_id, type, type_id) {
        this.sqlite.create({
            name: 'data.db',
            location: 'default'
        }).then((db: SQLiteObject) => {

            console.log("SELECT * FROM user_mentions WHERE type='" + type + "' AND type_id='" + type_id + "' AND user_id='" + user_id + "'");

            db.executeSql("SELECT * FROM user_mentions WHERE type='" + type + "' AND type_id='" + type_id + "' AND user_id='" + user_id + "'", []).then((dataUserSQL) => {
                console.log("user_mentions TABLE DATA: " + JSON.stringify(dataUserSQL));
                let insert = true;
                let total = 0;
                if (dataUserSQL.rows.length > 0) {
                    for (let k = 0; k < dataUserSQL.rows.length; k++) {
                        insert = false;
                        total = parseInt(dataUserSQL.rows.item(k).total);
                    }
                }
                total = total + 1;

                if (insert == true) {
                    console.log("INSERT INTO user_mentions (type, type_id, user_id, total) VALUES ('" + type + "'," + type_id + "," + user_id + "," + total + ")");
                    db.executeSql("INSERT INTO user_mentions (type, type_id, user_id, total) VALUES ('" + type + "'," + type_id + "," + user_id + "," + total + ")", {}).then((data1) => {
                        console.log("INSERTED: user_mentions " + JSON.stringify(data1));
                    }, (error1) => {
                        console.log("INSERT ERROR: user_mentions" + JSON.stringify(error1));
                    });
                }
                else {
                    console.log("UPDATE user_mentions SET total=" + total + " WHERE type='" + type + "' AND type_id='" + type_id + "' AND user_id='" + user_id + "'");
                    db.executeSql("UPDATE user_mentions SET total=" + total + " WHERE type='" + type + "' AND type_id='" + type_id + "' AND user_id='" + user_id + "'", {}).then((data1) => {
                        console.log("UPDATED: user_mentions" + JSON.stringify(data1));
                    }, (error1) => {
                        console.log("UPDATED ERROR: user_mentions" + JSON.stringify(error1));
                    });
                }
            }, (errorUser) => {
                console.log("1 ERROR: " + JSON.stringify(errorUser));
            });

        }).catch(e => console.log(e));
    }

    getTextValue(allChatMentions, members, val) {
        let mentionStr = "";
        if (allChatMentions.length > 0 && parseInt(allChatMentions[0]) > 0) {
            //mentionStr = "<span class='mention_style'>";
            let oldMessage = false;
            mentionStr = "<span class='mention_style'>";
            for (let k = 0; k < allChatMentions.length; k++) {
                for (let l = 0; l < members.length; l++) {
                    if (members[l].id == allChatMentions[k]) {
                        if (val.indexOf("@" + members[l].name) == -1) {
                            mentionStr += "<span style='color:#BDBDBD;font-size:13px;'>@</span>" + members[l].name + " ";
                            oldMessage = true;
                        }
                        let newStr = "<span class='mention_style'><span style='color:#BDBDBD;font-size:13px;'>@</span>" + members[l].name + "</span> ";
                        val = this.replaceAll(val, "@" + members[l].name, newStr);
                    }
                }
            }
            mentionStr += "</span>";

            if (oldMessage == true) {
                val = mentionStr + val;
            }
            // mentionStr += "</span>";
        }
        return val;
    }

    getTextValueWithNames(allChatMentions, members, val) {
        let mentionStr = "";
        let result = { html: val, text: val };
        if (allChatMentions.length > 0 && parseInt(allChatMentions[0]) > 0) {
            //mentionStr = "<span class='mention_style'>";
            let oldMessage = false;
            let tempNames = "";
            let tempVal = val;
            mentionStr = "<span class='mention_style'>";
            for (let k = 0; k < allChatMentions.length; k++) {
                for (let l = 0; l < members.length; l++) {
                    if (members[l].id == allChatMentions[k]) {
                        tempNames += members[l].name + " ";
                        if (val.toLowerCase().indexOf("@" + members[l].name.toLowerCase()) == -1) {
                            mentionStr += "<span style='color:#BDBDBD;font-size:13px;'>@</span>" + members[l].name + " ";
                            oldMessage = true;
                        }
                        let newStr = "<span class='mention_style'><span style='color:#BDBDBD;font-size:13px;'>@</span>" + members[l].name + "</span> ";
                        val = this.replaceAll(val, "@" + members[l].name, newStr);
                    }
                }
            }
            mentionStr += "</span>";

            result.text = tempNames + tempVal;
            if (oldMessage == true) {
                val = mentionStr + val;
            }
            // mentionStr += "</span>";
            result.html = val;
        }

        return result;
    }

    removeMentionsFromName(allChatMentions, members, val) {
        if (allChatMentions.length > 0 && parseInt(allChatMentions[0]) > 0) {
            //mentionStr = "<span class='mention_style'>";

            for (let k = 0; k < allChatMentions.length; k++) {
                for (let l = 0; l < members.length; l++) {
                    if (members[l].id == allChatMentions[k]) {
                        let searchMask = "@" + members[l].name;
                        let regEx = new RegExp(searchMask, "ig");
                        var replaceMask = "";
                        val = val.replace(regEx, replaceMask);
                    }
                }
            }
        }
        return val;
    }

    /* Define function for escaping user input to be treated as 
    a literal string within a regular expression */
    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    /* Define functin to find and replace specified term with replacement string */
    replaceAll(str, term, replacement) {
        return str.replace(new RegExp(this.escapeRegExp(term), 'g'), replacement);
    }

    showLoaderForDbSync() {
        this.loading = this.loadingCtrl.create({
            content: 'Please wait app is updating...',
            cssClass: 'db_synch_loader'
        });
        // Show the loader
        this.loading.present();
    }


    getDataWithLoaderMsg(url, accessToken, msg) {

        let headers = new Headers({
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'AUTHORIZATION': accessToken.access_token ? accessToken.access_token : '',
            'PROPERTY-TOKEN': accessToken.property_token ? accessToken.property_token : ''
        });
        let options = new RequestOptions({
            headers: headers
        });

        this.showLoaderWithMsg(msg);

        let repos = this.http.get(url, options);
        return repos;
    }

    showLoaderWithMsg(msg) {
        this.loading = this.loadingCtrl.create({
            content: msg,
            cssClass: 'loader_with_text'
        });
        // Show the loader
        this.loading.present();
    }


}

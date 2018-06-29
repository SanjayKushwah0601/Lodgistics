import { Component, ViewChild } from '@angular/core';
import { NavController, Slides, MenuController, Platform } from 'ionic-angular';
import { NativeStorage } from '@ionic-native/native-storage';
import { LoginPage } from '../login/login';
import { FeedsPage } from '../feeds/feeds';
import { AddEditGroupPage } from '../addEditGroup/addEditGroup';

@Component({
	selector: 'page-tutorial',
	templateUrl: 'tutorial.html',
	providers: [NativeStorage]
})
export class TutorialPage {

	public slidesData: any;
	@ViewChild(Slides) slides: Slides;

	constructor(public navCtrl: NavController, public menu: MenuController, public nativeStorage: NativeStorage, public platform: Platform) {


		this.platform.ready().then(() => {
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

		this.slidesData = [
			{
				title: "SIMPLE ONBOARDING",
				description: "Bacon ipsum dolor amet jerky cupim fatback bresaola shoulder short loin.",
				image: "assets/img/default-pic.jpg",
			},
			{
				title: "SIMPLE ONBOARDING",
				description: "Bacon ipsum dolor amet jerky cupim fatback bresaola shoulder short loin.",
				image: "assets/img/default-pic.jpg",
			},
			{
				title: "SIMPLE ONBOARDING",
				description: "Bacon ipsum dolor amet jerky cupim fatback bresaola shoulder short loin.",
				image: "assets/img/default-pic.jpg",
			}
		];


	}

	ionViewDidEnter() {
		this.menu.swipeEnable(false, 'menu1');
	}

	public openLogin() {
		this.navCtrl.setRoot(LoginPage);
	}


}

import { Component } from '@angular/core';
import { AlertController, NavController } from 'ionic-angular';
import { TranslationService } from '../../providers/translation.service';
import { enableProdMode } from '@angular/core';
enableProdMode();

@Component({
	templateUrl: 'translation.html',
	providers: [TranslationService]
})


export class TranslationPage {


	data;
	errorMsg;
	sourceText: string;
	translatedText: string;
	sourceLanguageCode: string;
	sourceLanguageName = 'Translate a text!';
	targetLanguageCode: string;
	targetLanguageName = 'Choose a language!';
	languages = [];



	constructor(private navController: NavController, private translationservice: TranslationService, public alertCtrl: AlertController) {

		this.navController = navController;
		this.translationservice = translationservice;

	}



	translate() {

		if (this.targetLanguageCode) {

			let sourceText = this.sourceText;
			let targetLanguageCode = this.targetLanguageCode;

			this.translationservice.translateText(sourceText, targetLanguageCode).subscribe(data => {
				this.data = data;
				return this.data.translatedText;
				//this.sourceLanguageCode = this.data.detectedSourceLanguage;
				//this.sourceLanguageCodeNameChange();
			}, error => {
				this.errorMsg = error;

				let alert = this.alertCtrl.create({
					subTitle: 'Error:' + '<br>' + this.errorMsg,
					buttons: ['OK']
				});

				alert.present();

			});



		} else {

			let alert = this.alertCtrl.create({
				subTitle: 'Please choose a target language!',
				buttons: ['OK']
			});

			alert.present(alert);
		}

	};



	sourceLanguageCodeNameChange() {

		this.languages = this.translationservice.getLanguages();

		for (let i = 0; i < this.languages.length; i++) {
			if (this.languages[i].languageCode == this.sourceLanguageCode) {
				this.sourceLanguageName = this.languages[i].languageName;
			}
		}

	};



	instantTranslate() {

		let sourceText = this.sourceText
		let translatedLanguageCode = this.targetLanguageCode

		this.translationservice.translateText(sourceText, translatedLanguageCode).subscribe(data => {
			this.data = data;
			this.translatedText = this.data.translatedText;
			this.sourceLanguageCode = this.data.detectedSourceLanguage;
			this.targetLanguageCodeNameChange()
			console.log(this.data);
		});


	}



	targetLanguageCodeNameChange() {

		this.languages = this.translationservice.getLanguages();

		for (let i = 0; i < this.languages.length; i++) {
			if (this.languages[i].languageCode === this.targetLanguageCode) {
				console.log(this.languages[i].languageCode);
				this.targetLanguageName = this.languages[i].languageName;

			}
		}

	};



	clearTextBtn() {
		this.sourceText = '';
		this.translatedText = '';
	}



	chooseLanguageBtn() {
		let alert = this.alertCtrl.create();
		alert.setTitle('Choose a language');
		alert.addInput({
			type: 'radio',
			label: 'Arabic',
			value: 'ar',
			//checked: false , you can set it true or false if you want
		});
		alert.addInput({
			type: 'radio',
			label: 'Basque',
			value: 'eu',
		});
		alert.addInput({
			type: 'radio',
			label: 'Bulgarian',
			value: 'bg',
		});
		alert.addInput({
			type: 'radio',
			label: 'Catalan',
			value: 'ca',
		});
		alert.addInput({
			type: 'radio',
			label: 'Chinese',
			value: 'zh-CN',
		});
		alert.addInput({
			type: 'radio',
			label: 'Croation',
			value: 'hr',
		});
		alert.addInput({
			type: 'radio',
			label: 'Czech',
			value: 'cs',
		});
		alert.addInput({
			type: 'radio',
			label: 'Danish',
			value: 'da',
		});
		alert.addInput({
			type: 'radio',
			label: 'Dutch',
			value: 'nl',
		});
		alert.addInput({
			type: 'radio',
			label: 'English',
			value: 'en',
		});
		alert.addInput({
			type: 'radio',
			label: 'Español',
			value: 'es',
		});
		alert.addInput({
			type: 'radio',
			label: 'Estonian',
			value: 'et',
		});
		alert.addInput({
			type: 'radio',
			label: 'Finish',
			value: 'fi',
		});
		alert.addInput({
			type: 'radio',
			label: 'French',
			value: 'fr',
		});
		alert.addInput({
			type: 'radio',
			label: 'German',
			value: 'de',
		});
		alert.addInput({
			type: 'radio',
			label: 'Hebrew',
			value: 'iw',
		});
		alert.addInput({
			type: 'radio',
			label: 'Hindi',
			value: 'hi',
		});
		alert.addInput({
			type: 'radio',
			label: 'Hungarian',
			value: 'hu',
		});
		alert.addInput({
			type: 'radio',
			label: 'Icelandic',
			value: 'is',
		});
		alert.addInput({
			type: 'radio',
			label: 'Indonesian',
			value: 'id',
		});
		alert.addInput({
			type: 'radio',
			label: 'Italian',
			value: 'it',
		});
		alert.addInput({
			type: 'radio',
			label: 'Irish',
			value: 'ga',
		});
		alert.addInput({
			type: 'radio',
			label: 'Japanese',
			value: 'ja',
		});
		alert.addInput({
			type: 'radio',
			label: 'Korean',
			value: 'ko',
		});
		alert.addInput({
			type: 'radio',
			label: 'Latvian',
			value: 'lv',
		});
		alert.addInput({
			type: 'radio',
			label: 'Lithuanian',
			value: 'lv',
		});
		alert.addInput({
			type: 'radio',
			label: 'Norwegian',
			value: 'no',
		});
		alert.addInput({
			type: 'radio',
			label: 'Persian',
			value: 'fa',
		});
		alert.addInput({
			type: 'radio',
			label: 'Polish',
			value: 'pl',
		});
		alert.addInput({
			type: 'radio',
			label: 'Portuguese',
			value: 'pt',
		});
		alert.addInput({
			type: 'radio',
			label: 'Romanian',
			value: 'ro',
		});
		alert.addInput({
			type: 'radio',
			label: 'Russian',
			value: 'ru',
		});
		alert.addInput({
			type: 'radio',
			label: 'Serbian',
			value: 'sr',
		});
		alert.addInput({
			type: 'radio',
			label: 'Slovak',
			value: 'sk',
		});
		alert.addInput({
			type: 'radio',
			label: 'Slovenian',
			value: 'sl',
		});
		alert.addInput({
			type: 'radio',
			label: 'Slovenian',
			value: 'sl',
		});
		alert.addInput({
			type: 'radio',
			label: 'Swedish',
			value: 'sv',
		});
		alert.addInput({
			type: 'radio',
			label: 'Thai',
			value: 'th',
		});
		alert.addInput({
			type: 'radio',
			label: 'Turkish',
			value: 'tr',
		});
		alert.addInput({
			type: 'radio',
			label: 'Ukranian',
			value: 'uk',
		});
		alert.addInput({
			type: 'radio',
			label: 'Welsh',
			value: 'cy',
		});
		alert.addInput({
			type: 'radio',
			label: 'Zulu',
			value: 'zu',
		});
		alert.addButton('Cancel');
		alert.addButton({
			text: 'Choose',
			handler: data => {
				this.targetLanguageCode = data;
				if (this.sourceText) {
					this.instantTranslate();
				} else {
					this.targetLanguageCodeNameChange();
				}
			}
		});
		alert.present(alert);
	}


}

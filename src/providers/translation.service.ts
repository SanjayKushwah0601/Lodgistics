import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/throw';
import { translationApiKey } from '../services/configURLs';


@Injectable()


export class TranslationService {

  data: string;
  errorMsg: string;
  sourceWord: string;
  translatedLanguageCode: string;
  languages = [];



  constructor(private http: Http) {

    this.http = http;

  }


  // translateText(sourceText, targetLanguageCode) {

  //   return this.http.get("https://www.googleapis.com/language/translate/v2?key=AIzaSyCAzE_zAtScIPorYG-3wkId-3TWGdFAlPQ&target=" + targetLanguageCode + "&q=" + sourceText)
  //     .map(response => {
  //       this.data = response.json().data.translations[0];
  //       return this.data;
  //     }).catch(this.handleError);

  // }

  translateText(sourceText, targetLanguageCode) {

    let obj = { target: targetLanguageCode, q: sourceText };
    return this.http.post(`https://translation.googleapis.com/language/translate/v2?key=${translationApiKey}`, obj)
      .map(response => {
        let data = response.json().data.translations[0];
        data.translatedText = data.translatedText.replace(new RegExp("@ ", 'g'), "@");
        return data;
      }).catch(this.handleError);

  }

  private handleError(error: any) {
    this.errorMsg = (error.message) ? error.message :
      error.status ? `${error.status}   -  ${error.statusText} ` : 'Server error';
    return Observable.throw(this.errorMsg);
  }


  getLanguages() {

    return this.languages = [
      {
        languageCode: 'ar',
        languageName: 'Arabic'
      },
      {
        languageCode: 'eu',
        languageName: 'Basque'
      },
      {
        languageCode: 'bg',
        languageName: 'Bulgarian'
      },
      {
        languageCode: 'ca',
        languageName: 'Catalan'
      },
      {
        languageCode: 'zh-CN',
        languageName: 'Chinese'
      },
      {
        languageCode: 'hr',
        languageName: 'Croatian'
      },
      {
        languageCode: 'cs',
        languageName: 'Czech'
      },
      {
        languageCode: 'da',
        languageName: 'Danish'
      },
      {
        languageCode: 'nl',
        languageName: 'Dutch'
      },
      {
        languageCode: 'en',
        languageName: 'English'
      },
      {
        languageCode: 'es',
        languageName: 'Español'
      },
      {
        languageCode: 'et',
        languageName: 'Estonian'
      },
      {
        languageCode: 'fi',
        languageName: 'Finish'
      },
      {
        languageCode: 'fr',
        languageName: 'French'
      },
      {
        languageCode: 'de',
        languageName: 'German'
      },
      {
        languageCode: 'iw',
        languageName: 'Hebrew'
      },
      {
        languageCode: 'hi',
        languageName: 'Hindi'
      },
      {
        languageCode: 'hu',
        languageName: 'Hungarian'
      },
      {
        languageCode: 'is',
        languageName: 'Icelandic'
      },
      {
        languageCode: 'id',
        languageName: 'Indonesian'
      },
      {
        languageCode: 'it',
        languageName: 'Italian'
      },
      {
        languageCode: 'ga',
        languageName: 'Irish'
      },
      {
        languageCode: 'ja',
        languageName: 'Japanese'
      },
      {
        languageCode: 'ko',
        languageName: 'Korean'
      },
      {
        languageCode: 'lv',
        languageName: 'Latvian'
      },
      {
        languageCode: 'lt',
        languageName: 'Lithuanian'
      },
      {
        languageCode: 'no',
        languageName: 'Norwegian'
      },
      {
        languageCode: 'fa',
        languageName: 'Persian'
      },
      {
        languageCode: 'pl',
        languageName: 'Polish'
      },
      {
        languageCode: 'pt',
        languageName: 'Portuguese'
      },
      {
        languageCode: 'ro',
        languageName: 'Romanian'
      },
      {
        languageCode: 'ru',
        languageName: 'Russian'
      },
      {
        languageCode: 'sr',
        languageName: 'Serbian'
      },
      {
        languageCode: 'sk',
        languageName: 'Slovak'
      },
      {
        languageCode: 'sl',
        languageName: 'Slovenian'
      },
      {
        languageCode: 'sv',
        languageName: 'Swedish'
      },
      {
        languageCode: 'th',
        languageName: 'Thai'
      },
      {
        languageCode: 'tr',
        languageName: 'Turkish'
      },
      {
        languageCode: 'uk',
        languageName: 'Ukrainian'
      },
      {
        languageCode: 'cy',
        languageName: 'Welsh'
      },
      {
        languageCode: 'zu',
        languageName: 'Zulu'
      }

    ];

  }

}

import { Component, NgZone, ViewChild, ElementRef, Input } from '@angular/core';
import { NavController, NavParams, Content, AlertController } from 'ionic-angular';
import { srviceMethodsCall } from '../../services/serviceMethods';
import { Keyboard } from '@ionic-native/keyboard';
import { NativeStorage } from '@ionic-native/native-storage';
import { chatHistoryUrl } from '../../services/configURLs';
import { baseUrl } from '../../services/configURLs';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { TranslationService } from '../../providers/translation.service';
import myFaye from 'faye';

@Component({
  selector: 'page-individualchat',
  //templateUrl: 'individualChat.html',
  template: ' <form #form="ngForm" (ngSubmit)="logForm(form)" novalidate>      <ion-item><ion-label>111111111111111</ion-label><ion-input type="text" required [(ngModel)]="todo.title" ngControl="title"></ion-input></ion-item><ion-item><ion-label>Description</ion-label><ion-textarea [(ngModel)]="todo.description" ngControl="description"></ion-textarea></ion-item><button ion-button type="submit" block>Add Todo</button></form>',
  providers: [srviceMethodsCall, Keyboard, NativeStorage, SQLite, TranslationService]
})
export class IndividualChatPage {
  todo = {
    title: '',
    description: ''
  };
  logForm(form) {
    console.log(form.value)
  }
}
  //
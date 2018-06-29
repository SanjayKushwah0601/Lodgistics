import { BrowserModule, DomSanitizer } from '@angular/platform-browser';
import { ErrorHandler, NgModule, Pipe, PipeTransform, enableProdMode } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { HttpModule } from '@angular/http';
import { MomentModule } from 'angular2-moment';
import { Network } from '@ionic-native/network';
//import { MentionModule } from 'angular2-mentions/mention';
import { RichTextComponent } from '../components/rich-text/rich-text';
import { Badge } from '@ionic-native/badge';

import { MyApp } from './app.component';
import { TutorialPage } from '../pages/tutorial/tutorial';
import { LoginPage } from '../pages/login/login';
import { ProfilePage } from '../pages/profile/profile';
import { FeedsPage } from '../pages/feeds/feeds';
import { CreateFeedsPage } from '../pages/createFeeds/createFeeds';
import { FeedDetailPage } from '../pages/feedDetail/feedDetail';
import { ForgetPasswordPage } from '../pages/forgetPassword/forgetPassword';
import { NewAccountPage } from '../pages/newAccount/newAccount';
import { CreateHotelPage } from '../pages/createHotel/createHotel';
import { ChattingPage } from '../pages/chatting/chatting';
import { AddEditGroupPage } from '../pages/addEditGroup/addEditGroup';
import { GroupChatPage } from '../pages/groupChat/groupChat';
import { TranslationPage } from '../pages/translation/translation';
import { MyMentionPage } from '../pages/myMention/myMention';
import { IndividualChatPage } from '../pages/individualChat/individualChat';
import { AddCommentPage } from '../pages/addComment/addComment';
import { ReplyMessagePage } from '../pages/replyMessage/replyMessage';
import { learnVideoPage } from '../pages/learnVideo/learnVideo';
import { WebHomePage } from '../pages/webHomePage/webHomePage';
import { WorkOrderPage } from '../pages/workOrder/workOrder';
import { CreateWorkOrderPage } from '../pages/createWorkOrder/createWorkOrder';
import { ChangePasswordPage } from '../pages/changePassword/changePassword';
import { MyVideosPage } from '../pages/myVideos/myVideos';
import { BroadcastListPage } from '../pages/broadcastList/broadcastList';
import { createBroadcastPage } from '../pages/createBroadcast/createBroadcast';
import { markFixedPage } from '../pages/markFixed/markFixed';
import { RoomsMaintenancePage } from '../pages/roomsMaintenance/roomsMaintenance';
import { StartPmPage } from '../pages/startPm/startPm';
import { TaskChecklistPage } from '../pages/taskChecklist/taskChecklist';
import { TaskChecklistDetailPage } from '../pages/taskChecklistDetail/taskChecklistDetail';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NotificationSettingsPage } from '../pages/notificationSettings/notificationSettings';
import { TeamListingPage } from '../pages/teamListing/teamListing';
import { InviteUsersPage } from '../pages/inviteUsers/inviteUsers';
import { IntroInviteUsersPage } from '../pages/introInviteUsers/introInviteUsers';
import { SendMessagePage } from '../pages/sendMessage/sendMessage';
import { createFollowUpPage } from '../pages/createFollowUp/createFollowUp';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
// import { Deeplinks } from '@ionic-native/deeplinks';


import { TranslationService } from '../providers/translation.service';
import { TextMaskModule } from 'angular2-text-mask';
import { CalendarModule } from "ion2-calendar";
import {Ionic2MaskDirective} from "ionic2-mask-directive";

import { Buffer } from 'buffer';
// import 'intl';
// import 'intl/locale-data/jsonp/en';
import { NewUserPage } from '../pages/newUser/newUser';

enableProdMode();

@Pipe({ name: 'safeHtml' })
export class SafeHtmlPipe implements PipeTransform {
  constructor(private sanitized: DomSanitizer) { }
  transform(value) {
    //console.log(this.sanitized.bypassSecurityTrustHtml(value))
    return this.sanitized.bypassSecurityTrustHtml(value);
  }
}


@NgModule({
  declarations: [
    MyApp,
    SafeHtmlPipe,
    RichTextComponent,
    Ionic2MaskDirective,
    TutorialPage,
    LoginPage,
    ProfilePage,
    FeedsPage,
    CreateFeedsPage,
    FeedDetailPage,
    ForgetPasswordPage,
    NewAccountPage,
    CreateHotelPage,
    ChattingPage,
    AddEditGroupPage,
    GroupChatPage,
    TranslationPage,
    MyMentionPage,
    IndividualChatPage,
    ReplyMessagePage,
    learnVideoPage,
    ChangePasswordPage,
    MyVideosPage,
    BroadcastListPage,
    createBroadcastPage,
    markFixedPage,
    RoomsMaintenancePage,
    StartPmPage,
    WebHomePage,
    WorkOrderPage,
    CreateWorkOrderPage,
    NotificationSettingsPage,
    TaskChecklistPage,
    TaskChecklistDetailPage,
    AddCommentPage,
    TeamListingPage,
    InviteUsersPage,
    IntroInviteUsersPage,
    SendMessagePage,NewUserPage,
    createFollowUpPage
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpModule,
    MomentModule,
    TextMaskModule,
    CalendarModule,
    //MentionModule,
    IonicModule.forRoot(MyApp, {
      scrollPadding: false,
      scrollAssist: true,
      autoFocusAssist: false
    })
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    TutorialPage,
    LoginPage,
    ProfilePage,
    FeedsPage,
    CreateFeedsPage,
    FeedDetailPage,
    ForgetPasswordPage,
    NewAccountPage,
    CreateHotelPage,
    ChattingPage,
    AddEditGroupPage,
    GroupChatPage,
    TranslationPage,
    MyMentionPage,
    IndividualChatPage,
    ReplyMessagePage,
    learnVideoPage,
    ChangePasswordPage,
    MyVideosPage,
    BroadcastListPage,
    createBroadcastPage,
    markFixedPage,
    RoomsMaintenancePage,
    StartPmPage,
    WebHomePage,
    WorkOrderPage,
    CreateWorkOrderPage,
    NotificationSettingsPage,
    TaskChecklistPage,
    TaskChecklistDetailPage,
    AddCommentPage,
    TeamListingPage,
    InviteUsersPage,
    IntroInviteUsersPage,
    SendMessagePage,
    NewUserPage,
    createFollowUpPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    TranslationService,
    Network,
    Badge,
    SQLite,
    // Deeplinks,
    { provide: ErrorHandler, useClass: IonicErrorHandler }
  ]
})
export class AppModule { }
import { Injectable } from '@angular/core';
import 'rxjs/add/operator/map';
import { GoogleAnalytics } from '@ionic-native/google-analytics';
import { trackingId } from '../../services/configURLs';

/*
  Generated class for the GoogleAnalyticsProvider provider.

  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular 2 DI.
*/
@Injectable()
export class GoogleAnalyticsProvider {

  static ACTION_CLICK: string = 'Click';
  static ACTION_SEND: string = 'Send';
  static ACTION_REPLY: string = 'Reply';
  static ACTION_CREATE: string = 'Create';
  static ACTION_UPDATE: string = 'Update';
  static ACTION_DELETE: string = 'Delete';
  static ACTION_COMMENT: string = 'Comment';

  static ACTION_POST_CREATE: string = 'Create post';
  static ACTION_POST_BROADCAST_CREATE: string = 'Create Broadcast';
  static ACTION_POST_BROADCAST_DELETE: string = 'Delete Broadcast';
  static ACTION_POST_FOLLOWUP_CREATE: string = 'Create Follow up';
  static ACTION_POST_FOLLOWUP_DELETE: string = 'Delete Follow up';


  constructor(private ga: GoogleAnalytics) {
    console.log('Hello GoogleAnalyticsProvider Provider');
    this.ga.startTrackerWithId(trackingId)
      .then(() => {
        console.log('Google analytics is ready now');
        this.ga.enableUncaughtExceptionReporting(true)
        // this.ga.trackView('test');
        // Tracker is ready
        // You can now track pages or set additional information such as AppVersion or UserId
      })
      .catch(e => console.log('Error starting GoogleAnalytics', e));
  }

  /**
   * Method will only be used for sidemenu tab click event
   * @param tabName 
   */
  public sideMenuClick(tabName: string) {
    this.ga.startTrackerWithId(trackingId)
      .then(() => {
        console.log('Google analytics is ready now');
        this.ga.trackEvent('Side Menu', GoogleAnalyticsProvider.ACTION_CLICK, tabName);
      })
      .catch(e => console.log('Error starting GoogleAnalytics', e));
  }

  /**
   * Method will only be used for bottom fab button click event
   * @param tabName 
   */
  public fabButtonClick(tabName: string) {
    this.ga.startTrackerWithId(trackingId)
      .then(() => {
        console.log('Google analytics is ready now');
        this.ga.trackEvent('Bottom Fab Button', GoogleAnalyticsProvider.ACTION_CLICK, tabName);
      })
      .catch(e => console.log('Error starting GoogleAnalytics', e));
  }

  /**
   * Method will only be used for bottom tab navigation event
   * @param tabName 
   */
  public bottomTabClick(tabName: string) {
    this.ga.startTrackerWithId(trackingId)
      .then(() => {
        console.log('Google analytics is ready now');
        this.ga.trackEvent('Bottom Tab', GoogleAnalyticsProvider.ACTION_CLICK, tabName);
      })
      .catch(e => console.log('Error starting GoogleAnalytics', e));
  }


  /**
   * Method will be used to track post/feed related events
   * @param {string} actionName GoogleAnalyticsProvider.ACTION_... action to be performed on the post/feed and it should be one of the action defined in this file at the top
   * @param {string} label aditional information
   */
  public trackPostEvents(actionName: string, label: string) {
    this.ga.startTrackerWithId(trackingId)
      .then(() => {
        console.log('Google analytics is ready now');
        this.ga.trackEvent('Post/Feed', actionName, label);
      })
      .catch(e => console.log('Error starting GoogleAnalytics', e));
  }

  /**
   * Method will be used to track message related events
   * @param {string} actionName GoogleAnalyticsProvider.ACTION_... action to be performed on the message and it should be one of the action defined in this file at the top
   * @param {string} label aditional information
   */
  public trackMessageEvents(actionName: string, label: string) {
    this.ga.startTrackerWithId(trackingId)
      .then(() => {
        console.log('Google analytics is ready now');
        this.ga.trackException('Test Crash', false)
        this.ga.trackEvent('Message', actionName, label);
      })
      .catch(e => console.log('Error starting GoogleAnalytics', e));
  }


  /**
  * Method will be used to track group related events
  * @param {string} actionName GoogleAnalyticsProvider.ACTION_... action to be performed on the group and it should be one of the action defined in this file at the top
  * @param {string} label aditional information 
  */
  public trackGroupEvents(actionName: string, label: string) {
    this.ga.startTrackerWithId(trackingId)
      .then(() => {
        console.log('Google analytics is ready now');
        this.ga.trackEvent('Group', actionName, label);
      })
      .catch(e => console.log('Error starting GoogleAnalytics', e));
  }


  /**
  * Method will be used to track Work Order related events
  * @param {string} actionName GoogleAnalyticsProvider.ACTION_... action to be performed on the Work Order and it should be one of the action defined in this file at the top
  * @param {string} label aditional information 
  */
  public trackWorkOrderEvents(actionName: string, label: string) {
    this.ga.startTrackerWithId(trackingId)
      .then(() => {
        console.log('Google analytics is ready now');
        this.ga.trackEvent('Work Order', actionName, label);
      })
      .catch(e => console.log('Error starting GoogleAnalytics', e));
  }
}

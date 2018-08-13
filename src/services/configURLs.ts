import { Injectable } from '@angular/core';

let isProductionServer = true;
let basePath = "dev";
let googleAnalyticsTrackingId = 'UA-123135893-1' //dev
let translApiKey = 'AIzaSyBLSNqlaHGAE92rEcDzH95vNYb2M06zGzI' //dev
if (isProductionServer) {
    basePath = "app";
    googleAnalyticsTrackingId = 'UA-123152950-1' // production
    translApiKey = 'AIzaSyDuebJIdzgeTbmwqmMGx6gVtXZu7lMoaGQ' // production
}

export let translationApiKey = translApiKey
export let trackingId = googleAnalyticsTrackingId
export let baseUrl = "https://" + basePath + ".lodgistics.com/";
export let webSocketBaseUrl = "wss://" + basePath + ".lodgistics.com/";

export let getLoginUrl = baseUrl + "api/auth";
export let getProfileUrl = baseUrl + "api/users";
export let getFeedsUrl = baseUrl + "api/feeds";
export let createFeedUrl = baseUrl + "api/feeds";
export let chatListingUrl = baseUrl + "api/chats";
//export let addEditGroupUrl = baseUrl+"api/chat_groups";
export let addEditGroupUrl = baseUrl + "api/chats";
export let chatHistoryUrl = baseUrl + "api/chat_messages";
export let getAllMembersUrl = baseUrl + "api/users";
export let getMyMentionsUrl = baseUrl + "api/mentions";
export let getAwsSignedUrl = baseUrl + "api/s3_sign";
export let deleteMentionUrl = baseUrl + "api/chat_mentions";
export let getPrivateOnlyUrl = baseUrl + "api/chats/private_only";
export let getChatsUrl = baseUrl + "api/chats";
export let getGroupsOnlyUrl = baseUrl + "api/chats/group_only";
export let forgetPasswordUrl = baseUrl + "api/passwords";
export let sendMessageUrl = baseUrl + "api/chat_messages";
export let markReadUrl = baseUrl + "api/chat_messages/mark_read_mass";
export let metaDataCallUrl = baseUrl + "api/chat_messages/updates";
export let createAcknowledgementUrl = baseUrl + "api/acknowledgements";
export let createFeedWorkOrderUrl = baseUrl + "api/feeds";
export let locationsUrl = baseUrl + "api/locations";
export let viewWorkOrderUrl = baseUrl + "maintenance/work_orders";
export let createMessageWorkOrderUrl = baseUrl + "api/chat_messages";
export let getRoomCheckListItemsUrl = baseUrl + "api/rooms/checklist_items";
export let getPublicAreaCheckListItemsUrl = baseUrl + "api/public_areas/checklist_items";
export let updateProfileUrl = baseUrl + "api/users";
export let changePasswordUrl = baseUrl + "api/passwords";
export let getRolesAndDepartmentsUrl = baseUrl + "api/users";
export let getUserPermissionsUrl = baseUrl + "api/permissions";
export let getPushNotificationSettings = baseUrl + "api/push_notification_settings";
export let updatePushNotificationSettings = baseUrl + "api/push_notification_settings";
export let clearAllMentionsUrl = baseUrl + "api/mentions/clear";
export let snoozeMentionUrl = baseUrl + "api/mentions/snooze";
export let unsnoozeMentionUrl = baseUrl + "api/mentions/unsnooze";
export let createHotelUrl = baseUrl + "api/properties";
export let getHotelCodesUrl = baseUrl + "api/properties";
export let getHowToVideosUrl = baseUrl + "how-to-videos.json";
export let getBroadcastListUrl = baseUrl + "api/feeds/broadcasts";
export let getWoListUrl = baseUrl + "api/work_orders";
export let getWoDataUrl = baseUrl + "api/work_orders";
export let updateWoDataUrl = baseUrl + "api/work_orders";
export let createWorkOrderUrl = baseUrl + "api/work_orders";
export let createBroadcastUrl = baseUrl + "api/feeds";
export let closeWoUrl = baseUrl + "api/work_orders";
export let getTaskChecklistUrl = baseUrl + "api/task_lists";
export let getTaskChecklistDetailsUrl = baseUrl + "api/task_lists";
export let startTaskChecklistUrl = baseUrl + "api/task_lists";
export let completeTaskListItemUrl = baseUrl + "api/task_item_records";
export let finishTaskListUrl = baseUrl + "api/task_list_records";
export let getTaskListActivitiesUrl = baseUrl + "api/task_lists/activities";
export let getTaskListDetailsUrl = baseUrl + "api/task_list_records";
export let inviteUsersUrl = baseUrl + "api/users/multi_invite";
export let requestConfirmsUrl = baseUrl + "api/users/request_confirm";
export let createUserUrl = baseUrl + "api/users/";
export let updateFeedStatusUrl = baseUrl + "api/feeds";
export let createFollowUpUrl = baseUrl + "api/feeds";
export let getFollowUpUrl = baseUrl + "api/feeds/follow_ups";
export let getAssignableUsersUrl = baseUrl + "api/work_orders/assignable_users";
export let checkForAppUpdateUrl = baseUrl + "api/check_for_app_update";
export let getMentionables = baseUrl + "api/mentionables";

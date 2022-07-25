import { CommandTypes, IServiceBusNode, ServiceBus, ServiceBusQueues } from '../duuzra_types/network';

import {
    DuuzraAccountsHandler,
    DuuzraAnalyticsHandler,
    DuuzraAttendeesHandler,
    DuuzraContentsHandler,
    DuuzraContentTypeTemplateHandler,
    DuuzraDuuzraHandler,
    DuuzraFoldersHandler,
    DuuzraGroupsHandler,
    DuuzraInfoHandler,
    DuuzraListCacheHandler,
    DuuzraListHandler,
    DuuzraMediasHandler,
    DuuzraPollClickLogHandler,
    DuuzraSetContentLockStateHandler,
    DuuzraSetContentNavigationStateHandler,
    DuuzraUsersHandler,
    GetAnalyticContentResultHandler,
    GetAnalyticFeedbackHandler,
    GetDuuzraPinCodeHandler,
    GetDuuzraSnapshotDeltaHandler,
    GetDuuzraStateDeltaHandler,
    GetDuuzraUrlTokenHandler,
    GetUserDataCollationHandler,
    GetUserDataHandler,
    NotificationAddRemoveHandler,
    NotificationLiveHandler,
    SetUserDataItemHandler,
    UserManagementHandler,
    DuuzraCanvasViewContentHandler,
    DuuzraHiddenMediasHandler
} from './handlers';
import { DuuzraAssetsHandler } from './handlers/duuzra-assets.handler';
import { DuuzraClientHandler, DuuzraLatestSnapshotHandler, DuuzraSnapshotHandler } from './index';
import { DuuzraPollResultHandler } from './handlers/duuzra-poll-result.handler'; 

export class DuuzraNode implements IServiceBusNode { 
    public readonly name = 'duuzras'; 
    public registerSubscriptions(bus: ServiceBus): void { 
        bus.subscribe(ServiceBusQueues.duuzrasNode.getDuuzrasListCache, new DuuzraListCacheHandler());
        bus.subscribe(ServiceBusQueues.duuzrasNode.getDuuzrasList, new DuuzraListHandler());
        bus.subscribe(ServiceBusQueues.duuzrasNode.duuzraAssets, new DuuzraAssetsHandler());
        bus.subscribe(ServiceBusQueues.duuzrasNode.duuzraAttendees, new DuuzraAttendeesHandler());
        bus.subscribe(ServiceBusQueues.duuzrasNode.duuzraFolders, new DuuzraFoldersHandler());
        bus.subscribe(ServiceBusQueues.duuzrasNode.duuzraPollResult, new DuuzraPollResultHandler());
        bus.subscribe(ServiceBusQueues.duuzrasNode.duuzraInfo, new DuuzraInfoHandler());
        bus.subscribe(ServiceBusQueues.duuzrasNode.duuzraAccounts, new DuuzraAccountsHandler());
        bus.subscribe(ServiceBusQueues.duuzrasNode.duuzraContents, new DuuzraContentsHandler());
        bus.subscribe(ServiceBusQueues.duuzrasNode.duuzraUsers, new DuuzraUsersHandler());
        bus.subscribe(ServiceBusQueues.duuzrasNode.duuzraUserMgt, new UserManagementHandler());
        bus.subscribe(ServiceBusQueues.duuzrasNode.duuzraClient, new DuuzraClientHandler()); 
        bus.subscribe(ServiceBusQueues.duuzrasNode.getDuuzraStateDelta, new GetDuuzraStateDeltaHandler());
        bus.subscribe(ServiceBusQueues.duuzrasNode.duuzraUrlToken, new GetDuuzraUrlTokenHandler());
        bus.subscribe(ServiceBusQueues.duuzrasNode.setContentNavigationState, new DuuzraSetContentNavigationStateHandler());
        bus.subscribe(ServiceBusQueues.duuzrasNode.submitToAnalytics, new DuuzraAnalyticsHandler());
        bus.subscribe(ServiceBusQueues.duuzrasNode.submitUserDataItem, new SetUserDataItemHandler());
        bus.subscribe(ServiceBusQueues.duuzrasNode.getUserData, new GetUserDataHandler());
        bus.subscribe(ServiceBusQueues.duuzrasNode.getUserDataCollation, new GetUserDataCollationHandler());
        bus.subscribe(ServiceBusQueues.duuzrasNode.getNotificationLive, new NotificationLiveHandler());
        bus.subscribe(ServiceBusQueues.duuzrasNode.getNotificationAddRemove, new NotificationAddRemoveHandler());
        bus.subscribe(ServiceBusQueues.duuzrasNode.getAnalyticFeedback, new GetAnalyticFeedbackHandler());
        bus.subscribe(ServiceBusQueues.duuzrasNode.getAnalyticContentResult, new GetAnalyticContentResultHandler());
        bus.subscribe(ServiceBusQueues.duuzrasNode.pollClickLog, new DuuzraPollClickLogHandler()); 
        bus.subscribe(ServiceBusQueues.duuzrasNode.duuzraCanvasViewContent, new DuuzraCanvasViewContentHandler()); 
        bus.subscribe(ServiceBusQueues.duuzrasNode.duuzraHiddenMedia, new DuuzraHiddenMediasHandler());
        bus.subscribe(ServiceBusQueues.duuzrasNode.duuzraGroups, new DuuzraGroupsHandler());
        bus.subscribe(ServiceBusQueues.duuzrasNode.duuzraDuuzra, new DuuzraDuuzraHandler());
        bus.subscribe(ServiceBusQueues.duuzrasNode.setContentLockState, new DuuzraSetContentLockStateHandler());
        bus.subscribe(ServiceBusQueues.duuzrasNode.duuzraMedia, new DuuzraMediasHandler());
        bus.subscribe(ServiceBusQueues.duuzrasNode.duuzraSnapshot, new DuuzraSnapshotHandler());
        bus.subscribe(ServiceBusQueues.duuzrasNode.latestSnapshot, new DuuzraLatestSnapshotHandler());
        bus.subscribe(ServiceBusQueues.duuzrasNode.duuzraContentTypeTemplate, new DuuzraContentTypeTemplateHandler());
        bus.subscribe(ServiceBusQueues.duuzrasNode.getDuuzraSnapshotDelta, new GetDuuzraSnapshotDeltaHandler());
        bus.subscribe(ServiceBusQueues.duuzrasNode.duuzraPinCode, new GetDuuzraPinCodeHandler());
        
    }
}

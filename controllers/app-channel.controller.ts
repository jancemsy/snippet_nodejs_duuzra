import {
    CommandTypes,
    CommunicationFactory,
    CommunicationsStream,
    CommunicationStatuses,
    ICommunication,
    ServiceBusQueues
} from '../duuzra_types/network';
import * as express from 'express';
import { System } from '../shared';
import { DuuzraRouteHandler } from '../shared/security/route.handler';
import { ChannelController } from './channel.controller';
import { WebsocketChannelController } from './websocket-channel.controller';
import { TokenConfig } from '../shared/security/token.confg'; 

export class AppChannelController extends WebsocketChannelController {
    constructor(routeHandler: DuuzraRouteHandler) {
        // configure the base class
        super('app', routeHandler.router);
    } 
    protected async processCommunication(communication: ICommunication<any>): Promise<ICommunication<any>> { 
        console.log("app-channel.controller",communication.head.command); 
        try{
                let response: ICommunication<any>;
                let config = new TokenConfig; 
                let sessions = await System.DB.get('sessionStorage', 'all') as any; 
        
                for(let session of sessions.docs) {
                    if (config.deviceId == session.deviceId) { 
                        if (communication.head.command = 'channel.app.message-notification') { 
                            response = await System.serviceBus.sendToQueue(ServiceBusQueues.gatewayNode.handshake, communication);     
                        }                                    
                    }
                } 

                switch (communication.head.command) { 
                    case CommandTypes.common.handshake:
                        response = await System.serviceBus.sendToQueue(ServiceBusQueues.gatewayNode.handshake, communication);
                        break;

                    case CommandTypes.app.duuzra_list:
                        response = await System.serviceBus.sendToQueue(ServiceBusQueues.duuzrasNode.getDuuzrasListCache, communication);
                        break;

                    case CommandTypes.app.v2.duuzra_list:
                        response = await System.serviceBus.sendToQueue(ServiceBusQueues.duuzrasNode.getDuuzrasList, communication);
                        break;

                    case 'channel.app.v2.latestSnapshot':
                        response = await System.serviceBus.sendToQueue(ServiceBusQueues.duuzrasNode.latestSnapshot, communication);
                        break;

                    case CommandTypes.common.enterDuuzra:
                        response = await System.serviceBus.sendToQueue(ServiceBusQueues.gatewayNode.setSessionDuuzraLink, communication);
                        break;

                    case CommandTypes.cms.duuzra_duuzra:
                        response = await System.serviceBus.sendToQueue(ServiceBusQueues.duuzrasNode.duuzraDuuzra, communication);
                        break;
                        // Handle view count update request from app
                    case CommandTypes.app.duuzraPollResult:
                        response = await System.serviceBus.sendToQueue(ServiceBusQueues.duuzrasNode.duuzraPollResult, communication);
                        break;
                    case CommandTypes.cms.duuzra_content:
                        response = await System.serviceBus.sendToQueue(ServiceBusQueues.duuzrasNode.duuzraContents, communication);
                        break;

                    case CommandTypes.common.leaveDuuzra:
                        const leaveDuuzraMessage = CommunicationFactory.clone(communication);
                        leaveDuuzraMessage.body = null; // make sure the body/state info is null
                        response = await System.serviceBus.sendToQueue(ServiceBusQueues.gatewayNode.setSessionDuuzraLink, leaveDuuzraMessage);
                        break;
                    case CommandTypes.app.sendMessageToAttendee:
                        response = await System.serviceBus.sendToQueue(ServiceBusQueues.messengerNode.sendMessageToAttendee, communication);
                        break;
                    case CommandTypes.app.getAttendeeConversations:
                        response = await System.serviceBus.sendToQueue(ServiceBusQueues.messengerNode.getMessageLogDelta, communication);
                        break; 
                    case CommandTypes.app.submitToAnalytics: 
                        response = await System.serviceBus.sendToQueue(ServiceBusQueues.duuzrasNode.submitToAnalytics, communication);
                        break;
                    case CommandTypes.app.v2.userDataItem:
                        response = await System.serviceBus.sendToQueue(ServiceBusQueues.duuzrasNode.submitUserDataItem, communication);
                        break;
                    case CommandTypes.app.v2.userData:
                        response = await System.serviceBus.sendToQueue(ServiceBusQueues.duuzrasNode.getUserData, communication);
                        break;
                    // only used for testing. This request will always go directly to the queue from the master channel
                    case 'channel.app.v2.user-data-collated':
                        response = await System.serviceBus.sendToQueue(ServiceBusQueues.duuzrasNode.getUserDataCollation, communication);
                        break;
                    case CommandTypes.app.duuzra_user_mgt:
                        response = await System.serviceBus.sendToQueue(ServiceBusQueues.duuzrasNode.duuzraUserMgt, communication);
                        break;
                    case CommandTypes.app.getMessageNotificationToAttendee:
                        response = await System.serviceBus.sendToQueue(ServiceBusQueues.messengerNode.getMessageNotification, communication);
                        break;

                    case CommandTypes.app.duuzra_notification_live:
                        response = await System.serviceBus.sendToQueue(ServiceBusQueues.duuzrasNode.getNotificationLive, communication);
                        break;

                    case CommandTypes.app.duuzra_notification_add_remove:
                        response = await System.serviceBus.sendToQueue(ServiceBusQueues.duuzrasNode.getNotificationAddRemove, communication);
                        break;

                    case CommandTypes.app.duuzra_poll_coordinate:
                        response = await System.serviceBus.sendToQueue(ServiceBusQueues.duuzrasNode.pollClickLog, communication);
                        break;
                    default:
                        response = CommunicationFactory.createResponse(communication, CommunicationStatuses.UnknownCommand);
                        break;
                }
 

        // return the response
        return Promise.resolve(response);
    }catch(err){
        return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
        //return Promise.reject<ICommunication<any>>(null);
    }

    }
}

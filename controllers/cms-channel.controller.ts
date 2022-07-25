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

/**
 * This acts as a central router for incoming web socket requests on the cms channel.
 * The requests will ultimately be handled by specific controllers and session handlers.
 */
export class CmsChannelController extends WebsocketChannelController {
    constructor(routeHandler: DuuzraRouteHandler) {
        // configure the base class
        super('cms', routeHandler.router);
    }

    /**
     * Processes an inbound communication on the cms channel
     */
    protected async processCommunication(/*stream: CommunicationsStream<any>,*/ communication: ICommunication<any>): Promise<ICommunication<any>> {  
        console.log("cms-channel.controller",communication.head.command); 

        let response: ICommunication<any>;

        // push the command to the relevant queue
        switch (communication.head.command) {
            case CommandTypes.cms.duuzra_account:
                response = await System.serviceBus.sendToQueue(ServiceBusQueues.duuzrasNode.duuzraAccounts, communication);
                break;
            case CommandTypes.common.handshake:
                response = await System.serviceBus.sendToQueue(ServiceBusQueues.gatewayNode.handshake, communication);
                break;
            case CommandTypes.cms.duuzra_folder:
                response = await System.serviceBus.sendToQueue(ServiceBusQueues.duuzrasNode.duuzraFolders, communication);
                break;
            case CommandTypes.cms.duuzra_list:
                response = await System.serviceBus.sendToQueue(ServiceBusQueues.duuzrasNode.getDuuzrasListCache, communication);
                break;
            case CommandTypes.cms.duuzra_client:
                response = await System.serviceBus.sendToQueue(ServiceBusQueues.duuzrasNode.duuzraClient, communication);
                break;
            case CommandTypes.cms.duuzra_info:
                response = await System.serviceBus.sendToQueue(ServiceBusQueues.duuzrasNode.duuzraInfo, communication);
                break;
            case CommandTypes.cms.duuzra_content:
                response = await System.serviceBus.sendToQueue(ServiceBusQueues.duuzrasNode.duuzraContents, communication);
                break;
            case CommandTypes.cms.duuzra_users:
                response = await System.serviceBus.sendToQueue(ServiceBusQueues.duuzrasNode.duuzraUsers, communication);
                break;
            case CommandTypes.cms.duuzra_user_mgt:
                response = await System.serviceBus.sendToQueue(ServiceBusQueues.duuzrasNode.duuzraUserMgt, communication);
                break;
            case CommandTypes.cms.duuzra_group:
                response = await System.serviceBus.sendToQueue(ServiceBusQueues.duuzrasNode.duuzraGroups, communication);
                break;
            case CommandTypes.app.duuzraPollResult:
                response = await System.serviceBus.sendToQueue(ServiceBusQueues.duuzrasNode.duuzraPollResult, communication);
                break;
            case CommandTypes.cms.getUserCollatedData:
                response = await System.serviceBus.sendToQueue(ServiceBusQueues.duuzrasNode.getUserCollatedData, communication);
                break;
            case CommandTypes.cms.duuzra_duuzra:
                response = await System.serviceBus.sendToQueue(ServiceBusQueues.duuzrasNode.duuzraDuuzra, communication);
                break;
            /*
            case CommandTypes.cms.duuzra_user_properties:
                response = await System.serviceBus.sendToQueue(ServiceBusQueues.duuzrasNode.duuzraUserProperties, communication);
                break;
            case CommandTypes.cms.duuzra_users_groups:
                response = await System.serviceBus.sendToQueue(ServiceBusQueues.duuzrasNode.duuzraUsersToGroups, communication);
                break;
            */
            case CommandTypes.cms.duuzra_media:
                response = await System.serviceBus.sendToQueue(ServiceBusQueues.duuzrasNode.duuzraMedia, communication);
                break;
            case CommandTypes.cms.duuzra_hidden_media:
                response = await System.serviceBus.sendToQueue(ServiceBusQueues.duuzrasNode.duuzraHiddenMedia, communication);
                break;
            case CommandTypes.cms.duuzra_snapshot:
                response = await System.serviceBus.sendToQueue(ServiceBusQueues.duuzrasNode.duuzraSnapshot, communication);
                break;
            case CommandTypes.cms.duuzra_snapshot_delta:
                response = await System.serviceBus.sendToQueue(ServiceBusQueues.duuzrasNode.getDuuzraSnapshotDelta, communication);
                break;
            case CommandTypes.cms.duuzra_content_type_template:
                response = await System.serviceBus.sendToQueue(ServiceBusQueues.duuzrasNode.duuzraContentTypeTemplate, communication);
                break;
            case CommandTypes.cms.duuzra_pincode:
                response = await System.serviceBus.sendToQueue(ServiceBusQueues.duuzrasNode.duuzraPinCode, communication);
                break;
            case CommandTypes.cms.duuzra_user_data:
                response = await System.serviceBus.sendToQueue(ServiceBusQueues.duuzrasNode.duuzraUserData, communication);
                break;
            case CommandTypes.cms.duuzra_urltoken:
                response = await System.serviceBus.sendToQueue(ServiceBusQueues.duuzrasNode.duuzraUrlToken, communication);
                break;
            case CommandTypes.cms.duuzra_assets:
                response = await System.serviceBus.sendToQueue(ServiceBusQueues.duuzrasNode.duuzraAssets, communication);
                break;
            case CommandTypes.cms.duuzra_pincode:
                response = await System.serviceBus.sendToQueue(ServiceBusQueues.duuzrasNode.duuzraPinCode, communication);
                break;
            case CommandTypes.cms.duuzra_urltoken:
                response = await System.serviceBus.sendToQueue(ServiceBusQueues.duuzrasNode.duuzraUrlToken, communication);
                break;
            case CommandTypes.cms.duuzra_attendee:
                response = await System.serviceBus.sendToQueue(ServiceBusQueues.duuzrasNode.duuzraAttendees, communication);
                break;
            case CommandTypes.cms.duuzra_analytic_feedback:
                response = await System.serviceBus.sendToQueue(ServiceBusQueues.duuzrasNode.getAnalyticFeedback, communication);
                break;
            case CommandTypes.cms.duuzra_analytic_content_result:
                response = await System.serviceBus.sendToQueue(ServiceBusQueues.duuzrasNode.getAnalyticContentResult, communication);
                break;
            case CommandTypes.cms.duuzra_canvas_view_content:
                response = await System.serviceBus.sendToQueue(ServiceBusQueues.duuzrasNode.duuzraCanvasViewContent, communication);
                break;
            default:
                response = CommunicationFactory.createResponse(communication, CommunicationStatuses.UnknownCommand);
                break;
        }

        // return the response
        return Promise.resolve(response);
    }
}

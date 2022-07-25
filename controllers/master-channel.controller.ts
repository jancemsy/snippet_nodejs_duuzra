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
 * This acts as a central router for incoming web socket requests on the master channel.
 * The requests will ultimately be handled by specific controllers and session handlers.
 */
export class MasterChannelController extends WebsocketChannelController {
    constructor(routeHandler: DuuzraRouteHandler) {
        // configure the base class
        super('master', routeHandler.router);
    }

    /**WW
     * Processes an inbound communication on the cms channel
     */
    protected async processCommunication(/*stream: CommunicationsStream<any>,*/ communication: ICommunication<any>): Promise<ICommunication<any>> { 
        console.log("master-channel.controller",communication.head.command); 
        let response: ICommunication<any>;

        // push the command to the relevant queue
        switch (communication.head.command) {

            case CommandTypes.common.handshake:
                response = await System.serviceBus.sendToQueue(ServiceBusQueues.gatewayNode.handshake, communication);
                break;

            case CommandTypes.master.pushContentLock:
                response = await System.serviceBus.sendToQueue(ServiceBusQueues.masterNode.pushContentLock, communication);
                break;

            case CommandTypes.master.pushNavigation:
                response = await System.serviceBus.sendToQueue(ServiceBusQueues.masterNode.pushNavigation, communication);
                break;
            case CommandTypes.master.getUserCollatedData:
                response = await System.serviceBus.sendToQueue(ServiceBusQueues.masterNode.getUserCollatedData, communication);
                break;
            default:
                response = await CommunicationFactory.createResponse(communication, CommunicationStatuses.UnknownCommand);
                break;

        } 

        // return the response
        return Promise.resolve(response);
    }
}

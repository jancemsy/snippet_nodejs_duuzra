import { WsStream } from './../shared/network';
import * as express from 'express';
import {
    ICommunication,
    CommunicationStatuses,
    CommunicationHandler,
    CommunicationsStream,
    CommunicationFactory,
    WsChannels,
    HttpChannels
} from '../duuzra_types/network';
import { IKeyValuePair } from '../duuzra_types/common';
import { System } from '../shared';
import { ChannelController } from './channel.controller';

/**
 * This is the channel controller for http requests
 */
export abstract class HttpChannelController extends ChannelController {
    constructor(
        protected channel: HttpChannels,
        protected router: express.Router
    ) {
        super();
    }

    public async processHttp(communication: ICommunication<any>): Promise<ICommunication<any>> {
        console.log("http-channel.controller",communication.head.command); 

        try {

            // prepare the communication with some internal properties
            // NOTE: The properties below cannot be relied upon to exist, these are here for a very specific purpose!
            communication.head.parameters = communication.head.parameters || {};
            communication.head.parameters['_channel'] = this.channel;

            // pass the prepared communication on for processing
            let response = await this.processCommunication(communication);

            return response;

        } catch (err) { 
            return Promise.reject<ICommunication<any>>(err);
        }
    }
}

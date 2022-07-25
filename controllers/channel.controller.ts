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

/**
 * This is the base class for all channel controllers
 */
export abstract class ChannelController {
    constructor() {}

    /**
     * Registers the permitted commands
     */
    protected abstract async processCommunication(/*stream: CommunicationsStream<any>,*/ communication: ICommunication<any>): Promise<ICommunication<any>>;
}

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
import { WebsocketChannelControllerConfig } from "./websocket-channel.controller.config";
import { Rejects } from 'mandrill-api';
/*import { DuuzraAPI } from "../app"; */

/**
 * This is the base class for all channel controllers
 */
export abstract class WebsocketChannelController extends ChannelController {

    constructor(
        protected channel: WsChannels,
        protected router: any
    ) {
        super();

        if (channel) {
            this.router.ws(`/${channel}`, (ws, req) => {

                ws.on('pong', (message) => {
                    // Ping-Pong cycle complete
                });

                ws.on('message', (message) => {
                    // create a web-socket stream and connect the raw socket as a reader
                    let stream = new WsStream();
                    stream.connectReader(ws);

                    // being processing this message 
                    this.processMessage(stream, message); 
                }); 

            });

        }
    }

    //james
    /*

    Changes made on 1/3/2020 were the following:
    1. return Promise<void> to Promise<{}> instead
    2. add then and catch statement instead of await in  this.processCommunication()
    3. add reject and resolve codes in the method  

    */


    /**
     * Processes messages from the socket using the registered handlers
     */
    private async processMessage(stream: CommunicationsStream<any>, message: string): Promise<{}> {
        console.log("websocket.channel.controlller.ts processMessage()"); 

        return new Promise((resolve, reject) => {

                    // try and parse the incoming message
                    let communication = null;
                    try {
                        communication = JSON.parse(message) as ICommunication<any>;
                    } catch (err) { 
                        stream.send(CommunicationFactory.create(null, CommunicationStatuses.BadRequest));
                        reject(err); 
                    }

                    try {
                        communication.head.parameters = communication.head.parameters || {};
                        communication.head.parameters['_channel'] = this.channel;
                        communication.head.parameters['_stream'] = stream;

                        // pass the prepared communication on for processing
                        this.processCommunication(/*stream,*/ communication).then(response =>{
                            if (response) {
                                // if we have a response, send it 
                                stream.send(response);
                                resolve(null);
                            }else{
                                stream.send(CommunicationFactory.createResponse(communication, CommunicationStatuses.Error)); 
                                reject(null);    
                            }
                        }).catch(err =>{
                            stream.send(CommunicationFactory.createResponse(communication, CommunicationStatuses.Error)); 
                            reject(err);
                        });  
                    } catch (err) {               
                         stream.send(CommunicationFactory.createResponse(communication, CommunicationStatuses.Error)); 
                         reject(err);
                    }

                });

    }
}

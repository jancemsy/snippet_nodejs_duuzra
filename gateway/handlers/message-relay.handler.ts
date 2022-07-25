import { ICommunication, CommunicationHandler } from '../../duuzra_types/network';
import { ConnectedSession } from '../models';
import { GatewayService } from '../gateway.service';

export class MessageRelayHandler implements CommunicationHandler {
    private gatewayCtrl: GatewayService;

    constructor() {
        this.gatewayCtrl = new GatewayService();
    }

    public async processCommunication(communication: ICommunication<ICommunication<any>>): Promise<ICommunication<any>> { 
        console.log("message-relay.handler.ts processcommunication()");  
        
        try{
                let channel = communication.head.parameters['channel'] || null;
                let duuzraUuid = communication.head.parameters['duuzraUuid'] || null;
                let userUuid = communication.head.parameters['userUuid'] || null;
                let attendeeUuid = communication.head.parameters['attendeeUuid'] || null;
                let sessionKey = communication.head.parameters['sessionKey'] || null;
                let deviceId = communication.head.parameters['deviceId'] || null; 

                if (!channel || !communication.body || !communication.body.head || !communication.body.head.correlationId) { 
                    return Promise.resolve(null);
                } else { 
                    let targettedSessions = this.gatewayCtrl.getFilteredConnections(channel, duuzraUuid, userUuid, attendeeUuid, sessionKey, deviceId); 
                    for (let session of targettedSessions) { 
                        try {     
                            let stream = session.getStreamByChannel(channel);
                            stream.publish(communication.body).then((response) => {
                                return response;
                            }).catch(function (e) { 
                            });
                        } catch (e) {
                            session.unlinkChannel(channel); 
                        } 
                    } 
                    return Promise.resolve(null);
                }   

            }catch(err) {
                return  Promise.resolve(null);
            } 
    }
}

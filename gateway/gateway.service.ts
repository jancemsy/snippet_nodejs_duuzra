import { IMessageEnvelope } from '../duuzra_types/messenger';
import { IKeyValuePair } from '../duuzra_types/common';
import { ICommunication, WsChannels, ServiceBusQueues, CommunicationFactory } from '../duuzra_types/network';
import { IDuuzraState } from '../duuzra_types/duuzras';
import { SessionService, Session, System } from '../shared';
import { ConnectedSession } from './models';

export class GatewayService {
    private sessionCtrl: SessionService;
    public static connectedSessions: IKeyValuePair<ConnectedSession> = {}; 
    constructor() {
        this.sessionCtrl = new SessionService();
    } 



    public async getMessageNotification(correlationId: string, sessionKey: string, duuzraUuid: string, recipientAttendeeUuid: string, senderAttendeeUuid: string, iconClick: boolean): Promise<IMessageEnvelope[]> { 
        console.log("gateway.service.ts getMessageNotification()");
        const connection = this.getConnectionByKey(sessionKey);
        if (connection) { 
            const getMessageLogCmd = CommunicationFactory.create<IMessageEnvelope[]>(correlationId, null, null, connection.session.userAuthToken, connection.session.userDeviceId, {
                duuzraUuid: duuzraUuid,
                recipientAttendeeUuid: recipientAttendeeUuid || null,
                senderAttendeeUuid: senderAttendeeUuid || null,
                iconClick: iconClick || false
            });
 
            const state = await System.serviceBus.sendToQueue(ServiceBusQueues.messengerNode.getMessageNotification, getMessageLogCmd); 
            return Promise.resolve(state ? state.body : null);
        } else { 
            return Promise.resolve(null);
        }
    }
    
    public getFilteredConnections(channel: WsChannels, duuzraUuid: string = null, userUuid: string = null, attendeeUuid: string = null, sessionKey: string = null, deviceId: string = null): ConnectedSession[] {  
        console.log("gateway.service.ts getFilteredConnections()");
        
            let duplicate = [];
            let results: ConnectedSession[] = [];
            let keys = [];

            Object.keys(GatewayService.connectedSessions).forEach((x) => {
                keys.push(x);
            }); 
    
            for (let x = keys.length - 1; x >= 0; x--){ 
                try{
                    let connection = GatewayService.connectedSessions[keys[x]];  

                    let connection_is_good = false; 
                    
                    /*
                    Notes: 
                    all-users sessionkey is used in the duuzrasnapshot when sending a changed cue in the app intended to all opened connection app. 
                    */

              

                   try{
                        if(sessionKey == 'all-users'){
                            results.push(connection);  
                        }else  if(connection.session.sessionKey == 'all-users'){
                            results.push(connection); 
                        }
                    }catch(e){

                    }

                    

                    if (connection.isChannelLinked(channel)) {  
                        if (!attendeeUuid || attendeeUuid === connection.attendeeUuid) { 
                            if (!sessionKey || connection.session.sessionKey === sessionKey ) { 
                                if (deviceId && connection.session.userDeviceId == deviceId) {   
                                connection_is_good = true; 
                                }
                            }
                        }
                    }



                    if ( connection_is_good ) {   
                                if (!duplicate[connection.session.userDeviceId]) { 
                                                duplicate[connection.session.userDeviceId] = 1;
                                                results.push(connection);
                                } else {
                                        delete GatewayService.connectedSessions[x]; 
                                }                                             
        
                                if (duuzraUuid && connection.associatedDuuzraUuid === duuzraUuid) {  
                                    if (!duplicate[connection.session.userDeviceId]) { 
                                        duplicate[connection.session.userDeviceId] = 1;
                                        results.push(connection);
                                    } else {
                                        delete GatewayService.connectedSessions[x]; 
                                    }
                                }    
                }//if 
        
            }catch(error){ //ignore error and move to next loop 
            }

          }//for 
            
         return results;

        
    }
 
    public getConnectionByKey(sessionKey: string): ConnectedSession { 
        return GatewayService.connectedSessions[sessionKey];
    }


    public linkConnectionToDuuzraAndUser(sessionKey: string, duuzraUuid: string, attendeeUuid: string) { 
        const connection = this.getConnectionByKey(sessionKey);
        if (connection) { 
            connection.associatedDuuzraUuid = duuzraUuid;
            connection.attendeeUuid = attendeeUuid;
        }
    }
 
    public async getStateDelta(correlationId: string, sessionKey: string, duuzraUuid: string, attendeeUuid: string, lastStateUuid: string = null): Promise<IDuuzraState> { 
        console.log("gateway.service.ts getStateDeleta()");
        const connection = this.getConnectionByKey(sessionKey);
        if (connection) { 
            if (duuzraUuid) {

                const params = {
                    duuzraUuid: duuzraUuid,
                    uuid: lastStateUuid || 'MY-LAST-STATE-UUID'
                } 

                const getStateMessage = CommunicationFactory.create(correlationId, null, null, connection.session.userAuthToken, connection.session.userDeviceId, params); 
                const state = await System.serviceBus.sendToQueue(ServiceBusQueues.duuzrasNode.getDuuzraStateDelta, getStateMessage); 
                return Promise.resolve(state ? state.body : null);
            } else { 
            }
        } else { 
            return Promise.resolve(null);
        }
    }



    public async connectUserSession(communication: ICommunication<any>): Promise<{}> { 
        console.log("gateway.service.ts getSessionFromMessage");
       try{
            let connectedSession: ConnectedSession = null;
            console.log("gateway.service.ts getSessionFromMessage 1");
            let sessionKey = Session.createSessionKey(communication.head.authToken, communication.head.deviceId); 
            
            console.log("gateway.service.ts getSessionFromMessage 2");

            if (GatewayService.connectedSessions[sessionKey]) {
                console.log("gateway.service.ts getSessionFromMessage 3");
                connectedSession = GatewayService.connectedSessions[sessionKey];
            } else { 
                console.log("gateway.service.ts getSessionFromMessage 4");
                let session = await this.sessionCtrl.getSessionFromMessage(communication);
                if(session){
                    console.log("gateway.service.ts getSessionFromMessage 5");
                    connectedSession = new ConnectedSession(session);
                    console.log("gateway.service.ts getSessionFromMessage 6");
                    GatewayService.connectedSessions[sessionKey] = connectedSession;
                }
            } 

            console.log("gateway.service.ts associated id of session " + connectedSession.session._id );

            if(connectedSession){
                connectedSession.linkChannel(communication.head.parameters['_channel'] || null, communication.head.parameters['_stream'] || null); 
                return Promise.resolve(connectedSession);
            }else{
                console.log('not succesfully connected here....');
                return Promise.resolve(null); //return null if not successfully connected     
            }
        }catch(err){
            return Promise.resolve(null);
        } 
    } 
    
    public async getMessageLogDelta(correlationId: string, sessionKey: string, attendeeUuid: string, lastReceivedMessageUuid: string = null, senderAttendeeUuid: string): Promise<IMessageEnvelope[]> { 
        console.log("gateway.service.ts getMessageLogDelta()");
        const connection = this.getConnectionByKey(sessionKey);
        if (connection) { 
            const getMessageLogCmd = CommunicationFactory.create<IMessageEnvelope[]>(correlationId, null, null, connection.session.userAuthToken, connection.session.userDeviceId, {
                attendeeUuid: attendeeUuid,
                lastReceivedMessageUuid: lastReceivedMessageUuid || null,
                senderAttendeeUuid: senderAttendeeUuid || null
            }); 
            const state = await System.serviceBus.sendToQueue(ServiceBusQueues.messengerNode.getMessageLogDelta, getMessageLogCmd); 
            return Promise.resolve(state ? state.body : null);
        } else { 
            return Promise.resolve(null);
        }
    }

    public async getDuuzraSnapshotDelta(correlationId: string, sessionKey: string, duuzraUuid: string, attendeeUuid: string, lastRecievedSnapshotUuid: string = null): Promise<any> { 
        console.log("gateway.service.ts getDuuzraSnapshotDelta()");
        const connection = this.getConnectionByKey(sessionKey);
        if (connection) { 
            if (duuzraUuid) { 
                const params = {
                    duuzraUuid: duuzraUuid,
                    uuid: lastRecievedSnapshotUuid || 'MY-LAST-SNAPSHOT-UUID'
                }

                const getSnapshotDiffCommand = CommunicationFactory.create<any>(correlationId, null, null, connection.session.userAuthToken, connection.session.userDeviceId, params); 
                const snapshotDelta = await System.serviceBus.sendToQueue(ServiceBusQueues.duuzrasNode.getDuuzraSnapshotDelta, getSnapshotDiffCommand);  
                return Promise.resolve(snapshotDelta ? snapshotDelta.body : null);
            } else { 
            }
        } else { 
            return Promise.resolve(null);
        }
    }
 

}

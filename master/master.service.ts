import {
    IDuuzraContentLockPush,
    IDuuzraNavigationPush,
    IDuuzraState,
    IUserDataItemDto
} from '../duuzra_types/duuzras'
import {
    CommandTypes,
    CommunicationFactory,
    CommunicationStatuses,
    ICommunication,
    ServiceBusQueues,
    WsChannels
} from '../duuzra_types/network';

import { Session, System } from '../shared';
const uuid = require('uuid/v1');

export class MasterService {  
    public async LockDuuzraSnapshot(duuzraUuid: string, contentUuid: string, locked : any ) { 
        try {
            let rawInfos = await System.DB.get('duuzraSnapshot', 'docId', 'duuzra-snapshot_' + duuzraUuid) as any;
            if (rawInfos.docs.length > 0) { 
                let doc = rawInfos.docs[0];
                let snapshot = doc.snapshots;
                if (rawInfos && snapshot.length > 0) {  
                    for (let i = 0; i < snapshot.length; i++) { 
                        if (!snapshot[i].isDraft) { 
                            if (snapshot[i].isActive) {
                                Object.keys(snapshot[i].payloads.content).forEach((duuzraId) => {      
                                    if (snapshot[i].payloads.content[duuzraId].uuid == contentUuid) {  
                                          snapshot[i].payloads.content[duuzraId].locked = locked;     
                                    } 
                                });
                            }
                        }
                    } 
                    doc._rev = rawInfos.docs[0]._rev;
                    await System.DB.save(doc);
                }
            }
        } catch (err) { 
        } 
    }


    public async setContentLockedState(correlationId: string, session: Session, push: IDuuzraContentLockPush, communication: ICommunication<any>): Promise<IDuuzraState> { 
        console.log("master.service.ts setContentLockedState()");
        const lockingMessage = CommunicationFactory.create(
            correlationId,
            communication.head.status,
            communication.head.command,
            session.userAuthToken,
            communication.head.deviceId,
            communication.head.parameters,
            push
        ); 
        const state = await System.serviceBus.sendToQueue(ServiceBusQueues.duuzrasNode.setContentLockState, lockingMessage); 
        const stateMessage = CommunicationFactory.create(
            uuid(),
            CommunicationStatuses.OK,
            CommandTypes.app.stateSynchronisation,
            null,
            null,
            null,
            state.body
        ); 
        const relayMessage = CommunicationFactory.createGatewayRelayMessage('app', push.duuzraUuid, null, null, null, stateMessage);
        System.serviceBus.sendToQueue(ServiceBusQueues.gatewayNode.relayMessageToChannel, relayMessage);  
        this.LockDuuzraSnapshot(push.duuzraUuid, push.contentUuid ,push.locked  ); 
        return Promise.resolve(state.body);
    }

    

    public async setNavigationState(correlationId: string, push: IDuuzraNavigationPush, communication: ICommunication<any>): Promise<IDuuzraState> {
        console.log("master.service.ts setNavigationState()");
        try { 
            const navigationMessage = CommunicationFactory.create(
                correlationId,
                communication.head.status,
                communication.head.command,
                communication.head.authToken,
                communication.head.deviceId,
                communication.head.parameters,
                communication.body
            );
 
            const state = await System.serviceBus.sendToQueue(ServiceBusQueues.duuzrasNode.setContentNavigationState, navigationMessage);
            if (push.slideUuid){
                state.body['duuzraStateDelta'].locks[0]['slideUuid'] = push.slideUuid;
            } 
            const stateMessage = CommunicationFactory.create(
                uuid(),
                CommunicationStatuses.OK,
                CommandTypes.app.stateSynchronisation,
                null,
                null,
                null,
                state.body
            ); 
            const relayMessage = CommunicationFactory.createGatewayRelayMessage('app', push.duuzraUuid, null, null, null, stateMessage);  
            System.serviceBus.sendToQueue(ServiceBusQueues.gatewayNode.relayMessageToChannel, relayMessage); 
            return Promise.resolve(state.body);
        }catch (err){ 
        }

    }

    public async getUserCollatedData(correlationId: string, authToken: string, session: Session, duuzraUuid: string, collationType: string): Promise<ICommunication<IUserDataItemDto[]>> { 
        console.log("master.service.ts getUserCollatedData()");
        try {
            const requestCollatedDataParams = {
                duuzraUuid: duuzraUuid,
                filter: {
                    type: collationType
                }
            }
            const getUserDataCommand = CommunicationFactory.create<any>(correlationId, null, null, authToken, 'Duuzra-Master-Service', requestCollatedDataParams, null, 'get');
            const getUserDataResponse: ICommunication<IUserDataItemDto[]> = await System.serviceBus.sendToQueue(ServiceBusQueues.duuzrasNode.getUserDataCollation, getUserDataCommand); 
            return Promise.resolve(getUserDataResponse);
        } catch (e) {
            return Promise.reject<ICommunication<IUserDataItemDto[]>>(new Error('IAttendeeService - createAttendee - createNewUser - failed: ' + e));
        }
    }
}

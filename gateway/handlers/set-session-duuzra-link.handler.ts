import { IDuuzraState, IStateData, IStateInfo } from '../../duuzra_types/duuzras';
import { IMessageEnvelope } from '../../duuzra_types/messenger';
import {
    CommandTypes,
    CommunicationFactory,
    CommunicationHandler,
    CommunicationStatuses,
    ICommunication
} from '../../duuzra_types/network';
import { Session } from '../../shared';
import { GatewayService } from '../gateway.service';

export class SetSessionDuuzraLinkHandler implements CommunicationHandler {
    private gatewayCtrl: GatewayService;

    constructor() {
        this.gatewayCtrl = new GatewayService();
    }
 
    public async processCommunication(communication: ICommunication<IStateInfo>): Promise<ICommunication<IStateData>> {  
        console.log("set-session-duuzra-link.handler.ts processcommunication()");
        const sessionKey = Session.createSessionKey(communication.head.authToken, communication.head.deviceId);
        const duuzraUuid = communication.head.parameters['duuzraUuid'] || null;
        const attendeeUuid = communication.head.parameters['attendeeUuid'] || null;
        const senderAttendeeUuid = communication.head.parameters['senderAttendeeUuid'] || null;
        const recipientAttendeeUuid = communication.head.parameters['recipientAttendeeUuid'] || null;
        const iconClick = communication.head.parameters['iconClick'] || null;
        const stateInfo = communication.body as IStateInfo;   
        if (stateInfo) {  
            this.gatewayCtrl.linkConnectionToDuuzraAndUser(sessionKey, duuzraUuid, attendeeUuid);
            const duuzraStateCommand = this.gatewayCtrl.getStateDelta(communication.head.correlationId, sessionKey, duuzraUuid, attendeeUuid, stateInfo.lastReceivedStateUuid); 
            const messageLogCommand = this.gatewayCtrl.getMessageLogDelta(communication.head.correlationId, sessionKey, attendeeUuid, stateInfo.lastReceivedMessageUuid, senderAttendeeUuid); 
            const notificationLogCommand = this.gatewayCtrl.getMessageNotification(communication.head.correlationId, sessionKey, duuzraUuid, recipientAttendeeUuid, senderAttendeeUuid, iconClick); 
            const snapshotDiffCommand = this.gatewayCtrl.getDuuzraSnapshotDelta(communication.head.correlationId, sessionKey, duuzraUuid, attendeeUuid, stateInfo.lastReceivedSnapshotUuid); 
            const deltas = await Promise.all<any>([duuzraStateCommand, messageLogCommand, snapshotDiffCommand, notificationLogCommand]);  
            if (deltas) { 
                return Promise.resolve(
                    CommunicationFactory.createResponse(communication, CommunicationStatuses.OK, null, {
                        duuzraStateDelta: deltas[0] as IDuuzraState,
                        messageLogDelta: deltas[1] as IMessageEnvelope[],
                        snapshotDiffDelta: deltas[2] as any,
                        messageNotificationDelta: deltas[3] as any,
                    } as IStateData as any)
                );
            }
        } 
        return Promise.resolve(CommunicationFactory.createResponse(communication, CommunicationStatuses.OK, null, null as any));
    }

}

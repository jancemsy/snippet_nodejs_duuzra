import { MessengerService } from './../messenger.service';
import { IMessageEnvelope } from '../../duuzra_types/messenger';
import {
    CommunicationHandler,
    ICommunication,
    CommunicationStatuses,
    CommandTypes,
    CommunicationFactory
} from '../../duuzra_types/network';

export class GetMessageLogDeltaHandler implements CommunicationHandler {
    private messageCtrl: MessengerService;

    constructor() {
        this.messageCtrl = new MessengerService();
    }

    public async processCommunication(communication: ICommunication<any>): Promise<ICommunication<any>> {
        console.log("get-message-log-delta.handler.ts processCommunication()");
        try {
            // this is optional in the spec as it will be complimented by other filers inthe future e.g. groupUuid?
            let attendeeUuid = communication.head.parameters['attendeeUuid'] || null;
            let lastReceivedMessageUuid = communication.head.parameters['lastReceivedMessageUuid'] || null;
            let senderAttendeeUuid = communication.head.parameters['senderAttendeeUuid'] || null;

            // get the log
            let messageLog = await this.messageCtrl.getMessageLogDelta(attendeeUuid, lastReceivedMessageUuid, senderAttendeeUuid);
            return Promise.resolve(CommunicationFactory.createResponse(communication, CommunicationStatuses.OK, null, messageLog));
        } catch (err) {
            return Promise.resolve(CommunicationFactory.createResponse(communication, CommunicationStatuses.Error));
        }
    }

}

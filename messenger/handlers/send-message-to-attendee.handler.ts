import { MessengerService } from './../messenger.service';
import { IMessageEnvelope } from '../../duuzra_types/messenger';
import {
    CommunicationHandler,
    ICommunication,
    CommunicationStatuses,
    CommandTypes,
    CommunicationFactory
} from '../../duuzra_types/network';

export class SendMessageToAttendeeHandler implements CommunicationHandler {
    private messageCtrl: MessengerService;

    constructor() {
        this.messageCtrl = new MessengerService();
    }

    public async processCommunication(communication: ICommunication<IMessageEnvelope>): Promise<ICommunication<any>> {
        console.log("send-message-to-attendee.handler.ts processCommunication()");
        try {
            // send the message
            await this.messageCtrl.sendMessageToAttendee(communication.body);
            return Promise.resolve(null);
        } catch (err) {
            return Promise.resolve(CommunicationFactory.createResponse(communication, CommunicationStatuses.Error));
        }
    }

}

import { MessengerService } from './../messenger.service';
import { IMessageEnvelope } from '../../duuzra_types/messenger';
import {
    CommunicationHandler,
    ICommunication,
    CommunicationStatuses,
    CommandTypes,
    CommunicationFactory
} from '../../duuzra_types/network';

export class GetMessageNotificationHandler implements CommunicationHandler {
    private messageCtrl: MessengerService;

    constructor() {
        this.messageCtrl = new MessengerService();
    }

    public async processCommunication(communication: ICommunication<any>): Promise<ICommunication<any>> {
        console.log("get-message-notification.handler.ts processCommunication()");
        try {
            // this is optional in the spec as it will be complimented by other filers inthe future e.g. groupUuid?
            const duuzraUuid = communication.head.parameters['duuzraUuid'] || null;
            const recipientAttendeeUuid = communication.head.parameters['recipientAttendeeUuid'] || null;
            const iconClick = communication.head.parameters['iconClick'] || null;
            const senderAttendeeUuid = communication.head.parameters['senderAttendeeUuid'] || null;

            // get the log
            let notificationLog = await this.messageCtrl.getMessageNotification(duuzraUuid, recipientAttendeeUuid, senderAttendeeUuid, iconClick);
            return Promise.resolve(CommunicationFactory.createResponse(communication, CommunicationStatuses.OK, null, notificationLog));
        } catch (err) {
            return Promise.resolve(CommunicationFactory.createResponse(communication, CommunicationStatuses.Error));
        }
    }

}

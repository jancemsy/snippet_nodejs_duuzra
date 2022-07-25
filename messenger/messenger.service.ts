import { System } from './../shared/system';
import { CommunicationFactory, CommandTypes, CommunicationStatuses, ServiceBusQueues } from '../duuzra_types/network';
import { MessageLogService } from './message-log/message-log.service';
import { IKeyValuePair } from '../duuzra_types/common';
import { IMessageEnvelope } from '../duuzra_types/messenger';
import { MessageMapper } from './message.mapper';
const uuid = require('uuid/v1');

export class MessengerService {
    private messageLogCtrl: MessageLogService;

    constructor() {
        this.messageLogCtrl = new MessageLogService();
    }

    public async sendMessageToAttendee(message: IMessageEnvelope): Promise<void> {
        console.log("messenger.service.ts sendMessageToAttendee()");
        // log the message in the db first
        const entry = await this.messageLogCtrl.logMessage(message.duuzraUuid, message.senderAttendeeUuid, message.recipientAttendeeUuid, message.message);

        // use the gateway service to push this message to the recipient
        if (entry) {
            // build the message

            let messageCommunication = CommunicationFactory.create(
                uuid(),
                CommunicationStatuses.OK,
                CommandTypes.app.messageSynchronisation,
                null,
                null,
                null,
                [MessageMapper.mapMessageLogEntryToMessage(entry)] // array of messages here to comform with the message sync command
            );

            // construct the relay message, this is targetted at every user on the associated duuzra
            const relayMessage = CommunicationFactory.createGatewayRelayMessage('app', message.duuzraUuid, null, message.recipientAttendeeUuid, null, messageCommunication);
            System.serviceBus.sendToQueue(ServiceBusQueues.gatewayNode.relayMessageToChannel, relayMessage);
        }

        return Promise.resolve();
    }

    public async getMessageLogDelta(attendeeUuid: string, lastReceivedMessageUuid: string = null, senderAttendeeUuid: string): Promise<IMessageEnvelope[]> {
        console.log("messenger.service.ts getMessageLogDelta()");
        const messages = await this.messageLogCtrl.getMessageLogDelta(attendeeUuid, lastReceivedMessageUuid, senderAttendeeUuid);
        if (messages && messages.length > 0) {
            return Promise.resolve(
                messages.map((x) => MessageMapper.mapMessageLogEntryToMessage(x))
            );
        } else {
            return Promise.resolve(null);
        }
    }

    public async getMessageNotification(duuzraUuid: string, recipientAttendeeUuid: string, senderAttendeeUuid: string, iconClick: boolean): Promise<any> {
        console.log("messenger.service.ts getMessageNotification()");
        let messages = await this.messageLogCtrl.getMessageNotification(duuzraUuid, recipientAttendeeUuid, senderAttendeeUuid, iconClick);
        if (messages) {
            return Promise.resolve(messages);
        } else {
            return Promise.resolve(null);
        }
    }
}

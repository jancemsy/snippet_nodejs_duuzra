import { MessageLogRepository } from './message-log.repository';
import { MessageLogEntry } from './models';
import { NotificationLogEntry } from './models';
import { IKeyValuePair } from '../../duuzra_types/common';
const uuid = require('uuid/v1');

export class MessageLogService {
    private messageRepo: MessageLogRepository;

    constructor() {
        this.messageRepo = new MessageLogRepository();
    }

    /**
     * Logs a message
     */
    public async logMessage(duuzraUuid: string, senderAttendeeUuid: string, recipientAttendeeUuid: string[], message: string): Promise<MessageLogEntry> {
        console.log("message-log.service.ts logMessage()");
        // create message entry
        try {
            const messageEntry = new MessageLogEntry(
                uuid(),
                duuzraUuid,
                senderAttendeeUuid,
                recipientAttendeeUuid,
                message
            );

            const entry = await this.messageRepo.logMessage(messageEntry);
            recipientAttendeeUuid.forEach((data) => {
                const notificationEntry = new NotificationLogEntry(
                    uuid(),
                    duuzraUuid,
                    senderAttendeeUuid,
                    data,
                    null,
                    null
                );
                const entryNotification = this.messageRepo.logNotification(notificationEntry);
            });
            // build the response
            return Promise.resolve(entry);
        } catch (err) {
            return Promise.resolve(null);
        }
    }

    /**
     * Gets the changes to a message log since the last change
     */
    public async getMessageLogDelta(attendeeUuid: string, lastReceivedMessageUuid: string = null, senderAttendeeUuid: string): Promise<MessageLogEntry[]> {
        console.log("message-log.service.ts getMessageLogDelta()");
        try {
            // get the state log
            const messageLog = await this.messageRepo.getMessageLogForRecipient(attendeeUuid, lastReceivedMessageUuid, senderAttendeeUuid);
            return Promise.resolve(messageLog || []);
        } catch (err) {
            return Promise.resolve(null);
        }
    }

     /**
     * Gets the message notification
     */
    public async getMessageNotification(duuzraUuid: string, recipientAttendeeUuid: string, senderAttendeeUuid: string, iconClick: boolean): Promise<NotificationLogEntry> {
        console.log("message-log.service.ts getMesageNotification()");
        try{
            let entryNotification = await this.messageRepo.getMessageNotification(duuzraUuid, recipientAttendeeUuid, senderAttendeeUuid, iconClick);
        // build the response
        return Promise.resolve(entryNotification);
        } catch (err){
            return Promise.resolve(null);
        }
    }

}

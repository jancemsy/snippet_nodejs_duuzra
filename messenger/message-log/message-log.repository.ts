import { IKeyValuePair } from '../../duuzra_types/common';
import { MessageLogEntry } from './models';
import { NotificationLogEntry } from './models';
import { System } from '../../shared';

export class MessageLogRepository {
    /**
     * logs a message
     */
    public async logMessage(message: MessageLogEntry): Promise<MessageLogEntry> {
        console.log("message-log.repository.ts logMessage()");
        try {
            // save the entry to the db
            const result = await System.DB.save(message) as MessageLogEntry;
            return Promise.resolve(result);
        }catch (err){
            return Promise.reject<MessageLogEntry>(err);
        }
    }

    public async logManyMessage(message: MessageLogEntry): Promise<MessageLogEntry> {
        console.log("message-log.repository.ts logManyMessages()");
        try {
            // save the entry to the db
            const result = await System.DB.save(message) as MessageLogEntry;
            return result;
            // return Promise.resolve(result);
        }catch (err){
            return Promise.reject<MessageLogEntry>(err);
        }
    }

    /**
     * Gets the delta of the message log from the reference point defined by the lastReceivedMessageUuid parameter
     */
    public async getMessageLogForRecipient(recipientAttendeeUuid: string, lastReceivedMessageUuid: string = null, senderAttendeeUuid: string): Promise<MessageLogEntry[]> {
        console.log("message-log.repository.ts getMessageLogForRecipient()");
        try {
            // get the state log from the database
            let messageLog: MessageLogEntry[] = null;
            let lastChange: MessageLogEntry;

            // if we have a supplied last change id, get all newer entries
            if (lastReceivedMessageUuid) {
                lastChange = await this.getMessageById(lastReceivedMessageUuid);
            }

            if (lastChange) {
                // we have a matching log entry
                const recentChanges = await System.DB.get(MessageLogEntry.docType, 'recipientAttendeeUuid_timeStamp', null, {
                    descending: false,
                    startkey: [recipientAttendeeUuid, lastChange.timeStamp + 1],
                    endkey: [recipientAttendeeUuid, {}]
                }) as any;

                // map the changes
                if (recentChanges && recentChanges.docs.length > 0) {
                    messageLog = recentChanges.docs as MessageLogEntry[];
                }
            } else {
                // no last message found so we need to get all entries
                const changes = await System.DB.get(MessageLogEntry.docType, 'all', null, {
                    descending: true,
                    // startkey: [recipientAttendeeUuid, senderAttendeeUuid],
                    // endkey: [senderAttendeeUuid, recipientAttendeeUuid]
                }) as any;
                if (changes && changes.docs.length > 0) {
                    messageLog = changes.docs as MessageLogEntry[];
                }
            }

            // return the values
            return Promise.resolve(messageLog);
        }catch (err){
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
            //return Promise.reject<MessageLogEntry[]>(err);
        }
    }

    /**
     * Gets a state entry by id
     */
    public async getMessageById(messageId: string): Promise<MessageLogEntry> {
        console.log("message-log.repository.ts getMesageById()");
        try {
            const result = await System.DB.get(MessageLogEntry.docType, 'id', messageId) as any;
            if (!result || result.docs.length === 0) {
                return Promise.resolve(null);
            }
            return Promise.resolve(result.docs[0] as MessageLogEntry);
        }catch (err){
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
            //return Promise.reject<MessageLogEntry>(err);
        }
    }

    public async logNotification(message: NotificationLogEntry): Promise<NotificationLogEntry> {
        console.log("message-log.repository.ts logNotification()");
        try{
            // check count
            const notification: NotificationLogEntry = message;
            let notificationLogGet = await System.DB.get('notificationLogEntry', 'recipientAttendeeUuid_duuzraUuid', [message.recipientAttendeeUuid, message.duuzraUuid]) as any;
            let flag = true, senderAttendee: NotificationLogEntry;
            notificationLogGet.docs.forEach((element) => {
                if (element.senderAttendeeUuid === message.senderAttendeeUuid){
                    flag = false;
                    senderAttendee = element;
                }
            });
            if (flag) {
                notification.count = 1;
                let result = await System.DB.save(notification) as NotificationLogEntry;
                // return Promise.resolve(result);
                return result;
            } else {
                const notification: NotificationLogEntry = senderAttendee;
                notification.count = notification.count + 1;
                notification._rev = notification._rev;
                let result = await System.DB.save(notification) as NotificationLogEntry;
                // return Promise.resolve(result);
                return result;
            }
            /* let notificationLogGet = await System.DB.get('notificationLogEntry', 'recipientAttendeeUuid_duuzraUuid',
            [message.recipientAttendeeUuid, message.duuzraUuid, message.senderAttendeeUuid]) as any;
            if(notificationLogGet && notificationLogGet.docs.length >0) {
                const notification: NotificationLogEntry = notificationLogGet.docs[0];
            notification.count = notification.count + 1;
            notification._rev = notification._rev;
            let result = await System.DB.save(notification) as NotificationLogEntry;
                return Promise.resolve(result);
            }
            else{
                // save the entry to the db
                let lastChange: NotificationLogEntry;
                let messages = message as NotificationLogEntry
                messages.count  = 1;
                let result = await System.DB.save(messages) as NotificationLogEntry;
                return Promise.resolve(result);
            } */
        }catch (err){
            return Promise.reject<NotificationLogEntry>(err);
        }
    }

    // ----------------get notification of message--------
    public async getMessageNotification(duuzraUuid: string, recipientAttendeeUuid: string, senderAttendeeUuid: string, iconClick: boolean): Promise<NotificationLogEntry> {
        console.log("message-log.repository.ts getMessageNotification()");
        try {
            const notificationLogGet = await System.DB.get('notificationLogEntry', 'recipientAttendeeUuid_duuzraUuid', [recipientAttendeeUuid, duuzraUuid]) as any;
            if (!notificationLogGet || notificationLogGet.docs.length === 0) {
                return Promise.resolve(null);
            } else {
                if (iconClick) {
                    // update notification count
                    // const notification: NotificationLogEntry = notificationLogGet.docs[0];
                    let senderAttendee: NotificationLogEntry;
                    if (notificationLogGet.docs.length > 1) {
                        notificationLogGet.docs.forEach((element) => {
                            if (element.senderAttendeeUuid === senderAttendeeUuid){
                                senderAttendee = element;
                            }
                        });
                    } else {
                        senderAttendee = notificationLogGet.docs[0] as NotificationLogEntry;
                    }
                    senderAttendee.count = 0;
                    senderAttendee._rev = senderAttendee._rev;
                    const result = await System.DB.save(senderAttendee) as NotificationLogEntry;
                    return Promise.resolve(result);
                } else {
                    // get notification count
                    return Promise.resolve(notificationLogGet.docs);
                }
            }
        }catch (err) {
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
            //return Promise.resolve(err);
        }
    };

}

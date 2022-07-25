import { MessageLogEntry } from './message-log/models/message-log-entry';
import { IMessageEnvelope } from '../duuzra_types/messenger';

export class MessageMapper {
    /**
     * Maps a message log entry to a message dto
     */
    public static mapMessageLogEntryToMessage(messageEntry: MessageLogEntry): IMessageEnvelope {
        return {
            messageUuid: messageEntry._id,
            duuzraUuid: messageEntry.duuzraUuid,
            senderAttendeeUuid: messageEntry.senderAttendeeUuid,
            recipientAttendeeUuid: messageEntry.recipientAttendeeUuid,
            message: messageEntry.message,
            timeStamp: messageEntry.timeStamp,
            iconClick: null
        }
    }
}

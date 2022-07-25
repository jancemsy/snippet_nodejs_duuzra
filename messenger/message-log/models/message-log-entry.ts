import { IDbModel } from '../../../duuzra_types/database';
import { IDuuzraNavigationPushLayer } from '../../../duuzra_types/duuzras';

export class MessageLogEntry implements IDbModel {
    public readonly _id: string;
    public readonly _rev: string;
    public readonly type: string = 'message-log-entry';

    public static readonly docType = 'messageLogEntry';

    constructor(
        id: string,
        public duuzraUuid: string,
        public senderAttendeeUuid: string,
        public recipientAttendeeUuid: string[],
        public message: string,
        public timeStamp: number = Date.now() // the date is set when a new message entry is created on the server
    ) {
        this._id = id;
    }
}

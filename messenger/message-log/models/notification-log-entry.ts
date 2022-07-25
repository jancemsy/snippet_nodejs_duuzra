import { IDbModel } from '../../../duuzra_types/database';
import { IDuuzraNavigationPushLayer } from '../../../duuzra_types/duuzras';

export class NotificationLogEntry implements IDbModel {
    public readonly _id: string;
    public _rev: string;
    public readonly type: string = 'notification-log-entry';

    public static readonly docType = 'notificationLogEntry';

    constructor(
        id: string,
        public duuzraUuid: string,
        public senderAttendeeUuid: string,
        public recipientAttendeeUuid: string,
        public count: number,
        public timeStamp: number = Date.now() // the date is set when a new message entry is created on the server
    ) {
        this._id = id;
    }
}

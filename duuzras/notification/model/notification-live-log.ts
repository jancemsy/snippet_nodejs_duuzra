import { IDbModel } from '../../../duuzra_types/database';

export class NotificationLiveLog implements IDbModel {
    public readonly _id: string;
    public readonly _rev: string;
    public readonly type: string = 'notification-live-log-entry';

    public static readonly docType = 'NotificationLiveLog';

    constructor(
        public uuid: string,
        public duuzraUuid: string,
        public name: string,
        public features: number,
        public revisions: number,
        public attendees: number,
        public version: number,
        public viewed: number,
        public dateCreated: string // the date is set when a new message entry is created on the server
    ) {
        this._id = uuid;
    }
}

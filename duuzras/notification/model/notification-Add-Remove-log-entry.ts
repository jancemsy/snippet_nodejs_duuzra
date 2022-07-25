import { IDbModel } from '../../../duuzra_types/database';
import { INotificationDetails } from './index';

export class NotificationAddRemoveLog implements IDbModel {
    public readonly _id: string;
    public readonly _rev: string;
    public readonly type: string = 'notification-add-remove-log-entry';

    public static readonly docType = 'NotificationAddRemoveLog';

    constructor(
        public uuid: string,
        public duuzraUuid: string,
        public isNotify: boolean,
        public name: string,
        public numberOfChanges: number,
        public version: number,
        public changeAdded: INotificationDetails[],
        public changeRemoved: INotificationDetails[],
        public changeUpdated: INotificationDetails[],
        public viewed: number,
        public dateCreated: string // the date is set when a new message entry is created on the server
    ) {
        this._id = uuid;
    }
}

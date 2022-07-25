import { IDbModel } from '../../../duuzra_types/database';

export interface INotificationDetails extends IDbModel {
    uuid: string;
    name: string;
    contentType: string;
    updateType?: string;
    date: string;
}

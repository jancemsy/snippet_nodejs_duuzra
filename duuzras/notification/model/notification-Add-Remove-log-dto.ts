import { INotificationDetails } from './index';

export interface NotificationAddRemoveLogDto {
    uuid: string,
    duuzraUuid: string,
    name: string,
    numberOfChanges: number,
    version: number,
    changeAdded: INotificationDetails[],
    changeRemoved: INotificationDetails[],
    changeUpdated: INotificationDetails[],
    viewed: number,
    dateCreated: string
}

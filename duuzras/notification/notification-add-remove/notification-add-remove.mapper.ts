
import { NotificationAddRemoveLog, INotificationDetails, NotificationAddRemoveLogDto } from '../model';

const uuidgen = require('uuid/v1');

export class NotificationAddRemoveMapper {

    public static getViewType() { return 'notificationAddRemoveLogEntry'; }

    public static mapToObj(notificationDoc: NotificationAddRemoveLog): NotificationAddRemoveLog {

        if (!notificationDoc.uuid) {
            notificationDoc.uuid = uuidgen();
        }

        return {
            _id: "notification-add-remove-log-entry_" + notificationDoc.uuid,
            _rev: notificationDoc._rev,
            type: 'notification-add-remove-log-entry',
            uuid: notificationDoc.uuid,
            duuzraUuid: notificationDoc.duuzraUuid,
            isNotify: notificationDoc.isNotify,
            name: notificationDoc.name,
            numberOfChanges: notificationDoc.numberOfChanges,
            version: notificationDoc.version,
            changeAdded: notificationDoc.changeAdded,
            changeRemoved: notificationDoc.changeRemoved,
            changeUpdated: notificationDoc.changeUpdated,
            viewed: 2,
            dateCreated: notificationDoc.dateCreated
        };
    }

    public static convertRawToDtoarray(notification: any): NotificationAddRemoveLogDto[]{
        let notificationArr: NotificationAddRemoveLogDto[] = [];
        if (notification && notification.length > 0){
            for (let data of notification){
                let mydata: NotificationAddRemoveLogDto = {
                    uuid: data.uuid,
                    duuzraUuid: data.duuzraUuid,
                    name: data.name,
                    numberOfChanges: data.numberOfChanges,
                    version: data.version,
                    changeAdded: data.changeAdded,
                    changeRemoved: data.changeRemoved,
                    changeUpdated: data.changeUpdated,
                    viewed: 2,
                    dateCreated: data.dateCreated
                }

                notificationArr.push(mydata);
            }
        }

        return notificationArr;
    }

}

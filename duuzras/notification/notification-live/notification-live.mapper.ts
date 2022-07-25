
import { NotificationLiveLog, NotificationLiveLogDto } from '../model';

import { DateFormatter } from '../../../duuzra_types/common';

const uuidgen = require('uuid/v1');

export class NotificationLiveMapper {

    public static getViewType() { return 'notificationLiveLogEntry'; }

    public static convertToNotificationLive(notificationDoc: NotificationLiveLog): NotificationLiveLog {

        if (!notificationDoc.uuid) {
            notificationDoc.uuid = uuidgen();
        }
        let DateNow = new Date();
        let time: string = DateNow.getHours().toString() + ":" + DateNow.getMinutes().toString() + ":" + DateNow.getSeconds().toString();

        // let myDate = DateNow.getFullYear().toString() + "-" + (DateNow.getMonth()+1).toString() + "-" + (DateNow.getDay()-2).toString() + " " + time;

        let myDate = new DateFormatter(null).toString();

        return {
            _id: "notification-live-log-entry_" + notificationDoc.uuid,
            _rev: undefined,
            type: 'notification-live-log-entry',
            uuid: notificationDoc.uuid,
            duuzraUuid: notificationDoc.duuzraUuid,
            name: notificationDoc.name,
            features: notificationDoc.features,
            revisions: notificationDoc.revisions,
            attendees: notificationDoc.attendees,
            version: notificationDoc.version,
            viewed: 2,
            dateCreated: myDate
        };
    }

    public static convertRawToDtoarray(notificationLive: any): NotificationLiveLogDto[] {
        let mynotificationArr: NotificationLiveLogDto[] = [];
        for (let data of notificationLive){
            let mydata: NotificationLiveLogDto = {
                uuid: data.uuid,
                duuzraUuid: data.duuzraUuid,
                name: data.name,
                features: data.features,
                revisions: data.revisions,
                attendees: data.attendees,
                version: data.version,
                viewed: data.viewed,
                dateCreated: data.dateCreated
            }
            mynotificationArr.push(mydata);
        }

        return mynotificationArr;
    }

}

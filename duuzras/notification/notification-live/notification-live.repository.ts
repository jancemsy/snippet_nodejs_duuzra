import { NotificationLiveLog, NotificationLiveLogDto } from '../model';

import { System } from '../../../shared';

import { NotificationLiveMapper } from './notification-live.mapper';

import { SnapshotInfoRepository, ISnapshotInfoRepository } from '../../snapshot-info/snapshot-info.repository';

export abstract class INotificationLiveRepository {
    public abstract async getNotificationLive(userUuid: string): Promise<NotificationLiveLogDto[]>;
    public abstract async createNotification(userUuid: string, clientUuid: string, notification: NotificationLiveLog): Promise<NotificationLiveLog>;
    public abstract async deleteNotification(userUuid: string, clientUuid: string, uuid: string): Promise<NotificationLiveLog>;
    public abstract async updateNotification(userUuid: string, clientUuid: string, notification: NotificationLiveLog): Promise<NotificationLiveLog>;
}

export class NotificationLiveRepository implements INotificationLiveRepository {
    private readonly objectName = NotificationLiveMapper.getViewType();
    private snapshotrepo: ISnapshotInfoRepository;

    constructor() {
        this.snapshotrepo = new SnapshotInfoRepository();
    }

    public async getNotificationLive(userUuid: string): Promise<NotificationLiveLogDto[]> {
        console.log("notification-live.repository.ts getNotificationLive()");
        try {
            let duuzraSnapshotInfo = await this.snapshotrepo.getInfosByAuthUser(userUuid);
            let notificationArr = []; 
            if (duuzraSnapshotInfo) {
                for (let snapshot of duuzraSnapshotInfo) {
                    if (snapshot.isActive && snapshot.duuzraUuid) {
                        let rawNotificationLIve = await System.DB.get('notificationLiveLogEntry', 'duuzraUuid', snapshot.duuzraUuid) as any;
                        rawNotificationLIve = rawNotificationLIve.docs;
                        if (rawNotificationLIve.length > 0) {
                            for (let data of rawNotificationLIve) {
                                notificationArr.push(data);
                            }
                        }
                    }
                }

                let mynotificationLive: NotificationLiveLogDto[] = await NotificationLiveMapper.convertRawToDtoarray(notificationArr);

                if (mynotificationLive && mynotificationLive.length > 0) {
                    return Promise.all(mynotificationLive);
                } else {
                    return Promise.resolve(null);
                }
            } else {
                return Promise.resolve(null);
            }

        } catch (err) { 
            return Promise.reject<NotificationLiveLogDto[]>(err);
        }
    }

    public async createNotification(userUuid: string, clientUuid: string, snapshotDto: NotificationLiveLog): Promise<NotificationLiveLog> {
        console.log("notification-live.repository.ts createNotification()");
        try {
            let notification = NotificationLiveMapper.convertToNotificationLive(snapshotDto);
            let result = await System.DB.save(notification);
            return null;
        } catch (err) {
            return Promise.reject<NotificationLiveLog>(err);
        }
    }

    public async updateNotification(userUuid: string, clientUuid: string, info: NotificationLiveLog): Promise<NotificationLiveLog> {
        console.log("notification-live.repository.ts updateNotification()");
        return null;
    }

    public async deleteNotification(userUuid: string, clientUuid: string, uuid: string): Promise<NotificationLiveLog> {
        console.log("notification-live.repository.ts deleteNotification()");
        return null;
    }
}

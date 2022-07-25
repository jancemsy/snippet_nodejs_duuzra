import { NotificationAddRemoveLog, NotificationAddRemoveLogDto } from '../model';

import { System } from '../../../shared';

import { NotificationAddRemoveMapper } from './notification-add-remove.mapper';

import { ISnapshotInfoRepository, SnapshotInfoRepository } from '../../snapshot-info/snapshot-info.repository';

import { EmailService, IEmailService } from '../../../shared/email/email-service';

import { DateFormatter } from '../../../duuzra_types/common';

export abstract class INotificationAddRemoveRepository {
    public abstract async getNotifcation(userUuid: string): Promise<NotificationAddRemoveLogDto[]>;
    public abstract async createNotification(duuzraUuid: string, clientUuid: string, mynotification: NotificationAddRemoveLog): Promise<NotificationAddRemoveLog>;
    public abstract async deleteNotification(duuzraUuid: string, clientUuid: string, notification: NotificationAddRemoveLog): Promise<NotificationAddRemoveLog>;
    public abstract async updateNotification(duuzraUuid: string, clientUuid: string, mynotification: NotificationAddRemoveLog, superUsers?: any): Promise<NotificationAddRemoveLog>;
}

export class NotificationAddRemoveRepository implements INotificationAddRemoveRepository {
    private readonly objectName = NotificationAddRemoveMapper.getViewType();
    private snapshotinforepo: ISnapshotInfoRepository;
    private emailService: IEmailService;

    private monthStr: string[] = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
    ];

    constructor() {
        this.snapshotinforepo = new SnapshotInfoRepository();
        this.emailService = new EmailService();
    }

    public async getNotifcation(userUuid: string): Promise<NotificationAddRemoveLogDto[]> {
        console.log("notification-add-remove.repository.ts getNOtification()");
        try {

            let duuzraSnapshotInfo = await this.snapshotinforepo.getInfosByAuthUser(userUuid);
            let notificationArr = [];

            if (duuzraSnapshotInfo) {
                for (let snapshot of duuzraSnapshotInfo) {
                    if (snapshot.isActive && snapshot.duuzraUuid) {
                        let rawNotificationAddRem = await System.DB.get('notificationAddRemoveLogEntry', 'duuzraUuid', snapshot.duuzraUuid) as any;
                        rawNotificationAddRem = rawNotificationAddRem.docs;
                        if (rawNotificationAddRem) {
                            for (let data of rawNotificationAddRem) {
                                if (data.isNotify) {
                                    notificationArr.push(data);
                                }
                            }
                        }
                    }
                }

                const mynotificationAddRem: NotificationAddRemoveLogDto[] = await NotificationAddRemoveMapper.convertRawToDtoarray(notificationArr);

                if (mynotificationAddRem && mynotificationAddRem.length > 0) {
                    return Promise.all(mynotificationAddRem);
                } else {
                    return Promise.resolve(null);
                }
            } else {
                return Promise.resolve(null);
            }
        } catch (err) { 
        }
    }

    public async createNotification(duuzraUuid: string, clientUuid: string, mynotification: NotificationAddRemoveLog): Promise<NotificationAddRemoveLog> { 
        console.log("notification-add-remove.repository.ts CreateNotification()");
        try { 
            let notification = NotificationAddRemoveMapper.mapToObj(mynotification); 
            if (notification.changeAdded.length > 0 || notification.changeRemoved.length > 0 || notification.changeUpdated.length > 0) {
                // this.deleteNotification(duuzraUuid, clientUuid, currentNotification);
                let result = await System.DB.save(notification);

                return null;
            }
        } catch (err) {
            return Promise.reject<NotificationAddRemoveLog>(err);
        }
    }

    public async updateNotification(duuzraUuid: string, clientUuid: string, mynotification: NotificationAddRemoveLog, superUsers?: any): Promise<NotificationAddRemoveLog> { 
        try { 
            let NotificationAddRemDoc: any;
            let currentNotification: any;
            let latestVersionsnaphot = await System.DB.get('duuzraSnapshot', 'duuzraUuid', duuzraUuid) as any;
            let mybol: boolean = false;
            latestVersionsnaphot = latestVersionsnaphot.docs; 
            if (latestVersionsnaphot) {
                for (let latest of latestVersionsnaphot) {
                    if (latest.isActive) {
                        mybol = true;
                    }
                }
            }

            if (mybol) { 
                NotificationAddRemDoc = await System.DB.get('notificationAddRemoveLogEntry', 'duuzraUuid', duuzraUuid) as any;
                NotificationAddRemDoc = NotificationAddRemDoc.docs;

                if (NotificationAddRemDoc) {
                    for (let data of NotificationAddRemDoc) {
                        if (!data.isNotify) {  
                            currentNotification = data;
                        }
                    }

                    if (currentNotification) {  
                        let changesCount: number = 0;
                        if (mynotification) { 
                            currentNotification.name = mynotification.name;
                            currentNotification.isNotify = mynotification.isNotify; 
                            currentNotification.version = mynotification.version;
                            for (let data of mynotification.changeAdded) {
                                currentNotification.changeAdded.push(data);
                            }
                            for (let data of mynotification.changeRemoved) {
                                currentNotification.changeRemoved.push(data);
                            }
                            for (let data of mynotification.changeUpdated) {
                                currentNotification.changeUpdated.push(data);
                            }

                            changesCount = currentNotification.changeUpdated.length + currentNotification.changeRemoved.length + currentNotification.changeAdded.length;
                        }
                        currentNotification.numberOfChanges = changesCount;
                        currentNotification.dateCreated = mynotification.dateCreated;

                        if (currentNotification.isNotify) {
                            if (currentNotification.changeAdded.length > 0 || currentNotification.changeRemoved.length > 0 || currentNotification.changeUpdated.length > 0) { 
                                await System.DB.save(currentNotification);
                            }
                        } else {
                            await System.DB.save(currentNotification);
                        }

                        if (currentNotification.isNotify) {
                            await this.sendEmailNotification(currentNotification.name, currentNotification, superUsers);
                        } 
                        Promise.resolve(true);
                    } else { 
                        await this.createNotification(duuzraUuid, clientUuid, mynotification);
                    }
                }
            }

            return Promise.resolve(null);
        } catch (err) {
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
            //return Promise.reject<NotificationAddRemoveLog>(err);
        }
    }

    private async sendEmailNotification(duuzraName: string, notification: NotificationAddRemoveLog, superUsers: any) {
        try {
            let DateNow = new Date();
            let message: string;
            let title: string;
            let addedFeatureStr: string;
            let removedFeaturestr: string;
            let updateddFeaturestr: string;

            notification.changeAdded.forEach((data, i, ss) => {
                addedFeatureStr += (i + 1) + ". Name: " + data.name + "<br>" + "Type: " + data.contentType + "<br>";
            });

            notification.changeRemoved.forEach((data, i, ss) => {
                removedFeaturestr += (i + 1) + ". Name: " + data.name + "<br>" + "Type: " + data.contentType + "<br>";
            });

            notification.changeUpdated.forEach((data, i, ss) => {
                updateddFeaturestr += (i + 1) + ". Name: " + data.name + "<br>" + "Type: " + data.contentType + "<br>" + "Type: " + data.updateType;
            });

            let time: string = DateNow.getHours().toString() + ":" + DateNow.getMinutes() + " am";

            if (DateNow.getHours() > 12) {
                time = (DateNow.getHours() - 12) + ":" + DateNow.getMinutes() + " pm";
            }

            let myDate = (DateNow.getDay() - 2).toString() + "/" + this.monthStr[DateNow.getMonth()] + "/" + DateNow.getFullYear() + " " + time;

            // send the notification to the super user if that super user is in the duuzra
            if (superUsers.length > 0) {
                for (let attendee of superUsers) {
                    if (attendee.permissions.canReceiveNotificationDuuzraLive) {

                        message = "<strong>Name: " + duuzraName + "</strong><br>" +
                            "Date Changed: " + myDate + "<br>" +
                            "Number of Changes: " + notification.numberOfChanges + "<br><br>" +
                            "Active version: " + notification.version + "<br><br>" +
                            "<strong>Added:</strong><br>" + addedFeatureStr + "<br><br>" +
                            '<strong style="color: red;">Removed:</strong><br>' + removedFeaturestr + "<br><br>" +
                            '<strong style="color: #4990E1;">Updated:</strong><br>' + updateddFeaturestr;
                        title = "Notice of changes in " + duuzraName;
                    }
                }
            }

            let recipient = "cat@duuzra.com"; 
            let subject = title;
            let content = message;
            let recipientName = duuzraName;
            return await this.emailService.send(recipient, subject, content, recipientName);
        } catch (err) { 
        }

    }

    public async deleteNotification(duuzraUuid: string, clientUuid: string, notification: NotificationAddRemoveLog): Promise<NotificationAddRemoveLog> {
        console.log("notification-add-remove.repository.ts DeleteNotification()");
        try {
            let result = await System.DB.delete(notification);

            Promise.resolve(true);
        } catch (err) {
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
            //return Promise.reject<NotificationAddRemoveLog>(err);
        }
    }
}

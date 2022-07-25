import { IAuthClaimDto } from '../../duuzra_types/auth';
import { DateFormatter } from '../../duuzra_types/common';
import { IAttendeePermissionsDto, IGroupDto } from '../../duuzra_types/duuzras';
import { CommandTypes, CommunicationFactory, CommunicationVerb, ICommunication, ServiceBusQueues, WsChannels } from '../../duuzra_types/network'
import { IDuuzraAttendeeDoc } from '../../models/duuzra-attendee-doc';
import { IDuuzraDoc } from '../../models/duuzra-duuzra-doc';
import { IDuuzraGroupDoc } from '../../models/duuzra-group-doc';
import { System } from '../../shared';
import { GroupMapper } from './group.mapper';

export abstract class IGroupRepository {
    public abstract async getGroupsByDuuzra(duuzraUuid: string): Promise<IGroupDto[]>
    public abstract async getGroupByUuid(duuzraUuid: string, id: string): Promise<IGroupDto>;
    public abstract async createGroup(duuzraUuid: string, groups: IGroupDto, options?: any): Promise<IGroupDto>;
    public abstract async createMultipleGroup(duuzraUuid: string, group: IGroupDto[], options?: any): Promise<IGroupDto[]>;
    public abstract async deleteGroup(duuzraUuid: string, groupUuid: string): Promise<IGroupDto>;
    public abstract async deleteManyGroup(duuzraUuid: string, groupUuids: string[]): Promise<IGroupDto[]>
    public abstract async updateGroup(
        duuzraUuid: string,
        group: IGroupDto,
        addAdminPermissionCallback: (clientUuid: string, authUuid: string) => void,
        removeAdminPermissionCallback: (clientUuid: string, authUuid: string) => void
    ): Promise<IGroupDto>;
}

export class GroupRepository implements IGroupRepository {
    private readonly objectName = GroupMapper.getViewType();

    constructor() { }
 
 
    public async createGroup(duuzraUuid: string, group: IGroupDto): Promise<IGroupDto> {
        console.log("group.repository.ts createGroup()");

        try {
            if (group.uuid) {
                return Promise.reject<IGroupDto>({ status: 400, message: 'Group has uuid - create not permitted' });
            }

            let attendeeGet = await System.DB.get('duuzraAttendee', 'all') as any;
            let groupbol = true;
            let attendees = [];

            // this check if it is from add single group
            if (group.groupAttendeeUuids !== null){
                for (let mygroup of group.groupAttendeeUuids){
                    if (mygroup === "thisIsAddGroup"){
                        groupbol = false;
                    }
                }
            }

            if (attendeeGet.docs.length > 0) {
                for (let i = attendeeGet.docs.length - 1; i >= 0 ; i--) {
                    let isPresent = false;
                    for (let j = attendees.length - 1; j >= 0 ; j--) {
                        if (attendees[j].authUuid === attendeeGet.docs[i].authUuid) {
                            isPresent = true;
                            break;
                        }
                    }

                    if (!isPresent) {
                        attendees.push(attendeeGet.docs[i]);
                    }
                }
            }
 
            if (!group.groupPermissions) {
                group.groupPermissions = {
                    appMasterEnabled: false,
                    appMessagingEnabled: false,
                    appNotesEnabled: false,
                    appQuestionsEnabled: false,
                    cmsAnalyticsEnabled: false,
                    cmsEditEnabled: false,
                    cmsSharingEnabled: false,
                    canSubmitQuestionAsAnnonymous: false,
                    canReceiveNotificationDuuzraLive: false,
                    canReceiveNotificationContentAddRemove: false
                };
            }

            group.groupAttendeeUuids = [];

            if (groupbol){  
                for (let i = 0; i < attendees.length; i++) { 
                    group.groupAttendeeUuids.push(attendees[i].authUuid);
                }
            }
 
            let groupDoc = GroupMapper.mapToDoc(group); 
            let couchGet = await System.DB.get('duuzraDuuzra', 'id', 'duuzra-duuzra_' + duuzraUuid) as any; 
            if (couchGet.docs.length === 1) { 
                let duuzraDoc = couchGet.docs[0]; 
                duuzraDoc.groups = duuzraDoc.groups || [];  
                duuzraDoc.attendees = attendees; 
                const defaultGroup = duuzraDoc.groups.find((grp) => grp.isDefault); 
                if (defaultGroup) {
                    groupDoc.groupPermissions = { ...defaultGroup.groupPermissions }
                } 
                duuzraDoc.groups.push(groupDoc);  
                let couchResponse = await System.DB.save(duuzraDoc);
            } else { 
                return Promise.reject<IGroupDto>(null);
            } 
            return Promise.resolve(this.buildDto(groupDoc, duuzraUuid));
        } catch (err) { 
            return Promise.reject<IGroupDto>(err);
        }
    }

    public async createMultipleGroup(duuzraUuid: string, groups: IGroupDto[], options?: any): Promise<IGroupDto[]>{
        console.log("group.repository.ts createMultipleGroup()");
        try{
            let couchGet = await System.DB.get('duuzraDuuzra', 'id', 'duuzra-duuzra_' + duuzraUuid) as any; 
            if (couchGet.docs.length === 1) {
                let duuzraDoc = couchGet.docs[0];
                duuzraDoc.groups = duuzraDoc.groups || [];

                let groupDtos = [];
                groups.forEach(async (group) => { 
                    try {
                        if (group.groupName.replace(/\s/g, '').split(' ')[0]){ 
                            if (!group.groupPermissions) {
                                group.groupPermissions = {
                                    appMasterEnabled: false,
                                    appMessagingEnabled: false,
                                    appNotesEnabled: false,
                                    appQuestionsEnabled: false,
                                    cmsAnalyticsEnabled: false,
                                    cmsEditEnabled: false,
                                    cmsSharingEnabled: false,
                                    canSubmitQuestionAsAnnonymous: false,
                                    canReceiveNotificationDuuzraLive: false,
                                    canReceiveNotificationContentAddRemove: false
                                };
                            }
                            for (let i = 0; i < options.attendees.length; i++) {
                                if (options.attendees[i].group === group.groupName) {
                                    group.groupAttendeeUuids.push(options.attendees[i].attendeeUuid);
                                }
                            }
                            group.groupName = group.groupName.trim();
                            let groupDoc = GroupMapper.mapToDoc(group);
                            let isPresent = false;
                            duuzraDoc.groups.forEach((duzzraGroup) => {
                                if (duzzraGroup.groupName === groupDoc.groupName) {
                                    groupDoc.groupAttendeeUuids.forEach((item) => {
                                        if (duzzraGroup.groupAttendeeUuids.indexOf(item) < 0) {
                                            duzzraGroup.groupAttendeeUuids.push(item)
                                        }
                                    });
                                    isPresent = true;
                                }
                            });
                            if (!isPresent) {
                                duuzraDoc.groups.push(groupDoc);
                                groupDtos.push(this.buildDto(groupDoc, duuzraUuid));
                            }
                        }
                    }catch (err) { 
                        return Promise.reject<IGroupDto[]>(null);
                    }
                });
                let couchResponse = await System.DB.save(duuzraDoc);
                return Promise.resolve<IGroupDto[]>(groupDtos);
            } else { 
                return Promise.reject<IGroupDto[]>(null);
            }
        }catch (err){
            return Promise.reject<IGroupDto[]>(null);
        }
    }
 
    public async deleteGroup(duuzraUuid: string, groupUuid: string): Promise<IGroupDto> { 
        console.log("group.repository.ts deleteGroup()");
        try { 
            let deletedArr = null; 
            let couchGet = await System.DB.get('duuzraDuuzra', 'id', 'duuzra-duuzra_' + duuzraUuid) as any; 
            if (couchGet.docs.length === 1) { 
                let duuzraDoc = couchGet.docs[0];
                let found = duuzraDoc.groups.find((x, i, arr) => {
                    if (x.uuid === groupUuid) {
                        if (x.isDefault) {
                            deletedArr = [];
                        } else {
                            deletedArr = duuzraDoc.groups.splice(i, 1);
                        }
                        return true;
                    } else {
                        return false;
                    }
                });

                if (found) { 
                    let couchResponse = await System.DB.save(duuzraDoc); 
                    if (deletedArr.length > 0) {
                        return Promise.resolve(this.buildDto(deletedArr[0], duuzraUuid));
                    } else {
                        return Promise.resolve(null);
                    }
                } else { 
                    return Promise.reject<IGroupDto>(null);
                } 
            } else { 
                return Promise.reject<IGroupDto>(null);
            } 
        } catch (err) { 
            return Promise.reject<IGroupDto>(err);
        }
    }
 
    public async updateGroup(
        duuzraUuid: string,
        group: IGroupDto,
        addAdminPermissionCallback: (clientUuid: string, authUuid: string) => void,
        removeAdminPermissionCallback: (clientUuid: string, authUuid: string) => void
    ): Promise<IGroupDto> {
        console.log("group.repository.ts updateGroup()");
        try { 
            const updatedGroupDoc = GroupMapper.mapToDoc(group); 
            let couchGet = await System.DB.get('duuzraDuuzra', 'id', 'duuzra-duuzra_' + duuzraUuid) as any; 
            if (couchGet.docs.length === 1) { 
                const duuzraDBDoc: IDuuzraDoc = couchGet.docs[0]; 
                let foundDBGroupDoc: IDuuzraGroupDoc = null;
                let foundDBGroupDocIndex: number = null; 
                const found = duuzraDBDoc.groups.find((x: IDuuzraGroupDoc, i, arr) => {
                    if (x.uuid === group.uuid) {
                        foundDBGroupDoc = x;
                        foundDBGroupDocIndex = i;
                        return true;
                    }
                });

                if (found) { 
                    const groupPermissionChanged = JSON.stringify(group.groupPermissions) !== JSON.stringify(foundDBGroupDoc.groupPermissions);
                    let adminPermissionAdded: boolean = false;
                    let adminPermissionRemoved: boolean = false;
                    if (groupPermissionChanged) {
                        const adminOnNew =
                            group.groupPermissions.cmsAnalyticsEnabled ||
                            group.groupPermissions.cmsEditEnabled ||
                            group.groupPermissions.cmsSharingEnabled;

                        const adminOnOriginal =
                            foundDBGroupDoc.groupPermissions.cmsAnalyticsEnabled ||
                            foundDBGroupDoc.groupPermissions.cmsEditEnabled ||
                            foundDBGroupDoc.groupPermissions.cmsSharingEnabled;

                        adminPermissionAdded = !adminOnOriginal && adminOnNew;
                        adminPermissionRemoved = adminOnOriginal && !adminOnNew;
                    } 
                    updatedGroupDoc.dateCreated = foundDBGroupDoc.dateCreated;
                    updatedGroupDoc.createdBy = foundDBGroupDoc.createdBy; 
                    duuzraDBDoc.groups.splice(foundDBGroupDocIndex, 1, updatedGroupDoc);

                    if (updatedGroupDoc.groupAttendeeUuids) {
                        for (const attendeeUuid of updatedGroupDoc.groupAttendeeUuids) {
                            const dbAttendeeFound = duuzraDBDoc.attendees.find((att) => att.uuid === attendeeUuid); 

                            if (!foundDBGroupDoc.groupAttendeeUuids || foundDBGroupDoc.groupAttendeeUuids.indexOf(attendeeUuid) === -1) { 
                                if (attendeeUuid === duuzraDBDoc.info.creator){
                                    dbAttendeeFound.permissions.appMasterEnabled = true;
                                    dbAttendeeFound.permissions.appMessagingEnabled = true;
                                    dbAttendeeFound.permissions.appNotesEnabled = true;
                                    dbAttendeeFound.permissions.appQuestionsEnabled = true;
                                    dbAttendeeFound.permissions.canSubmitQuestionAsAnnonymous = true;
                                    dbAttendeeFound.permissions.cmsAnalyticsEnabled = true;
                                    dbAttendeeFound.permissions.cmsEditEnabled = true;
                                    dbAttendeeFound.permissions.cmsSharingEnabled = true;
                                } else {
                                    dbAttendeeFound.permissions = updatedGroupDoc.groupPermissions;
                                }

                            }
                             
                            if (groupPermissionChanged) { 
                                const groupAttendee = duuzraDBDoc.attendees.find((att) => att.uuid === attendeeUuid); 
                                if (attendeeUuid === duuzraDBDoc.info.creator){
                                    groupAttendee.permissions.appMasterEnabled = true;
                                    groupAttendee.permissions.appMessagingEnabled = true;
                                    groupAttendee.permissions.appNotesEnabled = true;
                                    groupAttendee.permissions.appQuestionsEnabled = true;
                                    groupAttendee.permissions.canSubmitQuestionAsAnnonymous = true;
                                    groupAttendee.permissions.cmsAnalyticsEnabled = true;
                                    groupAttendee.permissions.cmsEditEnabled = true;
                                    groupAttendee.permissions.cmsSharingEnabled = true;
                                } else {
                                    groupAttendee.permissions = updatedGroupDoc.groupPermissions;
                                }
 
                                if (adminPermissionAdded) {  
                                    addAdminPermissionCallback(duuzraDBDoc.clientUuid, dbAttendeeFound.authUuid);
                                }
 
                                if (adminPermissionRemoved) { 
                                    const administratorOf: any = await System.DB.get('duuzraDuuzra', 'administratorUuid', dbAttendeeFound.authUuid) 
                                    if (administratorOf.docs && administratorOf.docs.length === 1) {
                                        removeAdminPermissionCallback(duuzraDBDoc.clientUuid, dbAttendeeFound.authUuid);
                                    }
                                }
                            }

                        }
                    }
                }

                if (found) {
                    const couchResponse = await System.DB.save(duuzraDBDoc);
                    return Promise.resolve(this.buildDto(updatedGroupDoc, duuzraUuid));
                } else { 
                    return Promise.reject<IGroupDto>(null);
                } 
            }  
        } catch (err) { 
            return Promise.reject<IGroupDto>(err);
        }
    }

    public async deleteManyGroup(duuzraUuid: string, groupUuids: string[]): Promise<IGroupDto[]> {
        console.log("group.repository.ts deleteManyGroup()");
        try { 
            const couchGet = await System.DB.get('duuzraDuuzra', 'id', 'duuzra-duuzra_' + duuzraUuid) as any; 
            let document: IDuuzraDoc;
            if (couchGet && couchGet.docs && couchGet.docs.length !== 1) {
                return Promise.reject<IGroupDto[]>('deleteManyGroup - duuzra document returned 0 or multiple documents');
            } else {
                document = couchGet.docs[0];
            }
 
            const deletedAttendeesDocs = [];
            groupUuids.forEach((grpUuid) => {
                let mygrp = document.groups.filter((grp) => grp.uuid === grpUuid);
                mygrp.forEach((data) => {
                    if (data) {
                        deletedAttendeesDocs.push(this.buildDto(data, duuzraUuid))
                    }
                }); 
            });
 
            groupUuids.forEach((grpUuid) => {
                document.groups.forEach((grp, i) => {
                    if (grp.uuid === grpUuid){
                        document.groups.splice(i, 1);
                    }
                });
            });
 
            const couchResponse = await System.DB.save(document); 
            return Promise.resolve(deletedAttendeesDocs); 
        } catch (err) { 
            return Promise.reject<IGroupDto[]>(err);
        }
    }



    public async getGroupsByDuuzra(duuzraUuid: string): Promise<IGroupDto[]> {
        console.log("group.repository.ts getGroupsByDuuzra()");
        try {
            let duuzraDocId = 'duuzra-duuzra_' + duuzraUuid;
            let rawGroups = await System.DB.get(this.objectName, 'duuzraId', duuzraDocId) as any;
            if (rawGroups && rawGroups.docs.length === 1) {

                // Fill out with media
                let groupDtosPromises: Promise<IGroupDto>[] = [];
                rawGroups.docs[0].forEach((groupDoc) => {
                    groupDtosPromises.push(
                        this.buildDto(groupDoc, duuzraUuid)
                    );
                });

                return Promise.all(groupDtosPromises);
            } else {
                return Promise.resolve(null);
            }
        } catch (err) { 
            return Promise.reject<IGroupDto[]>(err);
        }
    }
 
    public async getGroupByUuid(duuzraUuid: string, groupUuid: string): Promise<IGroupDto> {
        console.log("group.repository.ts getGroupByUuid()");
        try {
            let rawGroups = await System.DB.get(this.objectName, 'uuid', groupUuid) as any;
            if (rawGroups && rawGroups.docs.length === 1) {
                return Promise.resolve(
                    this.buildDto(rawGroups.docs[0], duuzraUuid)
                );
            } else {
                return Promise.resolve(null);
            }
        } catch (err) { 
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
            //return Promise.reject<IGroupDto>(err);
        }
    }

    private async buildDto(groupDoc: IDuuzraGroupDoc, duuzraUuid: string): Promise<IGroupDto> {
        console.log("group.repository.ts buildDto()");
        return new Promise<IGroupDto>((resolve, reject) => {
            resolve(GroupMapper.mapToObj(groupDoc, duuzraUuid))
        });
    }
 

}

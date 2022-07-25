import { IAuthUserDto } from '../../duuzra_types/auth';
import { IDuuzraGroupDoc } from '../../models/duuzra-group-doc';
import { System } from '../../shared';
import { AttendeeMapper } from './attendee.mapper';
import { IAttendeeDto, IAttendeePermissionsDto } from '../../duuzra_types/duuzras';
import { IDuuzraAttendeeDoc } from '../../models/duuzra-attendee-doc';
import { IDuuzraDoc } from '../../models/duuzra-duuzra-doc';
import { CommunicationFactory, ICommunication, ServiceBusQueues, WsChannels } from '../../duuzra_types/network';
import { IAuthUserDoc } from '../../models/auth-user-doc';

export abstract class IAttendeeRepository {

    public abstract async getAttendeesByDuuzra(authToken: string, correlationId: string, clientUuid: string, duuzraUuid: string): Promise<IAttendeeDto[]>;
    public abstract async getAttendeeByUuid(authToken: string, correlationId: string, clientUuid: string, duuzraUuid: string, id: string): Promise<IAttendeeDto>;
    public abstract async createAttendee(authToken: string, correlationId: string, clientUuid: string, duuzraUuid: string, content: IAttendeeDto): Promise<IAttendeeDto>;
    public abstract async createAttendees(authToken: string, correlationId: string, clientUuid: string, duuzraUuid: string, content: IAttendeeDto[]): Promise<IAttendeeDto[]>;
    public abstract async deleteAttendee(authToken: string, correlationId: string, clientUuid: string, duuzraUuid: string, uuid: string): Promise<IAttendeeDto>;
    public abstract async deleteAttendees(authToken: string, correlationId: string, clientUuid: string, duuzraUuid: string, uuid: string[]): Promise<IAttendeeDto[]>;
    public abstract async updateAttendee(
        authToken: string,
        correlationId: string,
        clientUuid: string,
        duuzraUuid: string,
        content: IAttendeeDto,
        addAdminPermissionCallback: (clientUuid: string, authUuid: string) => void,
        removeAdminPermissionCallback: (clientUuid: string, authUuid: string) => void): Promise<IAttendeeDto>;
}

export class AttendeeRepository implements IAttendeeRepository {
    private readonly objectName = AttendeeMapper.getViewType();
    private superUserlist: string[] = [
        "demo1@duuzra.com",
        "demo2@duuzra.com",
        "demo3@duuzra.com"
    ];

    constructor() {
    } 

    public async getAttendeesByDuuzra(authToken: string, correlationId: string, clientUuid: string, duuzraUuid: string): Promise<IAttendeeDto[]> {
        console.log("attendee.repository.ts getAttendeesByDuuzra()");
        try {
            const duuzraDocId = 'duuzra-duuzra_' + duuzraUuid;
            const rawContents = await System.DB.get(this.objectName, 'duuzraId', duuzraDocId) as any;
            if (rawContents && rawContents.docs.length > 0) { 
                const attendeePromises = [];
                if (rawContents.docs) {

                    rawContents.docs.forEach((attendeeDoc: IDuuzraAttendeeDoc) => {
                        attendeePromises.push(this.buildDto(authToken, correlationId, attendeeDoc, duuzraUuid));
                    });
                } 
                return Promise.all(attendeePromises); 
            } else {
                return Promise.resolve(null);
            }
        } catch (err) { 
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
            //return Promise.reject<IAttendeeDto[]>(err);
        }
    }
 
    public async getAttendeeByUuid(authToken: string, correlationId: string, clientUuid: string, duuzraUuid: string, attendeeUuid: string): Promise<IAttendeeDto> {
        console.log("attendee.repository.ts getAttendeesByUuid()");
        try { 
            const rawContents = await System.DB.get('duuzraAttendee', 'uuid', attendeeUuid) as any;
            if (rawContents && rawContents.docs.length === 1) {
                return Promise.resolve(
                    this.buildDto(authToken, correlationId, rawContents.docs[0], duuzraUuid)
                );
            } else {
                return Promise.resolve(null);
            }
        } catch (err) { 
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
            //return Promise.reject<IAttendeeDto>(err);
        }
    }

    private async buildDto(authToken, correlationId, attendeeDoc, duuzraUuid): Promise<IAttendeeDto> { 
        console.log("attendee.repository.ts buildDto()");
        return new Promise<IAttendeeDto>((resolve, reject) => { 
            try{
                if (authToken && correlationId) { 
                    const getAuthUserCommand = CommunicationFactory.create<any>(correlationId, null, null, authToken, 'Duuzra-Attendee-Service', {
                        uuid: attendeeDoc.authUuid
                    }); 
                    const expandDataPromise = System.serviceBus.sendToQueue(ServiceBusQueues.authNode.user, getAuthUserCommand);
                    expandDataPromise.then((authUserResponse: ICommunication<IAuthUserDto>) => {
                        const authUserDto = authUserResponse.body as IAuthUserDto; 
                        const getAuthUserCommandForCreator = CommunicationFactory.create<any>(correlationId, null, null, authToken, 'Duuzra-Attendee-Service', {
                            uuid: authUserDto.createdBy
                        });

                        const expandDataPromiseCreator = System.serviceBus.sendToQueue(ServiceBusQueues.authNode.user, getAuthUserCommandForCreator);

                        expandDataPromiseCreator.then((authUserResponse: ICommunication<IAuthUserDto>) => {
                            const myauthUserDto = authUserResponse.body as IAuthUserDto;
                            if (myauthUserDto){
                                let firstname = "";
                                let lastname = "";
                                let name = null;

                                firstname = myauthUserDto.firstname;
                                lastname = myauthUserDto.lastname;

                                if (myauthUserDto.firstname !== undefined || myauthUserDto.lastname !== undefined){
                                    name = firstname + " " + lastname;
                                }

                                authUserDto.createdBy = name;
                            }
                            resolve(AttendeeMapper.mapToObj(attendeeDoc, authUserDto, duuzraUuid));

                        });

                    })
                } else {
                    resolve(AttendeeMapper.mapToObj(attendeeDoc, null, duuzraUuid));
                }
            }catch (err){
                return Promise.reject<IAttendeeDto>(err);
            }

        });
    }

  
    public async createAttendee(authToken: string, correlationId: string, clientUuid: string, duuzraUuid: string, attendee: IAttendeeDto): Promise<IAttendeeDto> {
        console.log("attendee.repository.ts CreateAttendee()");
        try {  
            if (attendee.uuid) {
                return Promise.reject<IAttendeeDto>({ status: 400, message: 'Attendee has uuid - create not permitted' });
            }

            attendee.uuid = attendee.authUuid; 
            const attendeeDoc = AttendeeMapper.mapToDoc(attendee); 
            const couchGet = await System.DB.get('duuzraDuuzra', 'id', 'duuzra-duuzra_' + duuzraUuid) as any; 
            if (couchGet.docs.length === 1) { 
                const duuzraDoc = couchGet.docs[0];
                if (duuzraDoc.attendees) { 
                    const conflict = this.isInConflict(duuzraDoc.attendees, attendeeDoc)
                    if (!conflict) { 
                        duuzraDoc.attendees.push(attendeeDoc); 
                        const defaultGroup = duuzraDoc.groups.find((g) => g.isDefault);
                        defaultGroup.groupAttendeeUuids.push(attendeeDoc.uuid);
                    } else { 
                        attendeeDoc.uuid = conflict.uuid;
                        attendeeDoc.permissions = attendeeDoc.permissions; 
                    }
                } else { 
                    duuzraDoc.attendees = [attendeeDoc];
                } 

                let i = 0;
                for (let data of duuzraDoc.attendees){
                    let bol: boolean = false;
                    let email = await this.getUserAttendeeEmail(data.uuid);
                    this.superUserlist.forEach((val) => {
                        if (email === val){
                            bol = true;
                        }
                    });
                    if (bol){
                        duuzraDoc.attendees[i].permissions.canReceiveNotificationDuuzraLive = false;
                        duuzraDoc.attendees[i].permissions.canReceiveNotificationContentAddRemove = false;
                    } else {
                        duuzraDoc.attendees[i].permissions.canReceiveNotificationDuuzraLive = false;
                        duuzraDoc.attendees[i].permissions.canReceiveNotificationContentAddRemove = false;
                    }
                    i++;
                }
 
                const couchResponse = await System.DB.save(duuzraDoc); 
                return Promise.resolve(this.buildDto(authToken, correlationId, attendeeDoc, duuzraUuid));

            } else {
                return Promise.reject<IAttendeeDto>({ status: 500, message: 'Duuzra Not Found' });
            }

        } catch (err) { 
            return Promise.reject<IAttendeeDto>({ status: 500, message: err });
        }
    }

    private async getUserAttendeeEmail(uuid: string){
        try{
            let email: string;
            let rawUser = await System.DB.get('authUser', 'id', 'auth-user_' + uuid) as any;
            rawUser = rawUser.docs[0];
            email = rawUser.email;

            return email;
        }catch (err){
            return null;
            //return Promise.reject<void>(err);
        }

    }

    public async createAttendees(authToken: string, correlationId: string, clientUuid: string, duuzraUuid: string, attendees: IAttendeeDto[]): Promise<IAttendeeDto[]> { 
        console.log("attendee.repository.ts CreateAttendees()");
        try {
            // load the client doc
            const couchGet = await System.DB.get('duuzraDuuzra', 'id', 'duuzra-duuzra_' + duuzraUuid) as any;
            const duuzraDoc: IDuuzraDoc = couchGet.docs[0];

            // add the item
            if (couchGet.docs.length === 1) {

                if (!duuzraDoc.attendees) {
                    duuzraDoc.attendees = [];
                }


                attendees.forEach((attendee: IAttendeeDto) => { 
                    if (attendee.uuid) {
                        console.error('One of the attendees has Uuid - Cannot Create');
                        Promise.reject('One of the attendees has Uuid - Cannot Create');
                    } 

                    const attendeeDoc = AttendeeMapper.mapToDoc(attendee); 
                    if (!this.isInConflict(duuzraDoc.attendees, attendeeDoc)) {
                        duuzraDoc.attendees.push(attendeeDoc); 
                        const defaultGroup = duuzraDoc.groups.find((g) => g.isDefault);
                        defaultGroup.groupAttendeeUuids.push(attendeeDoc.uuid); 
                    }
                }); 
                const couchResponse = await System.DB.save(duuzraDoc);
            } else { 
                return Promise.reject<IAttendeeDto[]>(null);
            } 
            const newAttendees = []
            duuzraDoc.attendees.forEach((attendeeDoc) => {
                newAttendees.push(this.buildDto(authToken, correlationId, attendeeDoc, duuzraUuid))
            })
            return Promise.resolve(newAttendees);
        } catch (err) { 
            return Promise.reject<IAttendeeDto[]>(err);
        }
    }

    private isInConflict(allAttendeeDocs: IDuuzraAttendeeDoc[], newAttendeeDoc: IDuuzraAttendeeDoc): IDuuzraAttendeeDoc { 
        const newAttendeeAuthUuid = newAttendeeDoc.authUuid; 
        const potentialDuplicates = allAttendeeDocs.filter((attendeeDoc) => {
            return attendeeDoc.authUuid === newAttendeeAuthUuid;
        });

        if (potentialDuplicates.length > 0) { 
            if (potentialDuplicates.length === 1) {
                return potentialDuplicates[0];
            } else { 
                return null;
            }
        } else {
            return null; 
        }
    }
 
 
    public async deleteAttendees(authToken: string, correlationId: string, clientUuid: string, duuzraUuid: string, attendeeUuids: string[]): Promise<IAttendeeDto[]> {
        console.log("attendee.repository.ts DeleteAttendees()");
        try { 
            const couchGet = await System.DB.get('duuzraDuuzra', 'id', 'duuzra-duuzra_' + duuzraUuid) as any; 
            let document: IDuuzraDoc;
            if (couchGet && couchGet.docs && couchGet.docs.length !== 1) {
                return Promise.reject<IAttendeeDto[]>('deleteAttendees - duuzra document returned 0 or multiple documents');
            } else {
                document = couchGet.docs[0];
            }

            // Get the appropriate return information from the document
            const deletedAttendeesDocs = [];
            attendeeUuids.forEach((attUuid) => {
                const attendeeDoc = this.getAttendeeFromDocument(document, attUuid);
                if (attendeeDoc) {
                    deletedAttendeesDocs.push(attendeeDoc)
                }
            });
 
            attendeeUuids.forEach((attUuid) => {
                document = this.deleteAttendeeFromDocument(document, attUuid);
            });
 
            const couchResponse = await System.DB.save(document); 
            const deletedAttendeeDtoPromises = deletedAttendeesDocs.map((attDoc) => {
                return this.buildDto(authToken, correlationId, attDoc, duuzraUuid);
            });
 
            return Promise.all(deletedAttendeeDtoPromises); 
        } catch (err) { 
            return Promise.reject<IAttendeeDto[]>(err);
        }
    }
 
    public async updateAttendee(
        authToken: string,
        correlationId: string,
        clientUuid: string,
        duuzraUuid: string,
        attendeeDto: IAttendeeDto,
        addAdminPermissionCallback: (clientUuid: string, authUuid: string) => void,
        removeAdminPermissionCallback: (clientUuid: string, authUuid: string) => void
    ): Promise<IAttendeeDto> { 
        try { 
            const attendeeDoc: IDuuzraAttendeeDoc = AttendeeMapper.mapToDoc(attendeeDto); 
            const couchGet = await System.DB.get('duuzraDuuzra', 'id', 'duuzra-duuzra_' + duuzraUuid) as any; 
            if (couchGet.docs.length === 1) { 
                const duuzraDoc = couchGet.docs[0]; 
                let foundDBAttendeeDoc: IDuuzraGroupDoc = null;
                let foundDBAttendeeDocIndex: number = null;

                const found = duuzraDoc.attendees.find((x: IDuuzraGroupDoc, i, arr) => {
                    if (x.uuid === attendeeDto.uuid) {
                        foundDBAttendeeDoc = x;
                        foundDBAttendeeDocIndex = i;
                        return true;
                    }
                });

                const dbAttendeeFound = duuzraDoc.attendees.find((att) => att.uuid === attendeeDto.uuid);

                if (found) { 
                    attendeeDoc.authUuid = dbAttendeeFound.authUuid; 
                    const attendeePermissionChanged = JSON.stringify(attendeeDoc.permissions) !== JSON.stringify(dbAttendeeFound.permissions);
                    let adminPermissionAdded: boolean = false;
                    let adminPermissionRemoved: boolean = false;
                    if (attendeePermissionChanged) {
                        const adminOnNew =
                            attendeeDoc.permissions.cmsAnalyticsEnabled ||
                            attendeeDoc.permissions.cmsEditEnabled ||
                            attendeeDoc.permissions.cmsSharingEnabled;

                        const adminOnOriginal =
                            dbAttendeeFound.permissions.cmsAnalyticsEnabled ||
                            dbAttendeeFound.permissions.cmsEditEnabled ||
                            dbAttendeeFound.permissions.cmsSharingEnabled;

                        adminPermissionAdded = !adminOnOriginal && adminOnNew;
                        adminPermissionRemoved = adminOnOriginal && !adminOnNew;
                    }

                    if (adminPermissionAdded) {  
                        addAdminPermissionCallback(duuzraDoc.clientUuid, dbAttendeeFound.authUuid);
                    }

                    if (adminPermissionRemoved) { 
                        const administratorOf: any = await System.DB.get('duuzraDuuzra', 'administratorUuid', dbAttendeeFound.authUuid)

                        if (administratorOf.docs && administratorOf.docs.length === 1) {
                            removeAdminPermissionCallback(duuzraDoc.clientUuid, dbAttendeeFound.authUuid);
                        }
                    }

                    duuzraDoc.attendees.splice(foundDBAttendeeDocIndex, 1, attendeeDoc);

                    const couchResponse = await System.DB.save(duuzraDoc);

                }

                if (found) { 
                    return Promise.resolve(this.buildDto(authToken, correlationId, attendeeDoc, duuzraUuid));
                } else { 
                    return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
                    //return Promise.reject<IAttendeeDto>(null);
                }
            } else { 
                return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
              //  return Promise.reject<IAttendeeDto>(null);
            }
        } catch (err) { 
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
            //return Promise.reject<IAttendeeDto>(err);
        }
    }
 
    private async upgradeAttendee(attendeeDto: IAttendeeDto): Promise<IAttendeeDto> {
        console.log("attendee.repository.ts upgradeAttendee()");
        try{
            if (attendeeDto.authUuid) {
                const couchGet = await System.DB.get('authUser', 'id', attendeeDto.authUuid) as any; 
                if (couchGet && couchGet.docs[0]) {
                    const authUser: IAuthUserDoc = couchGet.docs[0]; 
                    attendeeDto.firstname = authUser.firstname;
                    attendeeDto.lastname = authUser.lastname;
                    attendeeDto.email = authUser.email;
                }
            }

            return attendeeDto;
        }catch (err){
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
            //return Promise.reject<IAttendeeDto>(err);
        }

    } 

    private getAttendeeFromDocument(document: IDuuzraDoc, attendeeUuid: string): IDuuzraAttendeeDoc {
        return document.attendees.find((att) => att.uuid === attendeeUuid);
    }

    private deleteAttendeeFromDocument(document: IDuuzraDoc, attendeeUuid: string): IDuuzraDoc { 
        if (document.attendees) {
            document.attendees.find((x, i, arr) => {
                if (x.uuid === attendeeUuid) {
                    document.attendees.splice(i, 1);
                    return true;
                } else {
                    return false;
                }
            });
        }
 
        if (document.groups) {
            document.groups.forEach((group: IDuuzraGroupDoc) => {
                if (group.groupAttendeeUuids) {
                    const indexOfMatch = group.groupAttendeeUuids.indexOf(attendeeUuid);
                    if (indexOfMatch > -1) {
                        group.groupAttendeeUuids.splice(indexOfMatch, 1);
                    }
                }
            });
        }

        return document;
    }


    public async deleteAttendee(authToken: string, correlationId: string, clientUuid: string, duuzraUuid: string, attendeeUuid: string): Promise<IAttendeeDto> { 
        console.log("attendee.repository.ts deleteAttendee()");
        try { 
           const couchGet = await System.DB.get('duuzraDuuzra', 'id', 'duuzra-duuzra_' + duuzraUuid) as any; 
           let document: IDuuzraDoc;
           if (couchGet && couchGet.docs && couchGet.docs.length !== 1) {
               return Promise.reject<IAttendeeDto>('deleteAttendee - duuzra document returned 0 or multiple documents');
           } else {
               document = couchGet.docs[0];
           } 
           const attendeeDoc = this.getAttendeeFromDocument(document, attendeeUuid); 
           document = this.deleteAttendeeFromDocument(document, attendeeUuid); 
           const couchResponse = await System.DB.save(document); 
           const attendeeDtoPromise = this.buildDto(authToken, correlationId, attendeeDoc, duuzraUuid)
           return Promise.resolve(attendeeDtoPromise);
       } catch (err) { 
           return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
           //return Promise.reject<IAttendeeDto>(err);
       } 
   }
}

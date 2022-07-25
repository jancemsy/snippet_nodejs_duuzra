import { IDuuzraInfoDto, IAddMultipleUsersDto, IAttendeeDto } from '../../duuzra_types/duuzras';
import { System } from '../../shared';
import { IDuuzraDoc } from '../../models/duuzra-duuzra-doc';
import { UserDocument } from '../../shared/user/models/user-document';
import { DuuzraUserMapper } from './duuzra-user.mapper';
import { IDuuzraAttendeeDoc } from '../../models/duuzra-attendee-doc';

export abstract class IDuuzraUserRepository {

    public abstract async addUserToDuuzra(duuzraUuid: string, userId: string): Promise<any>;
    public abstract async addMultipleUsersToDuuzra(duuzraUuid: string, users: IAttendeeDto[], groups?: any, grpAssignment?: any): Promise<IAddMultipleUsersDto>;
    public abstract async deleteUsersFromDuuzra(duuzraUuid: string, userIds: string[]): Promise<any>;
    public abstract async getUsersForDuuzra(duuzraUuid: string): Promise<any>;
}

export class DuuzraUserRepository implements IDuuzraUserRepository {

    constructor() { }

    
    public async deleteUsersFromDuuzra(duuzraUuid: string, userIds: string[]): Promise<any> {
        console.log("duuzra-user.repository.ts deleteUsersFromDuuzra()");
        try {

            return new Promise<any>((resolve, reject) => {
                // load the client doc
                System.DB.get('duuzraDuuzra', 'id', 'duuzra-duuzra_' + duuzraUuid)
                    .then((couchGet: any) => {
                        // add the item
                        if (couchGet.docs.length === 1) {

                            let duuzraDoc: IDuuzraDoc = couchGet.docs[0];
                            if (!duuzraDoc.users) {
                                duuzraDoc.users = [];
                            }

                            for (let i = 0; i <= userIds.length; i++) {
                                let userToDeleteIndex = duuzraDoc.users.findIndex((duuzraUserId) => {
                                    if (userIds[i]) {
                                        return duuzraUserId === userIds[i].split('_')[1];
                                    }
                                });

                                if (userToDeleteIndex !== -1) {
                                    duuzraDoc.users.splice(userToDeleteIndex, 1);
                                }
                            }

                            return System.DB.save(duuzraDoc);

                        } else { 
                            reject(null);
                        }
                    })
                    .then((duuzraDoc: IDuuzraDoc) => {
                        resolve(duuzraDoc);
                    })
                    .catch((error) => { 
                    });
            });

        } catch (err) { 
            return Promise.reject<IDuuzraInfoDto>(err);
        }
    }


    public async addMultipleUsersToDuuzra(duuzraUuid: string, users: IAttendeeDto[], groups?: any, grpAssignment?: any): Promise<IAddMultipleUsersDto> {
        console.log("duuzra-user.repository.ts addMultipleUsersToDuuzra()");
        try {
            return new Promise<IAddMultipleUsersDto>((resolve, reject) => { 
                System.DB.get('duuzraDuuzra', 'id', 'duuzra-duuzra_' + duuzraUuid)
                    .then((couchGet: any) => {
                        // add the item
                        if (couchGet.docs.length > 0) {

                            const duuzraDoc: IDuuzraDoc = couchGet.docs[0];

                            if (!duuzraDoc.attendees) {
                                duuzraDoc.attendees = [];
                            }

                            users.forEach((user) => {
                                const alreadyAdded = duuzraDoc.attendees.find((attendee) => {
                                    return attendee.uuid === user.uuid;
                                });
                                let userDoc: IDuuzraAttendeeDoc = {
                                    uuid: user.uuid,
                                    authUuid: user.authUuid,
                                    permissions: user.permissions
                                }
                                if (!alreadyAdded) {
                                    duuzraDoc.attendees.push(userDoc);
                                }
                            });

                            // save the duuzra doc
                            System.DB.save(duuzraDoc)
                                .then((duuzra: IDuuzraDoc) => {
                                    resolve({
                                        result: true,
                                    });
                                });

                        } else { 
                            reject(null);
                        }
                    })
                    .catch((error) => { 
                    });
            });
        } catch (err) { 
            return Promise.reject<any>(err);
        }
    }

    
 
    public async getUsersForDuuzra(duuzraUuid: string): Promise<any> {
        console.log("duuzra-user.repository.ts getUsersForDuuzra()");
        return new Promise<any>((resolve, reject) => {
            try{ 
                System.DB.get('duuzraDuuzra', 'id', 'duuzra-duuzra_' + duuzraUuid)
                .then((couchGet: any) => { 
                    if (couchGet.docs.length === 1) { 
                        let duuzraDoc: IDuuzraDoc = couchGet.docs[0]; 
                        let duuzraAttendees = duuzraDoc.attendees; 
                        System.DB.get('authUser', 'all')
                            .then((users: any) => { 
                                let myusers = users.docs;
                                let userDocs: any = users.docs;
                                let userDetails = [];
                                duuzraAttendees.forEach((attendeeID) => {
                                    for (let user of myusers){
                                        if (("auth-user_" + attendeeID.authUuid) === user._id){
                                            userDetails.push({
                                                userId: attendeeID.authUuid,
                                                email: user.email,
                                                name: user.firstname + ' ' + user.lastname,
                                                createdBy: user.createdBy,
                                                selected: true,
                                                canView: true,
                                            });
                                        }
                                    }
                                }); 
                                resolve(userDetails);
                            });

                    } else { 
                        reject(null);
                    }
                })
                .catch((error) => { 
                });
            }catch (err){
                reject(err);
            }

        });
    }
    public async addUserToDuuzra(duuzraUuid: string, userId: string): Promise<any> { 
        console.log("duuzra-user.repository.ts addUsersToDuuzra()");
        try { 
            return new Promise<any>((resolve, reject) => { 
                System.DB.get('duuzraDuuzra', 'id', 'duuzra-duuzra_' + duuzraUuid)
                    .then((couchGet: any) => { 
                        if (couchGet.docs.length === 1) {

                            const duuzraDoc: IDuuzraDoc = couchGet.docs[0];

                            if (!duuzraDoc.users) {
                                duuzraDoc.users = [];
                            }

                            const alreadyAdded = duuzraDoc.users.find((duuzraUserId) => {
                                return duuzraUserId === userId;
                            });

                            if (!alreadyAdded) {
                                duuzraDoc.users.push(userId); 
                                return System.DB.save(duuzraDoc);
                            } else {
                                reject('UserId: ' + userId + ' already added to duuzra');
                            }

                        } else { 
                            reject(null);
                        }
                    })
                    .then((duuzraDoc: IDuuzraDoc) => {
                        resolve(duuzraDoc);
                    })
                    .catch((error) => { 
                    });
            });
        } catch (err) { 
            return Promise.reject<any>(err);
        }
    }

}

// import { IDuuzraTokenPayload } from '../../duuzra_types/security';
// import { IDuuzraGroupRepository, DuuzraGroupRepository } from './index';
// import { IUsersToGroupsDto } from './models/users-to-group';

// export abstract class IDuuzraGroupService {

//     public abstract async addGroup(tokenPayload: IDuuzraTokenPayload, duuzraId: string, groupName: string): Promise<any>;
//     public abstract async deleteGroup(tokenPayload: IDuuzraTokenPayload, duuzraId: string, groupName: string): Promise<any>;
//     public abstract async getGroupList(tokenPayload: IDuuzraTokenPayload, duuzraId: string): Promise<any>;
//     public abstract async addUsersToGroup(tokenPayload: IDuuzraTokenPayload, duuzraId: string, usersToGroups: IUsersToGroupsDto): Promise<IUsersToGroupsDto>;
//     public abstract async getGroupProperties(tokenPayload: IDuuzraTokenPayload, duuzraId: string, groupName: string): Promise<any>;
//     // public abstract async deleteUserFromGroup(tokenPayload: IDuuzraTokenPayload, duuzraId: string, groupName: string, email: string): Promise<any>;
// }

// export class DuuzraGroupService implements IDuuzraGroupService {

//     private duuzraGroupRepo: IDuuzraGroupRepository;

//     // ##########################################################################
//     // # LIFECYCLE
//     // ##########################################################################

//     constructor() {
//         this.duuzraGroupRepo = new DuuzraGroupRepository();
//     }

//     public async addGroup(tokenPayload: IDuuzraTokenPayload, duuzraId: string, groupName: string) {

//         try {
//             let clientClaim = tokenPayload.claims.filter(c => { return c.startsWith('duuzra.client.'); })[0]
//             let clientUuid = clientClaim.replace('duuzra.client.', '');

//             if (!duuzraId) {
//                 return Promise.reject<any>(new Error('No uuid supplied'));
//             }
//             if (!clientUuid) {
//                 return Promise.reject<any>(new Error('No client defined on token'));
//             }

//             if (!groupName) {
//                 return Promise.reject<any>(new Error('No group name specified.'));
//             }

//             return this.duuzraGroupRepo.addGroupToDuuzra(duuzraId, groupName, tokenPayload.email);

//         } catch (e) {
//             console.error('ERROR:', e);
//             return Promise.reject<any>(new Error('Unknown Error'));
//         }
//     }

//     public async deleteGroup(tokenPayload: IDuuzraTokenPayload, duuzraId: string, groupName: string): Promise<any> {
//         try {
//             let clientClaim = tokenPayload.claims.filter(c => { return c.startsWith('duuzra.client.'); })[0]
//             let clientUuid = clientClaim.replace('duuzra.client.', '');

//             if (!duuzraId) {
//                 return Promise.reject<any>(new Error('No uuid supplied'));
//             }
//             if (!clientUuid) {
//                 return Promise.reject<any>(new Error('No client defined on token'));
//             }

//             if (!groupName) {
//                 return Promise.reject<any>(new Error('No group name specified.'));
//             }

//             return this.duuzraGroupRepo.deleteGroupFromDuuzra(duuzraId, groupName);

//         } catch (e) {
//             console.error('ERROR:', e);
//             return Promise.reject<any>(new Error('Unknown Error'));
//         }
//     }

//     public async getGroupList(tokenPayload: IDuuzraTokenPayload, duuzraId: string): Promise<any> {
//         try {
//             let clientClaim = tokenPayload.claims.filter(c => { return c.startsWith('duuzra.client.'); })[0]
//             let clientUuid = clientClaim.replace('duuzra.client.', '');

//             if (!duuzraId) {
//                 return Promise.reject<any>(new Error('No uuid supplied'));
//             }
//             if (!clientUuid) {
//                 return Promise.reject<any>(new Error('No client defined on token'));
//             }

//             return this.duuzraGroupRepo.getDuuzraGroupList(duuzraId);

//         } catch (e) {
//             console.error('ERROR:', e);
//             return Promise.reject<any>(new Error('Unknown Error'));
//         }
//     }

//     public async addUsersToGroup(
//         tokenPayload: IDuuzraTokenPayload,
//         duuzraId: string,
//         usersToGroups: IUsersToGroupsDto): Promise<any> {
//         try {
//             let clientClaim = tokenPayload.claims.filter(c => { return c.startsWith('duuzra.client.'); })[0]
//             let clientUuid = clientClaim.replace('duuzra.client.', '');

//             if (!duuzraId) {
//                 return Promise.reject<any>(new Error('No uuid supplied'));
//             }
//             if (!clientUuid) {
//                 return Promise.reject<any>(new Error('No client defined on token'));
//             }

//             return this.duuzraGroupRepo.addUsersToGroup(duuzraId, usersToGroups);

//         } catch (e) {
//             console.error('ERROR:', e);
//             return Promise.reject<any>(new Error('Unknown Error'));
//         }
//     }

//     public getGroupProperties(tokenPayload: IDuuzraTokenPayload, duuzraId: string, groupName: string): Promise<IUsersToGroupsDto> {
//         try {
//             let clientClaim = tokenPayload.claims.filter(c => { return c.startsWith('duuzra.client.'); })[0]
//             let clientUuid = clientClaim.replace('duuzra.client.', '');

//             if (!duuzraId) {
//                 return Promise.reject<any>(new Error('No uuid supplied'));
//             }
//             if (!clientUuid) {
//                 return Promise.reject<any>(new Error('No client defined on token'));
//             }

//             return this.duuzraGroupRepo.getGroupProperties(duuzraId, groupName);

//         } catch (e) {
//             console.error('ERROR:', e);
//             return Promise.reject<any>(new Error('Unknown Error'));
//         }
//     }

//     public deleteUserFromGroup(tokenPayload: IDuuzraTokenPayload, duuzraId: string, groupName: string, email: string): Promise<any> {
//         try {
//             let clientClaim = tokenPayload.claims.filter(c => { return c.startsWith('duuzra.client.'); })[0]
//             let clientUuid = clientClaim.replace('duuzra.client.', '');

//             if (!duuzraId) {
//                 return Promise.reject<any>(new Error('No uuid supplied'));
//             }
//             if (!clientUuid) {
//                 return Promise.reject<any>(new Error('No client defined on token'));
//             }

//             return this.duuzraGroupRepo.deleteUserFromGroup(duuzraId, groupName, email);

//         } catch (e) {
//             console.error('ERROR:', e);
//             return Promise.reject<any>(new Error('Unknown Error'));
//         }
//     }
// }

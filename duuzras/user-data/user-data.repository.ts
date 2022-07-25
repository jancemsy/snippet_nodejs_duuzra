import {
    IUserDataDto,
    IUserDataItemDto,
    IUserDataItemFormDto,
    IUserDataItemHotspotDto,
    IUserDataItemNoteDto,
    IUserDataItemPollDto,
    IUserDataItemQuestionDto,
} from '../../duuzra_types/duuzras';
import { IUserDataDoc, IUserDataDuuzraItemDoc } from '../../models/duuzra-userdata-doc';
import { System } from '../../shared';
import { UserDataMapper } from './user-data.mapper';

import { DuuzraMediaMapper } from '../media/media.mapper';
import { IMediaRepository, MediaRepository } from '../media/media.repository';

import { DateFormatter } from '../../duuzra_types/common';

export abstract class IUserDataRepository {
    // For User
    public abstract async getUserDataByAuthUserAndDuuzra(authUuid: string, duuzraUuid: string): Promise<IUserDataDto>;

    public abstract async createUserData(authUuid: string, duuzraUuid: string, userData: IUserDataItemDto): Promise<IUserDataItemDto>;
    public abstract async deleteUserData(authUuid: string, duuzraUuid: string, uuid: string): Promise<IUserDataItemDto>;
    public abstract async updateUserData(authUuid: string, duuzraUuid: string, userData: IUserDataItemDto): Promise<IUserDataItemDto>;

    // For Master
    public abstract async getUserDataByDuuzraAndType(duuzraUuid: string, type: string): Promise<IUserDataItemDto[]>;

}

export class UserDataRepository implements IUserDataRepository {
    private readonly objectName = UserDataMapper.getViewType();

    private mediaRepo: IMediaRepository;
    private userDataMapper: UserDataMapper;

    constructor() {
        this.mediaRepo = new MediaRepository();
        this.userDataMapper = new UserDataMapper();
    } 


    public async getUserDataByDuuzraAndType(duuzraUuid: string, type: string): Promise<IUserDataItemDto[]> {
        try { 
            const couchResponse = await System.DB.get(this.objectName, 'duuzraUuid_type', [duuzraUuid, type]) as any; 
            if (couchResponse && couchResponse.docs.length > 0) { 
                const itemPromises: Array<Promise<IUserDataItemDto>> = [];
                couchResponse.docs.forEach((userDataItemDoc: IUserDataItemDto) => {
                    itemPromises.push(this.buildDto(userDataItemDoc));
                }); 
                return Promise.all(itemPromises); 
            } else {
                return Promise.resolve(null);
            }
        } catch (err) { 
            return Promise.reject<IUserDataItemDto[]>(err);
        }
    }


    public async getUserDataByAuthUserAndDuuzra(authUuid: string, duuzraUuid: string): Promise<IUserDataDto> {
        console.log("user-data-item.service.ts GetUserDataByAuthUserAndDuuzra()");
        try {
            const docId = 'duuzra-userdata_' + authUuid;
            const couchResponse = await System.DB.get(this.objectName, 'id_duuzraUuid', [docId, duuzraUuid]) as any;

            if (couchResponse && couchResponse.docs.length > 0) {
                return this.buildUserDataDto(couchResponse.docs);
            } else {
                return Promise.resolve(null);
            }
        } catch (err) { 
            return Promise.reject<IUserDataDto>(err);
        }
    }

    public async createUserData(authUuid: string, duuzraUuid: string, userData: IUserDataItemDto): Promise<IUserDataItemDto> {
        console.log("user-data-item.service.ts CreateUserData()");
        try {
            const docId = 'duuzra-userdata_' + authUuid;
            const couchResponse = await System.DB.get(this.objectName, 'id', docId) as any;
            const dataItemDoc: IUserDataDuuzraItemDoc = UserDataMapper.mapDataItemToDoc(userData); 
            if (couchResponse && couchResponse.docs.length > 1) { return Promise.reject<IUserDataItemDto>('There is more than 1 user data doc found for this user. AuthUuid:' + authUuid); } 
            let userDataDoc: IUserDataDoc = null;
            if (couchResponse && couchResponse.docs.length === 1) { 
                userDataDoc = couchResponse.docs[0];
            } else { 
                userDataDoc = {
                    _id: 'duuzra-userdata_' + authUuid,
                    _rev: undefined,
                    type: 'duuzra-userdata',
                    userData: []
                };
            } 
            dataItemDoc.authUuid = authUuid;
            userDataDoc.userData.push(dataItemDoc); 
            await System.DB.save(userDataDoc); 
            const dto = await this.buildDto(dataItemDoc);
            return Promise.resolve(dto);  
        } catch (ex) {
            return Promise.reject<IUserDataItemDto>(ex);
        }
    }

    public async updateUserData(authUuid: string, duuzraUuid: string, userData: IUserDataItemDto): Promise<IUserDataItemDto> {
        console.log("user-data-item.service.ts UpdateUserData()");
        try { 
            const docId = 'duuzra-userdata_' + authUuid;
            const couchResponse = await System.DB.get(this.objectName, 'id', docId) as any;
            const dataItemDoc: IUserDataDuuzraItemDoc = UserDataMapper.mapDataItemToDoc(userData);
            dataItemDoc.authUuid = authUuid; 
            if (couchResponse && couchResponse.docs.length > 1) { return Promise.reject<IUserDataItemDto>('There is more than 1 user data doc found for this user. AuthUuid:' + authUuid); }

            let userDataDoc: IUserDataDoc = null;
            if (couchResponse && couchResponse.docs.length === 1) { 
                userDataDoc = couchResponse.docs[0];
                const found = userDataDoc.userData.find((x, i, arr) => {
                    if (x.uuid === userData.uuid) {
                        userDataDoc.userData.splice(i, 1, dataItemDoc);
                        return true;
                    } else {
                        return false;
                    }
                });

                if (found) { 
                    const saveCouchResponse = await System.DB.save(userDataDoc); 
                    return Promise.resolve(this.buildDto(dataItemDoc));
                } else { 
                    return Promise.reject<IUserDataItemDto>(null);
                }
            } else {
                return Promise.reject<IUserDataItemDto>('Single user data doc not found');
            }

        } catch (ex) {
            return Promise.reject<IUserDataItemDto>(ex);
        }
    }

    public async deleteUserData(authUuid: string, duuzraUuid: string, uuid: string): Promise<IUserDataItemDto> {
        console.log("user-data-item.service.ts DeleteUserData()");
        try { 
            const docId = 'duuzra-userdata_' + authUuid;
            const couchResponse = await System.DB.get(this.objectName, 'id', docId) as any;

            if (couchResponse && couchResponse.docs.length > 1) { return Promise.reject<IUserDataItemDto>('There is more than 1 user data doc found for this user. AuthUuid:' + authUuid); }

            let userDataDoc: IUserDataDoc = null;
            if (couchResponse && couchResponse.docs.length === 1) {
                // Update the document with the new submission
                userDataDoc = couchResponse.docs[0];
                const found = userDataDoc.userData.find((x, i, arr) => {
                    if (x.uuid === uuid && x.authUuid === authUuid) {
                        userDataDoc.userData.splice(i, 1);
                        return true;
                    } else {
                        return false;
                    }
                });

                if (found) { 
                    const saveCouchResponse = await System.DB.save(userDataDoc); 
                    return Promise.resolve(this.buildDto(found));
                } else { 
                    return Promise.reject<IUserDataItemDto>(null);
                }
            } else {
                return Promise.reject<IUserDataItemDto>('Single user data doc not found');
            }

        } catch (ex) {
            return Promise.reject<IUserDataItemDto>(ex);
        }
    }
 

    private async buildUserDataDto(dataItems: IUserDataItemDto[]): Promise<IUserDataDto> { 
        console.log("user-data-item.service.ts BuildUserDataDto()");
        const userDataDto: IUserDataDto = {
            forms: [],
            hotspots: [],
            notes: [],
            polls: [],
            questions: []
        }

        dataItems.forEach((dataItem: IUserDataItemDto) => {
            switch (dataItem.type.toLowerCase()) {
                case ('form'): {
                    userDataDto.forms.push(dataItem as IUserDataItemFormDto);
                    break;
                }
                case ('hotspot'): {
                    userDataDto.hotspots.push(dataItem as IUserDataItemHotspotDto);
                    break;
                }
                case ('note'): {
                    userDataDto.notes.push(dataItem as IUserDataItemNoteDto);
                    break;
                }
                case ('poll'): {
                    userDataDto.polls.push(dataItem as IUserDataItemPollDto);
                    break;
                }
                case ('question'): {
                    userDataDto.questions.push(dataItem as IUserDataItemQuestionDto);
                    break;
                }
                default: {
                    break;
                }

            }
        })

        
        return Promise.resolve(userDataDto);
    }


    private async buildDto(dataItemDoc: IUserDataItemDto): Promise<IUserDataItemDto> {
        console.log("user-data-item.service.ts BuildDto()");
        // At this point we could manipulate the dataItem document at add additional information from other content. e.g. media

        return Promise.resolve(dataItemDoc);
        // note - we are assuming here that the sent document contains the inforamtion for:
        //      - authUuid
        //      - duuzraUuid
        //      - and that this inforamtion is correct.
    }

}

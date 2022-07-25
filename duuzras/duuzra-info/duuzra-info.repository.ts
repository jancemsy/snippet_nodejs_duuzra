import { IDuuzraInfoDto } from '../../duuzra_types/duuzras';
import { IDuuzraContentDto, IDuuzraMediaDto } from '../../duuzra_types/duuzras';
import { IDuuzraMediaDoc } from '../../models/duuzra-media-doc'; 
import { System } from '../../shared';
import { DuuzraInfoMapper } from './duuzra-info.mapper'; 
import { IDuuzraDoc } from '../../models/duuzra-duuzra-doc';
import { IDuuzraInfoDoc } from '../../models/duuzra-info-doc'; 
import { DateFormatter } from '../../duuzra_types/common';
import { DuuzraContentMapper } from '../contents/content.mapper';
import { DuuzraMediaMapper } from '../media/media.mapper';
import { IMediaRepository, MediaRepository } from '../media/media.repository'; 
import * as bcrypt from 'bcrypt-nodejs'; 
const uuidgen = require('uuid/v1');

export abstract class IDuuzraInfoRepository {  
    public abstract async getInfosByClient(clientUuid: string): Promise<IDuuzraInfoDto[]>
    public abstract async getInfosByAuthUser(authUserUuid: string): Promise<IDuuzraInfoDto[]>
    public abstract async getInfosByAccount(accountUuid: string): Promise<IDuuzraInfoDto[]>;
    public abstract async getInfosByAdministrator(administratorUuid: string): Promise<IDuuzraInfoDto[]>;
    public abstract async getInfoByUuid(id: string): Promise<IDuuzraInfoDto>;
    public abstract async getTotalFeatureOfDuuzra(id: string): Promise<any>;
    public abstract async createInfo(userUuid: string, clientUuid: string, info: IDuuzraInfoDto, thumbnailUuid: string): Promise<IDuuzraInfoDto>;
    public abstract async deleteInfo(clientUuid: string, uuid: string, isDeleted?: boolean): Promise<IDuuzraInfoDto>;
    public abstract async updateInfo(clientUuid: string, info: IDuuzraInfoDto, thumbnailUuid: string): Promise<IDuuzraInfoDto>;
}

export class DuuzraInfoRepository implements IDuuzraInfoRepository {
    private readonly objectName = DuuzraInfoMapper.getViewType();

    private mediaRepo: IMediaRepository;
    private contentMapper: DuuzraContentMapper;

    constructor() {
        this.mediaRepo = new MediaRepository();
        this.contentMapper = new DuuzraContentMapper();
    } 

    public async getInfosByClient(clientUuid: string): Promise<IDuuzraInfoDto[]> { 
        console.log("duuzra-info.repository.ts getInfosByClient()");
        try {
            const rawInfos = await System.DB.get(this.objectName, 'clientUuid', clientUuid) as any;
            if (rawInfos && rawInfos.docs.length > 0) { 
                const infoDtosPromises: Array<Promise<IDuuzraInfoDto>> = [];
                rawInfos.docs.forEach((infoDoc) => {
                    infoDtosPromises.push(
                        this.buildDto(infoDoc.id, infoDoc.info)
                    );
                }); 
                return Promise.all(infoDtosPromises);
            } else {
                return Promise.resolve(null);
            }
        } catch (err) { 
            //return Promise.reject<IDuuzraInfoDto[]>(err);
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
        }
    }


    public async encryptPassword(password: string) {
        return new Promise((resolve, reject) => {
            bcrypt.genSalt(10, (saltError, generatedSalt) => {
                if (saltError) {
                    reject(saltError);
                }
                let salt = generatedSalt;

                bcrypt.hash(password, salt, null, (hashError, hash) => {
                    if (hashError) {
                        reject(hashError);
                    }
                    resolve(hash);
                });
            });
        });
    }
 
    public async deleteInfo(clientUuid: string, infoUuid: string, isDeleted?: boolean): Promise<IDuuzraInfoDto> {
        console.log("duuzra-info.repository.ts deleteInfo()");
        if (isDeleted) {
            try { 
                const couchGet = await System.DB.get('duuzraDuuzra', 'id', 'duuzra-duuzra_' + infoUuid) as any;
                if (couchGet) {
                    if (couchGet.docs.length === 1) {
                        const duuzraDoc = couchGet.docs[0];     
                        duuzraDoc._deleted = true; 
                        const couchResponse = await System.DB.save(duuzraDoc); 
                        return Promise.resolve(await this.buildDto(duuzraDoc._id, duuzraDoc.info)); 
                    } else { 
                        return Promise.reject<IDuuzraInfoDto>(null);
                    }
                }

            } catch (err) { 
                return Promise.reject<IDuuzraInfoDto>(err);
            }

        } 

        try { 
            const deletedArr = null; 
            const couchGet = await System.DB.get('duuzraDuuzra', 'id', 'duuzra-duuzra_' + infoUuid) as any;
            if (couchGet) { 
                if (couchGet.docs.length === 1) { 
                    const duuzraDoc = couchGet.docs[0]; 
                    duuzraDoc.info.dateDeleted = new DateFormatter(null).toString(); 
                    const couchResponse = await System.DB.save(duuzraDoc); 
                    const snapshot_couchGet = await System.DB.get('duuzraSnapshot', 'docId', 'duuzra-snapshot_' + infoUuid) as any; 
                    if (snapshot_couchGet.docs.length === 1) {
                        const snapshot_duuzraDoc = snapshot_couchGet.docs[0];
                        snapshot_duuzraDoc.dateDeleted = new DateFormatter(null).toString(); 
                        const snapshot_couchResponse = await System.DB.save(snapshot_duuzraDoc);
                    } 
                    return Promise.resolve(await this.buildDto(duuzraDoc._id, duuzraDoc.info)); 
                } else { 
                    //return Promise.reject<IDuuzraInfoDto>(null);
                    return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
                }
            }
        } catch (err) { 
            //return Promise.reject<IDuuzraInfoDto>(err);
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 

        }
    }
 
    public async updateInfo(clientUuid: string, info: any, thumbnailUuid: string): Promise<IDuuzraInfoDto> {  
        console.log("duuzra-info.repository.ts updateInfo()");
        try { 
            const infoDoc = DuuzraInfoMapper.mapToDoc(info);  
            infoDoc.thumbnailUuid = thumbnailUuid; 
            const couchGet = await System.DB.get('duuzraDuuzra', 'id', 'duuzra-duuzra_' + info.uuid) as any; 
            if (couchGet.docs.length === 1) { 
                const duuzraDoc: IDuuzraDoc = couchGet.docs[0]; 
                    let y = 15;
                    let y_increment = 43;    
                    let previewJson : any = info['previewJson']; 
                    let layoutPreview: string = info.theme['preview'];  
                    duuzraDoc.contents.forEach((content) => {
                        if (content.contentType !== "layout-page") {  
                            if (content.theme) {
                                if (content.theme['canvasFeature']) {
                                    let c = content.theme['canvasFeature']; 
                                    try {
                                        if ((c.y + c.height) > previewJson.height) { 
                                            content.theme['canvasFeature'].y = previewJson.height - c.height;
                                        } 
                                        if ((c.x + c.width) > previewJson.width) { 
                                            content.theme['canvasFeature'].x = previewJson.width - c.width;
                                        }
                                    } catch (e) { 
                                    }

                                } 
                            }
                        }
                });  
                
                const snapshot_id = duuzraDoc._id.replace('duuzra-duuzra', 'duuzra-snapshot');
                const snapshot_couchGet = await System.DB.get('duuzraSnapshot', 'docId', snapshot_id) as any; 
                if (info.dateDeleted == null && duuzraDoc.info.dateDeleted != null) {  
                    if (snapshot_couchGet.docs.length === 1) {
                        const snapshot_duuzraDoc = snapshot_couchGet.docs[0];
                        snapshot_duuzraDoc.dateDeleted = null;
                        const snapshot_couchResponse = await System.DB.save(snapshot_duuzraDoc);
                    } 
                }
 
                if (snapshot_couchGet.docs.length > 0) {
                    let _snapshot: any = snapshot_couchGet.docs[0];
                    _snapshot.snapshots.forEach((s) => {
                        s.payloads.info.name = info.name;
                    });
                    const snapshot_res = await System.DB.save(_snapshot);
                }

                duuzraDoc.info = infoDoc; 
                const homepageContentItem = duuzraDoc.contents.find((ci) => ci.uuid === info.homepageUuid);
                if (homepageContentItem) {
                    homepageContentItem.title = info.name; 
                    if (info.thumbnailImage !== null) {
                        homepageContentItem.backgroundUuid = info.thumbnailImage.uuid;
                    } else {
                        homepageContentItem.backgroundUuid = null;
                    }
                }

                if (info['isGlobal']) {
                    duuzraDoc.contents.forEach((content) => {
                        if (content.contentType === "layout-page") {
                            content.contentUuids.forEach((cc) => {
                                cc.textColour = info.theme.buttonPrimaryColour;
                                cc.backgroundColour = info.theme.buttonSecondaryColour;
                            });
                        }
                        content.backgroundColour = info.theme.buttonSecondaryColour;
                        content.textColour = info.theme.buttonPrimaryColour;
                    });
                }
 
                const couchResponse = await System.DB.save(duuzraDoc); 
                return Promise.resolve(await this.buildDto(duuzraDoc._id, infoDoc)); 
            } else { 
                return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
                //return Promise.reject<IDuuzraInfoDto>(null);
            }
        } catch (err) {
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
            //return Promise.reject<IDuuzraInfoDto>(err);
        }
    }
    public async getInfosByAuthUser(authUuid: string): Promise<IDuuzraInfoDto[]> { 
        console.log("duuzra-info.repository.ts getInfosByAuthUser()");
        try {
            const rawInfos = await System.DB.get(this.objectName, 'authUuid', authUuid) as any;
            if (rawInfos && rawInfos.docs.length > 0) { 
                const infoDtosPromises: Array<Promise<IDuuzraInfoDto>> = [];
                rawInfos.docs.forEach((infoDoc) => {
                    infoDtosPromises.push(
                        this.buildDto(infoDoc.id, infoDoc.info)
                    );
                });

                return Promise.all(infoDtosPromises);
            } else {
                return Promise.resolve(null);
            }
        } catch (err) { 
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
            //return Promise.reject<IDuuzraInfoDto[]>(err);
        }
    }

    public async getInfosByAdministrator(administratorUuid): Promise<IDuuzraInfoDto[]> { 
        console.log("duuzra-info.repository.ts getInfosByAdministrator()");
        try {
            const rawInfos = await System.DB.get(this.objectName, 'administratorUuid', administratorUuid) as any; 
            if (rawInfos && rawInfos.docs.length > 0) { 
                const infoDtosPromises: Array<Promise<IDuuzraInfoDto>> = [];
                rawInfos.docs.forEach((infoDoc) => {
                    infoDtosPromises.push(
                        this.buildDto(infoDoc.id, infoDoc.info)
                    );
                });
                return Promise.all(infoDtosPromises);
            } else {
                return Promise.resolve(null);
            }
        } catch (err) { 
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
            //return Promise.reject<IDuuzraInfoDto[]>(err);
        }
    }

    public async getInfosByAccount(accountUuid: string): Promise<IDuuzraInfoDto[]> { 
        console.log("duuzra-info.repository.ts getInfosByAccount()");
        try {
            const rawInfos = await System.DB.get(this.objectName, 'accountUuid', accountUuid) as any;
            if (rawInfos && rawInfos.docs.length > 0) { 
                const infoDtosPromises: Array<Promise<IDuuzraInfoDto>> = [];
                rawInfos.docs.forEach((infoDoc) => {
                    infoDtosPromises.push(
                        this.buildDto(infoDoc.id, infoDoc.info)
                    );
                }); 
                return Promise.all(infoDtosPromises); 
            } else {
                return Promise.resolve(null);
            }
        } catch (err) { 
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
            //return Promise.reject<IDuuzraInfoDto[]>(err);
        }
    }

    public async getInfoByUuid(infoUuid: string): Promise<IDuuzraInfoDto> { 
        console.log("duuzra-info.repository.ts getInfosByUuid()");
        try {
            const docId = 'duuzra-duuzra_' + infoUuid;
            const rawInfos = await System.DB.get(this.objectName, 'id', docId) as any;
            if (rawInfos && rawInfos.docs.length === 1) {
                const found = rawInfos.docs[0];
                return Promise.resolve(await this.buildDto(found.id, found.info));
            } else {
                return Promise.resolve(null);
            }
        } catch (err) { 
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
            //return Promise.reject<IDuuzraInfoDto>(err);
        }
    }
    public async getTotalFeatureOfDuuzra(duuzraUuid: string): Promise<any> { 
        console.log("duuzra-info.repository.ts getTotalFeatureOfDuuzra()");
        try { 
            const rawInfos = await System.DB.get('duuzraDuuzra', 'id', 'duuzra-duuzra_' + duuzraUuid) as any;
            if (rawInfos) {
                const found = rawInfos.docs[0]; 

                if (found) {
                    return Promise.resolve(found.contents.length);
                } else {
                    return Promise.resolve(null);
                } 
            } else {
                return Promise.resolve(null);
            }
        } catch (err) { 
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
            //return Promise.reject<any>(err);
        }
    }

    private async buildDto(docId, info): Promise<IDuuzraInfoDto> {  
        console.log("duuzra-info.repository.ts buildDto()");
        if (info.thumbnailUuid) {
            const mediaDto = await this.mediaRepo.getMediaByUuid(info.thumbnailUuid);
            return Promise.resolve(DuuzraInfoMapper.mapToObj(docId, info, mediaDto));
        }

        return Promise.resolve(DuuzraInfoMapper.mapToObj(docId, info, null));
    } 

    public async createInfo(userUuid: string, clientUuid: string, infoDto: IDuuzraInfoDto, thumbnailUuid: string): Promise<IDuuzraInfoDto> {  
        console.log("duuzra-info.repository.ts CreateInfo()");
        try {
            if (infoDto.password !== "" && infoDto.password !== null) { 
                await this.encryptPassword(infoDto.password).then((encryptedPassword: string) => {
                    infoDto.password = encryptedPassword;
                });
            } 
            const infoDoc = DuuzraInfoMapper.mapToDoc(infoDto); 
            infoDoc.thumbnailUuid = thumbnailUuid; 
            if (!infoDto.uuid) {
                infoDto.uuid = uuidgen();
                infoDto.dateCreated = new DateFormatter(null).toString();
            } 
            const homepage: IDuuzraContentDto = {
                uuid: null,
                backgroundMedia: infoDto.thumbnailImage, // todo - this should likely be null and then none handled at the client.
                contentType: 'layout-page',
                contentUuids: [],
                sortOrder: 0,
                allowDownload: false,
                isFirstPageSet: false,
                tags: [],
                title: infoDto.name,
                theme: null,
                views: 0,
                notesCount: 0,
                questionCount: 0,
                uniqueCount: 0,
                backgroundColour: null,
                textColour: null,
                address: null,
                locked: false,
                isVisibleToAttendees : true 
            }

            const homepageDoc = DuuzraContentMapper.mapToDoc(homepage); 
            infoDoc.homepageUuid = homepageDoc.uuid; 
            infoDoc.creator = userUuid;
            const cuuid = clientUuid; 
            const duuzraDoc: IDuuzraDoc = {
                _id: 'duuzra-duuzra_' + infoDto.uuid,
                _rev: undefined,
                type: 'duuzra-duuzra',
                clientUuid: cuuid,
                info: infoDoc,
                contents: [homepageDoc],
                media: null,
                administrators: [userUuid],  
                attendees: [],
                groups: [],
                users: [],  
                isPin: false
            }

            const couchResponse = await System.DB.save(duuzraDoc); 
            const dto = await this.buildDto(duuzraDoc._id, infoDoc);
            return Promise.resolve(dto); 
        } catch (err) { 
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
            //return Promise.reject<IDuuzraInfoDto>(err);
        }
    }

 
}

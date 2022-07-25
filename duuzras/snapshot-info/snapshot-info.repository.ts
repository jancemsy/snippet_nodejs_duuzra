import { ISnapshotInfoDto } from '../../duuzra_types/duuzras';
import { System } from '../../shared';
import { DuuzraMediaMapper } from '../media/media.mapper';
import { IMediaRepository, MediaRepository } from '../media/media.repository';
import { SnapshotInfoMapper } from './snapshot-info.mapper';

export abstract class ISnapshotInfoRepository {
    public abstract async getInfosByAuthUser(authUserUuid: string): Promise<ISnapshotInfoDto[]>
    public abstract async deleteInfo(clientUuid: string, uuid: string, isDeleted?: boolean): Promise<ISnapshotInfoDto>;
}

export class SnapshotInfoRepository implements ISnapshotInfoRepository {
    private readonly objectName = SnapshotInfoMapper.getViewType();

    private mediaRepo: IMediaRepository;

    constructor() {
        this.mediaRepo = new MediaRepository();
    }
 
    public async getInfosByAuthUser(authUuid: string): Promise<ISnapshotInfoDto[]> {
        console.log("snapshot-info.repository.ts getInfoByAuthUser()");
        try {
            const rawInfos = await System.DB.get('duuzraSnapshot', 'authUuid', authUuid) as any;
            if (rawInfos && rawInfos.docs.length > 0) { 
                const infoDtosPromises: Array<Promise<ISnapshotInfoDto>> = [];
                let tempSnapshots = []; 
                for (let i = 0; i < rawInfos.docs.length; i++) { 
                    if (!rawInfos.docs[i].isDraft){ 
                        let prevId = rawInfos.docs[i].duuzraUuid;
                        let id = 'duuzra-duuzra_' + prevId, myArray = 0;
                        if (rawInfos.docs[i].isActive) { // count features
                            Object.keys(rawInfos.docs[i].payloads.content).forEach((duuzraId) => {
                                let item = rawInfos.docs[i].payloads.content[duuzraId];
                                if (item.contentType === 'layout-page') {
                                    myArray = item.contentUuids.length;
                                }
                            });
                        }
                        rawInfos.docs[i].features =  myArray;
                        rawInfos.docs[i].notesCount = 0;
                        rawInfos.docs[i].questionCount = 0;
                        const contantCount = await System.DB.get('duuzraDuuzra', 'id', id) as any;
                        if (contantCount.docs.length > 0) {
                            contantCount.docs[0].contents.forEach((contantDoc) => {
                                rawInfos.docs[i].notesCount = rawInfos.docs[i].notesCount + contantDoc.notesCount;
                                rawInfos.docs[i].questionCount = rawInfos.docs[i].questionCount + contantDoc.questionCount;

                            });
                        }
                        tempSnapshots.push(rawInfos.docs[i]);

                    } 
                    let alreadyAdded: boolean = false; 
                }

                tempSnapshots.forEach((infoDoc) => {  
                    infoDtosPromises.push(
                        this.buildDto(infoDoc.id, infoDoc)
                    );
                });
                return Promise.all(infoDtosPromises);
            } else {
                return Promise.resolve(null);
            }
        } catch (err) { 
            return Promise.reject<ISnapshotInfoDto[]>(err);
        }
    }

    private async buildDto(docId, info): Promise<ISnapshotInfoDto> {
        console.log("snapshot-info.repository.ts buildDto()");
        return Promise.resolve(SnapshotInfoMapper.mapToObj(docId, info));
    } 

    public async deleteInfo(clientUuid: string, infoUuid: string, isDeleted?: boolean): Promise<ISnapshotInfoDto> { 
        console.log("snapshot-info.repository.ts DeleteINfo()");
        if (!isDeleted){
            try { 
                const couchGet = await System.DB.get('duuzraSnapshot', 'duuzraUuid', infoUuid) as any; 
                if (couchGet){
                    if (couchGet.docs.length >= 1) {
                        const duuzraDoc = couchGet.docs[0];    
                        duuzraDoc._deleted = true; 
                        const couchResponse = await System.DB.save(duuzraDoc); 
                        return Promise.resolve(await this.buildDto(duuzraDoc._id, duuzraDoc.info)); 
                    } else { 
                        return Promise.reject<ISnapshotInfoDto>(null);
                    }
                } 
            } catch (err) { 
                return Promise.reject<ISnapshotInfoDto>(err);
            } 
        } 
    } 
}

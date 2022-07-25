import { IDuuzraMediaDto } from '../../duuzra_types/duuzras';
import { DuuzraHiddenMediaMapper } from './hidden-media.mapper';
import { System } from '../../shared/index';
import { DateFormatter } from '../../duuzra_types/common';
import { IDuuzraContentDto } from '../../duuzra_types/src/duuzras/duuzra-content-dto';
import { DuuzraSnapshotRepository  } from '../../duuzras/duuzra-snapshot/duuzra-snapshot.repository';
import { ContentRepository } from '../contents/content.repository';

export abstract class IMediaRepository {
    public abstract async getMediaByClient(clientUuid: string): Promise<IDuuzraMediaDto[]>
    public abstract async getMediaByUuid(id: string): Promise<IDuuzraMediaDto>;
    public abstract async createMedia(clientUuid: string, media: IDuuzraMediaDto): Promise<IDuuzraMediaDto>;
    public abstract async deleteMedia(clientUuid: string, uuid: string): Promise<IDuuzraMediaDto>;
}

export class HiddenMediaRepository implements IMediaRepository { 
    private readonly objectName = DuuzraHiddenMediaMapper.getViewType();
    private snapshotRepo: DuuzraSnapshotRepository; 
    private contentRepo: ContentRepository; 
    
   constructor() {
        this.contentRepo = new ContentRepository();
        this.snapshotRepo = new DuuzraSnapshotRepository();
    }
 

    
    private async mapToHiddenMedia(medias: any): Promise<IDuuzraMediaDto[]> {
        console.log("hidden-media.repository.ts mapToHiddenMedia");
        let result = await medias.map((x) => DuuzraHiddenMediaMapper.mapToObj(x)); 
        return Promise.resolve(result);
    }
    
    public async getMediaByClient(clientUuid: string): Promise<IDuuzraMediaDto[]> { 
        console.log("hidden-media.repository.ts getMediaByClient");
        try {
            let clientDocId = 'duuzra-client_' + clientUuid;
            let rawMedias = await System.DB.get(this.objectName, 'clientId', clientDocId) as any; 
            if (rawMedias && rawMedias.docs.length > 0) {
                let mediaArray = [];
                await rawMedias.docs.forEach((media) => {
                    if (media.isAdHoc === "true") {
                        mediaArray.push(media);
                    }
                });
                let result = await this.mapToHiddenMedia(mediaArray);
                return Promise.resolve(result);
            } else {
                return Promise.resolve(null);
            }
        } catch (err) { 
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
            //return Promise.reject<IDuuzraMediaDto[]>(err);
        }
    }

    
    public async getMediaByUuid(mediaUuid: string): Promise<IDuuzraMediaDto> {
        console.log("hidden-media.repository.ts getMediaByUuid");
        try {
            let rawMedias = await System.DB.get(this.objectName, 'uuid', mediaUuid) as any;
            if (rawMedias && rawMedias.docs.length === 1) {
                return Promise.resolve(DuuzraHiddenMediaMapper.mapToObj(rawMedias.docs[0]));
            } else {
                return Promise.resolve(null);
            }
        } catch (err) { 
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
            //return Promise.reject<IDuuzraMediaDto>(err);
        }
    }

    public async getMediaByClientForExport(clientUuid: string): Promise<IDuuzraMediaDto[]> { 
        console.log("hidden-media.repository.ts getMediaByCLientForExport");
        try {
            let clientDocId = 'duuzra-client_' + clientUuid;
            let rawMedias = await System.DB.get(this.objectName, 'clientId', clientDocId) as any; 
            if (rawMedias && rawMedias.docs.length > 0) {
                return Promise.resolve(rawMedias.docs as any[]);
            } else {
                return Promise.resolve(null);
            }
        } catch (err) { 
            return Promise.reject<IDuuzraMediaDto[]>(err);
        }
    }


    public async createMedia(clientUuid: string, media: IDuuzraMediaDto): Promise<IDuuzraMediaDto> {
        console.log("hidden-media.repository.ts createMedia");
        try { 
            let mediaDoc = DuuzraHiddenMediaMapper.mapToDoc(media); 
            let couchGet = await System.DB.get('duuzraClient', 'id', 'duuzra-client_' + clientUuid) as any; 
            if (couchGet.docs.length === 1) { 
                let clientDoc = couchGet.docs[0];
                if (clientDoc.media) {
                    clientDoc.media.push(mediaDoc); // todo - check for conflict
                } else {
                    clientDoc.media = [mediaDoc];
                } 
                let couchResponse = await System.DB.save(clientDoc);
            } else { 
                return Promise.reject<IDuuzraMediaDto>(null);
            } 
            return Promise.resolve(DuuzraHiddenMediaMapper.mapToObj(mediaDoc));
        } catch (err) { 
            return Promise.reject<IDuuzraMediaDto>(err);
        }
    }
 
    public async deleteMedia(clientUuid: string, mediaUuid: string): Promise<IDuuzraMediaDto> { 
        console.log("hidden-media.repository.ts deleteMedia");
        try { 
            let deletedArr = null; 
            let couchGet = await System.DB.get('duuzraClient', 'id', 'duuzra-client_' + clientUuid) as any;
            if (couchGet.docs.length === 1) { 
                let clientDoc = couchGet.docs[0];
                let duuzraUuid = "";
                let foundDoc = clientDoc.media.find((x, i, arr) => {
                    if (x.mediaUuid === mediaUuid) {
                        duuzraUuid = x.duuzraUuid;
                        clientDoc.media[i].dateDeleted = new DateFormatter().toString();
                        return clientDoc.media[i];
                    } else {
                        return null;
                    }
                });

                if (foundDoc) {
                    let duuzraDuuzracouchGet = await System.DB.get('duuzraDuuzra', 'id', 'duuzra-duuzra_' + duuzraUuid) as any;
                    if (duuzraDuuzracouchGet.docs.length > 0) {
                        let duuzraDoc = duuzraDuuzracouchGet.docs[0], newAdHoc = [];
                        let foundDuuzraDoc = duuzraDoc.adHocs.find((x, i, arr) => {
                            if (x.uuid !== mediaUuid) {
                                newAdHoc.push(duuzraDoc.adHocs[i]);
                            } else {
                                return null;
                            }
                        });
                        duuzraDoc.adHocs = newAdHoc; 
                        let couchDuuzraResponse = await System.DB.save(duuzraDoc);
                    } 
                    let couchResponse = await System.DB.save(clientDoc); 
                    setTimeout(() => {
                        this.updateHiddenFilesInSnapshot(duuzraUuid);
                    }, 100); 
                    return Promise.resolve(DuuzraHiddenMediaMapper.mapToObj(foundDoc));
                } else { 
                    return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
                    //return Promise.reject<IDuuzraMediaDto>(null);
                }

            } else { 
                return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
                //return Promise.reject<IDuuzraMediaDto>(null);
            } 
        } catch (err) { 
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
            //return Promise.reject<IDuuzraMediaDto>(err);
        }
    }

    public async updateHiddenFilesInSnapshot(duuzraUuid : any) {  
        console.log("hidden-media.repository.ts updateHiddenFilesInSnapshot");
        const adHoc = await this.contentRepo.getHiddenFiles(duuzraUuid); 
        let snapshotsDocId = 'duuzra-snapshot_' + duuzraUuid;  
        let rawContents = await System.DB.get('duuzraSnapshot', 'docId', snapshotsDocId) as any; 
        let duuzraSnapshotsDoc = rawContents.docs[0];       
        if (rawContents && rawContents.docs.length === 1) { 
            duuzraSnapshotsDoc.adHoc = adHoc;  
            for (let snapshot of duuzraSnapshotsDoc.snapshots) {
                //update adhoc
                snapshot.payloads.adHoc = adHoc; 
            }

            let couchResponse = await System.DB.save(duuzraSnapshotsDoc);   
        }  
    }

    public async getDuuzraContentByUuid(duuzraUuid: string) {
        console.log("hidden-media.repository.ts getDuuzraContentByUuid");
        try {
            let contentbackgroundUuid = [];
            let rawDuuzra = await System.DB.get('duuzraDuuzra', 'id', 'duuzra-duuzra_' + duuzraUuid) as any;

            for (let data of rawDuuzra.docs[0].contents) {
                if (data.backgroundUuid !== undefined) {
                    contentbackgroundUuid.push(data.backgroundUuid);
                }
                if (data.contentType === "Hotspot") {
                    contentbackgroundUuid.push(data.backgroundMedia.mediaUuid);
                }
            }
            return contentbackgroundUuid;
        } catch (err) {
            return null;
        }

    }
}

import { IDuuzraMediaDto } from '../../duuzra_types/duuzras';
import { DuuzraMediaMapper } from './media.mapper';
import { System } from '../../shared/index';
import { DateFormatter } from '../../duuzra_types/common';
import { IDuuzraContentDto } from '../../duuzra_types/src/duuzras/duuzra-content-dto';

export abstract class IMediaRepository {
    public abstract async getMediaByClient(clientUuid: string): Promise<IDuuzraMediaDto[]>
    public abstract async getMediaByUuid(id: string): Promise<IDuuzraMediaDto>;
    public abstract async createMedia(clientUuid: string, media: IDuuzraMediaDto): Promise<IDuuzraMediaDto>;
    public abstract async deleteMedia(clientUuid: string, uuid: string): Promise<IDuuzraMediaDto>;
    public abstract async updateMedia(clientUuid: string, media: IDuuzraMediaDto): Promise<IDuuzraMediaDto>;
} 
export class MediaRepository implements IMediaRepository { 
    private readonly objectName = DuuzraMediaMapper.getViewType(); 
    constructor() { }
 
  
    public async getMediaByUuid(mediaUuid: string): Promise<IDuuzraMediaDto> {
        console.log("media.repository.ts getMediaByUuid()");
        try {
            let rawMedias = await System.DB.get(this.objectName, 'uuid', mediaUuid) as any;
            if (rawMedias && rawMedias.docs.length === 1) {
                return Promise.resolve(DuuzraMediaMapper.mapToObj(rawMedias.docs[0]));
            } else {
                return Promise.resolve(null);
            }
        } catch (err) { 
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
            //return Promise.reject<IDuuzraMediaDto>(err);
        }
    }

    public async getMediaByClient(clientUuid: string): Promise<IDuuzraMediaDto[]> { 
        console.log("media.repository.ts getMediaByClient()");
        try {
            let clientDocId = 'duuzra-client_' + clientUuid;
            let rawMedias = await System.DB.get(this.objectName, 'clientId', clientDocId) as any;

            if (rawMedias && rawMedias.docs.length > 0) {
                return Promise.resolve(
                    (rawMedias.docs as any[]).map((x) => DuuzraMediaMapper.mapToObj(x))
                );
            } else {
                return Promise.resolve(null);
            }
        } catch (err) { 
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
            //return Promise.reject<IDuuzraMediaDto[]>(err);
        }
    }

    public async getMediaByClientForExport(clientUuid: string): Promise<IDuuzraMediaDto[]> { 
        console.log("media.repository.ts getMediaByClientForExport()");
        try {
            let clientDocId = 'duuzra-client_' + clientUuid;
            let rawMedias = await System.DB.get(this.objectName, 'clientId', clientDocId) as any;
            if (rawMedias && rawMedias.docs.length > 0) {
                return Promise.resolve(rawMedias.docs as any[]);
            } else {
                return Promise.resolve(null);
            }
        } catch (err) { 
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
            ///return Promise.reject<IDuuzraMediaDto[]>(err);
        }
    }

     


    public async deleteMedia(clientUuid: string, mediaUuid: string): Promise<IDuuzraMediaDto> { 
        console.log("media.repository.ts DeleteMedia()");
        try {

            let deletedArr = null; 
            let couchGet = await System.DB.get('duuzraClient', 'id', 'duuzra-client_' + clientUuid) as any; 
            if (couchGet.docs.length === 1) { 
                let clientDoc = couchGet.docs[0];
                let foundDoc = clientDoc.media.find((x, i, arr) => { 
                    if (x.mediaUuid === mediaUuid) { 
                        clientDoc.media[i].dateDeleted = new DateFormatter().toString();
                        return clientDoc.media[i];
                    } else {
                        return null;
                    }
                });

                if (foundDoc) { 
                    let couchResponse = await System.DB.save(clientDoc); 
                    return Promise.resolve(DuuzraMediaMapper.mapToObj(foundDoc));
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

     
    public async updateMedia(clientUuid: string, media: IDuuzraMediaDto): Promise<IDuuzraMediaDto> { 
        console.log("media.repository.ts updateMedia()");
        try { 
            let mediaDoc = DuuzraMediaMapper.mapToDoc(media);  
            let couchGet = await System.DB.get('duuzraClient', 'id', 'duuzra-client_' + clientUuid) as any; 
            if (couchGet.docs.length === 1) { 
                let clientDoc = couchGet.docs[0];
                let found = clientDoc.media.find((x, i, arr) => {
                    if (x.uuid === media.uuid) {
                        clientDoc.media.splice(i, 1, mediaDoc);
                        return true;
                    } else {
                        return false;
                    }
                });

                if (found) {
                    // save the client doc
                    let couchResponse = await System.DB.save(clientDoc);

                    // resolve with the deleted item
                    return Promise.resolve(DuuzraMediaMapper.mapToObj(mediaDoc));
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


    public async createMedia(clientUuid: string, media: IDuuzraMediaDto): Promise<IDuuzraMediaDto> {
        console.log("media.repository.ts CreateMedia()");
        try { 
            let mediaDoc = DuuzraMediaMapper.mapToDoc(media); 
            let couchGet = await System.DB.get('duuzraClient', 'id', 'duuzra-client_' + clientUuid) as any; 
            if (couchGet.docs.length === 1) {

                let clientDoc = couchGet.docs[0];
                if (clientDoc.media) {
                    clientDoc.media.push(mediaDoc); // todo - check for conflict
                } else {
                    clientDoc.media = [mediaDoc];
                }

                // save the client doc
                let couchResponse = await System.DB.save(clientDoc);
            } else { 
                return Promise.reject<IDuuzraMediaDto>(null);
            }

            // resolve with the created item
            return Promise.resolve(DuuzraMediaMapper.mapToObj(mediaDoc));
        } catch (err) { 
            return Promise.reject<IDuuzraMediaDto>(err);
        }
    }


    public async getDuuzraContentByUuid(duuzraUuid: string){
        console.log("media.repository.ts getDuuzraContentByUuid()");
        try{
            let contentbackgroundUuid = [];
            let rawDuuzra = await System.DB.get('duuzraDuuzra', 'id', 'duuzra-duuzra_' + duuzraUuid) as any;

            for (let data of rawDuuzra.docs[0].contents){
                if (data.backgroundUuid !== undefined){
                    contentbackgroundUuid.push(data.backgroundUuid);
                }
                if (data.contentType === "Hotspot"){
                    contentbackgroundUuid.push(data.backgroundMedia.mediaUuid);
                }
            }
            return contentbackgroundUuid;
        }catch (err){
            return null;
        }

    }
 
}

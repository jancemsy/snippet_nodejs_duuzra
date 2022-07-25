import { System } from '../../shared/index';
import { IMediaVideoDoc } from '../../models/media-video-doc';
import { MediaVideoMapper } from './mappers/video.mapper';
import { DateFormatter } from '../../duuzra_types/common';

export abstract class IVideoRepository {
    public abstract async save(doc: IMediaVideoDoc): Promise<{}>;
}

export class VideoRepository implements IVideoRepository {

    public save = (doc: IMediaVideoDoc): Promise<IMediaVideoDoc> => {
        console.log("video.repository.ts save()");

        return new Promise((resolve, reject) => {
            try{
                System.DB.save(doc)
                .then((updatedDoc: IMediaVideoDoc) => {
                    resolve(updatedDoc);
                })
                .catch((err: string) => {
                    reject(err);
                });
            }catch (err){
                reject(err);
            }

        });
    }

    public getVideoById = (docId: string): Promise<IMediaVideoDoc> => {
        console.log("video.repository.ts getVideoByID()");
        let type = 'mediaVideo';
        let key = docId;

        return new Promise((resolve, reject) => {
            try{
                System.DB.get(type, 'id', key)
                .then((doc: any) => {
                    if (doc.docs.length === 1) {
                        resolve(doc.docs[0]);
                    } else {
                        if (doc.docs.length === 0) {
                            reject('No records found');
                        }
                        reject('More than one record found');
                    }
                })
                .catch((err: string) => {
                    reject(err);
                });
            }catch (err){
                reject(err);
            }

        });
    }

    /**
     * Deletes the video with the specified id
     */
    public async deleteVideo(clientUuid: string, mediaUuid: string): Promise<IMediaVideoDoc> {
        console.log("video.repository.ts deleteVideo()");
        try {
            let deletedArr = null;
            let couchGet = await System.DB.get('mediaVideo', 'id', mediaUuid) as any; 
            if (couchGet.docs.length === 1) {
                let clientDoc = couchGet.docs[0];
                clientDoc.dateDeleted = new DateFormatter().toString();
                let couchResponse = await System.DB.save(clientDoc); 
                return Promise.resolve(clientDoc);
            } else { 
                return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
                //return Promise.reject<IMediaVideoDoc>(null);
            }
        } catch (err) { 
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
            //return Promise.reject<IMediaVideoDoc>(err);
        }
    }
}

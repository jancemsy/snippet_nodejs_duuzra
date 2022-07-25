import { System } from '../../shared/index';
import { IMediaImageDoc } from '../../models/media-image-doc';
import { DateFormatter } from '../../duuzra_types/common';

export abstract class IImageRepository {
    public abstract async save(doc: IMediaImageDoc): Promise<{}>;
}

export class ImageRepository implements IImageRepository { 
    constructor() { } 
    public save = (doc: IMediaImageDoc): Promise<IMediaImageDoc> => {  
        console.log("image.repository.ts save()");
        return new Promise((resolve, reject) => {
            try{
                System.DB.save(doc)
                .then((updatedDoc: IMediaImageDoc) => {
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

    public getImageById = (docId: string): Promise<IMediaImageDoc> => {
        console.log("image.repository.ts getImageById()");
        let type = 'mediaImage';
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
 

    public async deleteImage(clientUuid: string, mediaUuid: string): Promise<IMediaImageDoc> {
        console.log("image.repository.ts deleteImage()");
        try {
            let deletedArr = null;
            let couchGet = await System.DB.get('mediaImage', 'id', mediaUuid) as any; 
            if (couchGet.docs.length === 1) {
                let clientDoc = couchGet.docs[0];
                clientDoc.dateDeleted = new DateFormatter().toString();
                let couchResponse = await System.DB.save(clientDoc) 
                return Promise.resolve(clientDoc);
            } else { 
                return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
                //return Promise.reject<IMediaImageDoc>(null);
            }
        } catch (err) { 
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
            //return Promise.reject<IMediaImageDoc>(err);
        }
    }

   public  getHigherQualityImageById = (docId: string): Promise<IMediaImageDoc> => {
    console.log("image.repository.ts getHigherQualityImageById()");
    
    let type = 'mediaImage';
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
 
 
}

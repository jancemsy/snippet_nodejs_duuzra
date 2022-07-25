import { IMediaPresentationDoc } from '../../models/media-presentation';
import { System } from '../../shared/system';
import { IMediaDocumentDoc } from '../../models/media-document';
import { IGetMediaDocument, IMediaDocumentDto } from '../../duuzra_types/media';
import { MediaPresentationMapper } from './mappers/media-presentation.mapper';
import { MediaDocumentMapper } from './mappers/media-document.mapper';
import { IDuuzraMediaDto } from '../../duuzra_types/duuzras';
import { DateFormatter } from '../../duuzra_types/common';

export abstract class IDocumentRepository {
    public abstract savePresentation(doc: IMediaPresentationDoc): Promise<IMediaPresentationDoc>;
    public abstract saveDocument(doc: IMediaDocumentDoc): Promise<IMediaDocumentDoc>;
    public abstract deletePresentation(clientUuid: string, uuid: string): Promise<IMediaDocumentDto>;
    // public abstract deleteDocument(clientUuid: string, uuid: string): Promise<IMediaDocumentDto>;
    public abstract getPresentation(model: IGetMediaDocument, mediaDto?: IDuuzraMediaDto): Promise<IMediaDocumentDto>;
    public abstract getDocument(model: IGetMediaDocument, mediaDto?: IDuuzraMediaDto): Promise<IMediaDocumentDto>;
}

export class DocumentRepository implements IDocumentRepository {

    public savePresentation = (doc: IMediaPresentationDoc): Promise<IMediaPresentationDoc> => {
        console.log("document.repository.ts savePresentation()");

        return new Promise((resolve, reject) => {
            try {
                System.DB.save(doc)
                    .then((updatedDoc: IMediaPresentationDoc) => {
                        resolve(updatedDoc);
                    })
                    .catch((err: string) => {
                        reject(err);
                    });
            } catch (err) {
                reject(err);
            }

        });
    }

    public saveDocument = (doc: IMediaDocumentDoc): Promise<IMediaDocumentDoc> => {
        console.log("document.repository.ts saveDocument()");
        return new Promise((resolve, reject) => {
            try {
                System.DB.save(doc)
                    .then((updatedDoc: IMediaDocumentDoc) => {
                        resolve(updatedDoc);
                    })
                    .catch((err: string) => {
                        reject(err);
                    });
            } catch (err) {
                reject(err);
            }

        });
    }

    public getPresentation = (model: IGetMediaDocument, mediaDto?: IDuuzraMediaDto): Promise<IMediaDocumentDto> => {
        console.log("document.repository.ts getPresentation()");
        let type = MediaPresentationMapper.getDesignType();
        let view = 'id';
        let key = model.docId;

        return new Promise((resolve, reject) => {
            try {
                System.DB.get(type, view, key)
                    .then((doc: any) => {

                        if (doc.docs.length === 1) {
                            let document: IMediaPresentationDoc = doc.docs[0];
                            let documentDto: IMediaDocumentDto = MediaDocumentMapper.mapPresentationToDto(document, mediaDto);
                            resolve(documentDto);
                        } else {
                            if (doc.docs.length === 0) {
                                reject('No records found');
                            }
                            reject('More than one record found');
                        }
                    })
                    .catch((err: any) => {
                        reject(err);
                    });
            } catch (err) {
                reject(err);
            }

        });
    }

    public getDocument = (model: IGetMediaDocument, mediaDto?: IDuuzraMediaDto): Promise<IMediaDocumentDto> => {
        console.log("document.repository.ts getDocument()");
        let type = MediaDocumentMapper.getDesignType();
        let view = 'id';
        let key = model.docId;

        return new Promise((resolve, reject) => {
            try {
                System.DB.get(type, view, key)
                    .then((doc: any) => {

                        if (doc.docs.length === 1) {
                            let document: IMediaDocumentDoc = doc.docs[0];
                            let documentDto: IMediaDocumentDto = MediaDocumentMapper.mapDocumentToDto(document, mediaDto);
                            resolve(documentDto);
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
            } catch (err) {
                reject(err);
            }

        });
    } 

    public async deletePresentation(clientUuid: string, mediaUuid: string): Promise<IMediaDocumentDto> {
        console.log("document.repository.ts deletePresentation()");
        try {
            let deletedArr = null;
            let couchGet = await System.DB.get('mediaPresentation', 'id', mediaUuid) as any; 
            if (couchGet.docs.length === 1) {
                let clientDoc = couchGet.docs[0];
                clientDoc.dateDeleted = new DateFormatter().toString(); 
                let couchResponse = await System.DB.save(clientDoc); 
                return Promise.resolve(MediaDocumentMapper.mapPresentationToDto(clientDoc));
            } else { 
                return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
                //return Promise.reject<IMediaDocumentDto>(null);
            }
        } catch (err) { 
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
            //return Promise.reject<IMediaDocumentDto>(err);
        }
    }
 
    public async deleteDocument(clientUuid: string, mediaUuid: string): Promise<IMediaDocumentDto> {
        console.log("document.repository.ts deleteDocument()");
        try {
            let deletedArr = null;
            let couchGet = await System.DB.get('mediaDocument', 'id', mediaUuid) as any;

            if (couchGet.docs.length === 1) {
                let clientDoc = couchGet.docs[0];
                clientDoc.dateDeleted = new DateFormatter().toString(); 
                let couchResponse = await System.DB.save(clientDoc); 
                return Promise.resolve(MediaDocumentMapper.mapDocumentToDto(clientDoc));
            } else { 
                return Promise.reject<IMediaDocumentDto>(null);
            }
        } catch (err) { 
            return Promise.reject<IMediaDocumentDto>(err);
        }
    }
}

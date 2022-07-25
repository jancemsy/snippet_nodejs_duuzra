import { CommunicationVerb } from '../../duuzra_types/network';
import { MediaServiceBase } from '../../core/services/index';
import { ITokenProvider } from '../../core/token/index';
import { IDuuzraTokenPayload } from '../../duuzra_types/security';
import { DocumentRepository } from '../../media/document/document.repository';
import { ImageRepository } from '../../media/index';
import * as path from 'path';
import * as gm from 'gm';
import { MediaRepository } from './media.repository';
import { VideoRepository } from '../../media/video/video.repository';
import { IMediaDocumentDoc } from '../../models/media-document';
import { IMediaImageDoc } from '../../models/media-image-doc';
import fs = require('fs');
import { IDuuzraMediaDto, IDuuzraDto } from '../../duuzra_types/duuzras';
import { IGenerateMedia, IMediaDocumentDto, IMediaMediaDto, IMediaStorageDetail, MediaDocumentDto, MediaImageDto, MediaVideoDto } from '../../duuzra_types/media';
import { IMediaPresentationDoc } from '../../models/media-presentation';
import { IMediaVideoDoc } from '../../models/media-video-doc';
import archiver = require('archiver');
import { DuuzraDuuzraRepository } from '../duuzra-duuzra/index'; 
const uuidGen = require('uuid/v1');

export interface IMediaService {
    get(token: string, correlationId: string, scopeUuid: string, uuid: string): Promise<IDuuzraMediaDto>;
    get(token: string, correlationId: string, scopeUuid: string, filters?: any, sort?: any): Promise<IDuuzraMediaDto[]>;
    getMediaMedia(token: string, correlationId: string, scopeUuid: string, filter?: any, sort?: any): Promise<IMediaMediaDto[]>;
    getMediaDtoFromDuuzraMediaDto(mediaItem: IDuuzraMediaDto): Promise<IMediaMediaDto>;
    create(token: string, correlationId: string, scopeUuid: string, object: IDuuzraMediaDto): Promise<IDuuzraMediaDto>;
    exportMedia(token: string, correlationId: string, scopeUuid: string, filter: any, sort: any, options?: any): Promise<string>;
    update(token: string, correlationId: string, scopeUuid: string, object: IDuuzraMediaDto): Promise<IDuuzraMediaDto>
    delete(token: string, correlationId: string, scopeUuid: string, uuid: string, options?: any): Promise<IDuuzraMediaDto>;
    saveAdHocFiles(duuzraUuid: string, uuid: string, mediaType: string, object: any): Promise<IDuuzraDto>;
}

export class MediaService extends MediaServiceBase<IDuuzraMediaDto> implements IMediaService { 
    private mediaRepo: MediaRepository;
    private imageRepo: ImageRepository;
    private videoRepo: VideoRepository;
    private documentRepo: DocumentRepository;
    private duuzraRepo: DuuzraDuuzraRepository; 
    constructor() {
        super();
        this.mediaRepo = new MediaRepository();
        this.imageRepo = new ImageRepository();
        this.videoRepo = new VideoRepository();
        this.documentRepo = new DocumentRepository();
        this.duuzraRepo = new DuuzraDuuzraRepository();
    } 
    public async get(token: string, correlationId: string, scopeUuid: string, uuid: string): Promise<IMediaMediaDto>;
    public async get(token: string, correlationId: string, scopeUuid: string, filters?: any, sort?: any): Promise<IMediaMediaDto[]>;
    public async get(token: string, correlationId: string, scopeUuid: string, filters?: any, sort?: any): Promise<IMediaMediaDto | IMediaMediaDto[]> {
        console.log("media.service.ts get()");
        if (this.isUuidQuery(filters)) {
            return this.processBase(
                token,
                this.validateResourceGet(),
                () => this.getMediaMediaAction(this.tokenProvider, correlationId, scopeUuid, filters as string)
            ) as Promise<IMediaMediaDto>;
        } else {
            return this.processBase(
                token,
                this.validateResourceGet(),
                () => this.getMediaMediaAction(this.tokenProvider, correlationId, scopeUuid, filters, sort)
            ) as Promise<IMediaMediaDto[]>;
        }
    }

    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuid: string): Promise<IDuuzraMediaDto>;
    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, filters?: any, sort?: any): Promise<IDuuzraMediaDto[]>;
    public async getAction(
        tokenProvider: ITokenProvider,
        correlationId: string,
        scopeUuid: string,
        filters?: any,
        sort?: any
    ): Promise<IDuuzraMediaDto | IDuuzraMediaDto[]> {  
        console.log("media.service.ts getAction()");
        if (this.isUuidQuery(filters)) { 
            return await this.mediaRepo.getMediaByUuid(filters as string);
        } else if (!filters || (!!filters.showAccountUploads && !filters.duuzraUuid)) { 
            this.throwInvalidParametersError();
        } else { 
            const duuzraUuid: string = filters.duuzraUuid;
            const map: Map<boolean, () => Promise<IDuuzraMediaDto[]>> = new Map();
            map.set(!!scopeUuid, () => this.mediaRepo.getMediaByClient(scopeUuid)); 
            if (filters.showAccountUploads) { delete filters.duuzraUuid; } 
            let results = await this.getResultsFromPrioritizedConditions(map, filters, sort); 
            if (results != null) {
                if (!filters.showAccountUploads && duuzraUuid) {
                    let duuzraContentBackgroundMediaUuid = await this.mediaRepo.getDuuzraContentByUuid(duuzraUuid);
                    if (duuzraContentBackgroundMediaUuid[0]) { 
                        let res = [];
                        for (let data of duuzraContentBackgroundMediaUuid) {
                            results.forEach((val) => {
                                if (val.uuid === data) {
                                    res.push(val);
                                }
                            });
                        }
                        results = res;
                    } else { 
                        results = results.filter((item) => {
                            return item.duuzraUuid === duuzraUuid;
                        });

                    } 
                }
            }
            return results;
        }
    }


    public async getMediaMediaAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuid: string, options?: any): Promise<IMediaMediaDto>;
    public async getMediaMediaAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, filters: any, sort: any, options?: any): Promise<IMediaMediaDto[]>
    public async getMediaMediaAction(
        tokenProvider: ITokenProvider,
        correlationId: string,
        scopeUuid: string,
        filters?: any,
        sort?: any
    ): Promise<IMediaMediaDto | IMediaMediaDto[]> { 
        console.log("media.service.ts getMediaAction()");
        if (this.isUuidQuery(filters)) {
            const resultSingle: IDuuzraMediaDto = await this.getAction(this.tokenProvider, correlationId, scopeUuid, filters as string);
            const resultSingleMedia: IMediaMediaDto = await this.getMediaDtoFromDuuzraMediaDto(resultSingle);
            return resultSingleMedia;
        } else {
            let results: IDuuzraMediaDto[];

            let resultsMedia: IMediaMediaDto[] = [];
            let currentResultMedia: IMediaMediaDto = null;
            if (filters) {
                if (filters.operation || filters.operation !== undefined) {
                    if (filters.operation === "export") {
                        results = await this.mediaRepo.getMediaByClientForExport(scopeUuid); 
                    }
                } else { 
                    results = await this.getAction(this.tokenProvider, correlationId, scopeUuid, filters, sort); 
                }
            }  

            if (results !== null) {
                for (let result of results) {
                    currentResultMedia = await this.getMediaDtoFromDuuzraMediaDto(result);
                    resultsMedia.push(currentResultMedia);
                }
            }
 
            if (!!filters && (!filters.showAccountUploads && filters.duuzraUuid)) {
                resultsMedia = resultsMedia.filter((item) => {
                    return item.duuzraUuid === filters.duuzraUuid;
                });
            }

            return resultsMedia;
        }
    }

    public async getMediaMedia(token: string, correlationId: string, scopeUuid: string, uuid: string): Promise<IMediaMediaDto>;
    public async getMediaMedia(token: string, correlationId: string, scopeUuid: string, filters: any, sort: any): Promise<IMediaMediaDto[]>;
    public async getMediaMedia(token: string, correlationId: string, scopeUuid: string, filters?: any, sort?: any, uuid?: string): Promise<IMediaMediaDto | IMediaMediaDto[]> { 
        console.log("media.service.ts getMediaMedia()");
        if (this.isUuidQuery(filters)) {
            return this.processBase(
                token,
                this.validateResourceGet(),
                () => this.getMediaMediaAction(this.tokenProvider, correlationId, scopeUuid, uuid)
            ) as Promise<IMediaMediaDto>;
        } else if (!filters || (!!filters.showAccountUploads && !filters.duuzraUuid)) {
            this.throwInvalidParametersError();
        } else {
            return this.processBase(
                token,
                this.validateResourceGet(),
                () => this.getMediaMediaAction(this.tokenProvider, correlationId, scopeUuid, filters, sort)
            ) as Promise<IMediaMediaDto[]>;
        }
    }

    public async exportMedia(token: string, correlationId: string, scopeUuid: string, filter: any, sort: any, options?: any): Promise<string> {
        console.log("media.service.ts exportMedia()");
        return this.processBase(
            token,
            this.validateResourceGet(),
            () => this.exportMediaAction(this.tokenProvider, correlationId, scopeUuid, filter, sort, options)
        );
    }

    private pad(num) {
        const s = '00' + num;
        return s.substr(s.length - 2);
    }

    public async getMediaDtoFromDuuzraMediaDto(mediaItem: IDuuzraMediaDto): Promise<IMediaMediaDto> {
        console.log("media.service.ts getMediaDtoFromDuuzraMediaDto()");
        try {
            switch (mediaItem.mediaType) {
                case 'image': {
                    const imageDoc: IMediaImageDoc = await this.imageRepo.getImageById(mediaItem.mediaUuid);
                    const rootPath = this.getAbsoluteFilePath(imageDoc.original.path);
                    const mediaImageDto: MediaImageDto = new MediaImageDto(
                        mediaItem.uuid,
                        mediaItem.duuzraUuid,
                        mediaItem.mediaType,
                        mediaItem.mediaUuid,
                        imageDoc.description,
                        imageDoc.name,
                        imageDoc.originalFileName,
                        (!!imageDoc.converted && !!imageDoc.converted['120 x 90']) ? imageDoc.converted['120 x 90'].path : null,
                        imageDoc.original.path,
                        path.basename(rootPath),
                        this.convertBytesToString(fs.statSync(rootPath).size),
                        imageDoc.dateCreated,
                        imageDoc.dateDeleted,
                        imageDoc.original.width,
                        imageDoc.original.height,
                        imageDoc.converted['120 x 90'].path,
                        (!!imageDoc.converted && !!imageDoc.converted['300 x 300']) ? imageDoc.converted['300 x 300'].path : null,
                        imageDoc.isAdHoc
                    );
                    return Promise.resolve<MediaImageDto>(mediaImageDto);
                }
                case 'video': {
                    const videoDoc: IMediaVideoDoc = await this.videoRepo.getVideoById(mediaItem.mediaUuid);
                    const rootPath = this.getAbsoluteFilePath(videoDoc.original.path);
                    const mediaVideoDto: MediaVideoDto = new MediaVideoDto(
                        mediaItem.uuid,
                        mediaItem.duuzraUuid,
                        mediaItem.mediaType,
                        mediaItem.mediaUuid,
                        videoDoc.description,
                        videoDoc.name,
                        videoDoc.originalFileName,
                        videoDoc.original.path,
                        path.basename(rootPath),
                        this.convertBytesToString(fs.statSync(rootPath).size),
                        videoDoc.dateCreated,
                        videoDoc.dateDeleted,
                        videoDoc.original.width,
                        videoDoc.original.height,
                        videoDoc.original.thumbnailPath,
                        videoDoc.isAdHoc
                    );
                    return Promise.resolve<IMediaMediaDto>(mediaVideoDto);
                }
                case 'document': {
                    const documentDto: IMediaDocumentDto = await this.documentRepo.getDocument({ docId: mediaItem.mediaUuid }, mediaItem);
                    return Promise.resolve<IMediaMediaDto>(documentDto);
                }
                case 'presentation':
                default: {
                    const presentationDto: IMediaDocumentDto = await this.documentRepo.getPresentation({ docId: mediaItem.mediaUuid }, mediaItem);
                    return Promise.resolve<IMediaMediaDto>(presentationDto);
                }
            }
        } catch (err) {
            return Promise.resolve<IMediaMediaDto>(null);
        }
    }
 

    public async createAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, object: IDuuzraMediaDto): Promise<IDuuzraMediaDto>;
    public async createAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, object: IDuuzraMediaDto[]): Promise<IDuuzraMediaDto[]>;
    public async createAction(
        tokenProvider: ITokenProvider,
        correlationId: string,
        scopeUuid: string,
        object: IDuuzraMediaDto | IDuuzraMediaDto[]
    ): Promise<IDuuzraMediaDto | IDuuzraMediaDto[]> {
        console.log("media.service.ts createAction()");
        return this.implementSingleOnly(CommunicationVerb.POST, object, () => {
            const objectSingle: IDuuzraMediaDto = object as IDuuzraMediaDto;
            const mediaDto: IDuuzraMediaDto = this.mapMediaToDoc(objectSingle);
            return this.mediaRepo.createMedia(scopeUuid, mediaDto);
        });
    }

    protected async updateAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, object: IDuuzraMediaDto): Promise<IDuuzraMediaDto> {
        console.log("media.service.ts updateAction()");
        const mediaDto: IDuuzraMediaDto = this.mapMediaToDoc(object);
        return this.mediaRepo.updateMedia(scopeUuid, mediaDto);
    }

    protected async deleteAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuid: string, options?: any): Promise<IDuuzraMediaDto>;
    protected async deleteAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuids: string[], options?: any): Promise<IDuuzraMediaDto[]>;
    protected async deleteAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuids: string | string[], options?: any): Promise<IDuuzraMediaDto | IDuuzraMediaDto[]> {
        console.log("media.service.ts deleteAction()");
        return this.implementSingleOnly(CommunicationVerb.POST, uuids, async () => {
            if (!!options) {
                const uuidSingle: string = uuids as string;
                switch (options.mediaType) {
                    case 'video': {
                        this.videoRepo.deleteVideo(scopeUuid, uuidSingle);
                        break;
                    }
                    case 'presentation': {
                        this.documentRepo.deletePresentation(scopeUuid, uuidSingle);
                        break;
                    }
                    case 'document': {
                        this.documentRepo.deleteDocument(scopeUuid, uuidSingle);
                        break;
                    }
                    default: {
                        this.imageRepo.deleteImage(scopeUuid, uuidSingle);
                        break;
                    }
                }
                return this.mediaRepo.deleteMedia(scopeUuid, uuidSingle);
            }
        });
    } 

    private mapMediaToDoc(media: IGenerateMedia): IDuuzraMediaDto {
        const mediaDto: IDuuzraMediaDto = {
            mediaType: media.mediaType,
            mediaUuid: media.mediaUuid,
            uuid: null,
            duuzraUuid: media.duuzraUuid,
            dateDeleted: null,
            isAdHoc: media.isAdHoc
        };
        return mediaDto;
    }

    private convertBytesToString(size: any): string {
        const i: any = Math.floor(Math.log(size) / Math.log(1024));
        return (size / Math.pow(1024, i) * 1).toFixed(2) + ' ' + ['b', 'kb', 'mb', 'gb', 'tb'][i];
    };

    public async saveAdHocFiles(duuzraUuid: string, uuid: string, mediaType: string, object: any): Promise<IDuuzraDto> { 
        console.log("media.service.ts saveAdHocFiles()");
        return this.duuzraRepo.saveAdHocFiles(duuzraUuid, uuid, mediaType, object);
    }

    private async exportMediaAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, filters?: any, sort?: any, options?: any): Promise<string> {
        console.log("media.service.ts exportMediaAction()");
        return new Promise<string>(async (resolve, reject) => { 
            let results: IMediaMediaDto[] = await this.getMediaForExport(tokenProvider, correlationId, scopeUuid, filters, sort, options); 
            let duuzraContents = [];
            let myresult = [];
            let myPagesResult = [];
            let duuzrainfos;
            let thumbbol = true;
            let duuzras: IDuuzraDto = await this.duuzraRepo.getDuuzraDuuzraById(filters.duuzraUuid).then((myduuzra) => {
                return myduuzra;
            });

            let jsonDuuzras = JSON.parse(JSON.stringify(duuzras));
            (duuzras.contents).forEach((content) => {
                duuzraContents.push(content);
            });
            duuzrainfos = jsonDuuzras.info;

            if (results) {
                results.forEach((item) => {

                    duuzraContents.forEach((myitem) => {
                        if (item.uuid === myitem.backgroundUuid) {
                            myresult.push(item);
                            return false;
                        }
                        if (thumbbol) {
                            if (item.uuid === duuzrainfos.thumbnailUuid) {
                                myresult.push(item);
                                thumbbol = false;
                                return false;
                            }
                        }

                        if (myitem.contentType === "PageBuilder") {
                            for (let data of myitem.pages) {

                                if (data.imageMediaUuid === item.mediaUuid) {

                                    myresult.push(item);
                                    return false;
                                }
                            }
                        }

                        if (myitem.contentType === "Hotspot") {
                            if (myitem.backgroundMedia.uuid === item.mediaUuid || myitem.backgroundMedia.uuid === item.uuid) {
                                myresult.push(item);
                                return false;
                            }
                        }

                    });
                });

                results = myresult;
            } 
 
            let sortedResults: IMediaMediaDto[] = [];
            results.forEach((data, i, ss) => {
                if (i === 0) {
                    sortedResults.push(data);
                } else {
                    let bol = true;
                    sortedResults.forEach((data2) => {
                        if (data2.uuid === data.uuid) {
                            bol = false;
                            return false;
                        }
                    });
                    if (bol) {
                        sortedResults.push(data);
                    }
                }
            });

            sortedResults = results; 
            const today = Date.now();
            const date = new Date(today);
            const dateString = this.pad(date.getMonth() + 1) + '-' + this.pad(date.getDate()) + '-' + date.getFullYear(); 
            const outputZipFilePath: string = `uploads/${filters.name}_${dateString}_${filters.email}.zip`;
            const output: fs.WriteStream = fs.createWriteStream(outputZipFilePath);
            const archive: archiver.Archiver = archiver('zip', {
                zlib: { level: 9 }
            });

            output.on('close', (data) => {
                resolve(outputZipFilePath);
            });

            archive.on('warning', (err) => {
                if (err.code !== 'ENOENT') {
                    reject(err);
                }
            });
            archive.on('error', (err) => {
                reject(err);
            }); 
            archive.pipe(output); 
            for (const convertedMediaItem of sortedResults) {

                if (convertedMediaItem) {
                    switch (convertedMediaItem.mediaType) {
                        case 'video':
                            const videoDto: MediaVideoDto = convertedMediaItem as MediaVideoDto;
                            archive.file(videoDto.fileName, { name: videoDto.fileName });
                            break;
                        case 'image':
                            const imageDto: MediaImageDto = convertedMediaItem as MediaImageDto;
                            archive.file(imageDto.path, { name: imageDto.path });
                            break; 
                        case 'presentation':
                            const documentDto2: MediaDocumentDto = convertedMediaItem as MediaDocumentDto;
                            archive.file(documentDto2.path, { name: documentDto2.path }); 
                            break;
                        case 'document':
                            const documentDto1: MediaDocumentDto = convertedMediaItem as MediaDocumentDto;
                            archive.file(documentDto1.path, { name: documentDto1.path });
                            break;
                        
                        default:
                            break;
                    }
                }
            }
            archive.finalize();
        });
    }

    private async getMediaForExport(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, filters: any, sort: any, options?: any): Promise<IMediaMediaDto[]> { 
        console.log("media.service.ts getMediaForExport()");
        let results: IDuuzraMediaDto[]; 
        let resultsMedia: IMediaMediaDto[] = [];

        let currentResultMedia: IMediaMediaDto = null;
        if (filters) {
            if (filters.operation || filters.operation !== undefined) {
                if (filters.operation === "export") {
                    results = await this.mediaRepo.getMediaByClientForExport(scopeUuid);
                }
            } else { 
                results = await this.getAction(this.tokenProvider, correlationId, scopeUuid, filters, sort);
            }
        }

        if (results !== null) {
            for (let result of results) {
                currentResultMedia = await this.getMediaDtoFromDuuzraMediaDto(result) 
                resultsMedia.push(currentResultMedia);
            }
        } 

        return resultsMedia;

    }


}

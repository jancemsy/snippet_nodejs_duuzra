import { IDuuzraMediaDto, IAttendeeDto, IGroupDto } from '../../duuzra_types/duuzras';
import {
    IConvertedMedia,
    IGenerateMedia,
    IGetMediaDocument,
    IMediaDetails,
    IMediaDocumentDetails,
    IMediaDocumentDto,
    IMediaDocumentResponse,
    IMediaPage,
    IMediaPresentationResponse,
    IOptimizeImage,
    IUploadedCsvResponse,
    MediaDocumentDto
} from '../../duuzra_types/media';

import * as pdfPageCount from 'pdf_page_count';
import * as uuid from 'uuid';
import { DocumentConfig } from '../../document.config';
import { MediaService, GroupService } from '../../duuzras/index';
import { IMediaService } from '../../duuzras/media/media.service';
import { DuuzraUserService } from '../../duuzras/user/duuzra-user.service';
import { IMediaDocumentDoc } from '../../models/media-document';
import { IMediaPresentationDoc } from '../../models/media-presentation';
import { MediaServiceBase } from '../../shared/index';
import { UserDocument } from '../../shared/user/models/user-document';
import { UserService } from '../../shared/user/user.service';
import { ImageService } from '../image/image.service';
import { IDuuzraTokenPayload } from '../../duuzra_types/security';
import exec = require('child_process');
import * as csv from 'fast-csv';
import * as fs from 'fs';
import * as graphicsMajick from 'gm';
import * as im from 'imagemagick';
import * as path from 'path';
import { DocumentRepository } from './document.repository';
import { MediaDocumentMapper } from './mappers/media-document.mapper';
import { MediaPresentationMapper } from './mappers/media-presentation.mapper';
import { DuuzraUserMapper } from '../../duuzras/user/duuzra-user.mapper'; 
const uuidgen = require('uuid/v1');

export abstract class IDocumentService {
    public abstract savePresentation(authToken: string, correlationId: string, tokenPayload: IDuuzraTokenPayload, duuzraUuid: string, model: IMediaDocumentDetails, isAdHoc: boolean): Promise<MediaDocumentDto>;
    public abstract saveDocument(authToken: string, correlationId: string, tokenPayload: IDuuzraTokenPayload, duuzraUuid: string, model: IMediaDocumentDetails, isAdHoc: boolean): Promise<MediaDocumentDto>;
    public abstract getDocument(mediaUuid: uuid): Promise<IMediaDocumentDto>;
    public abstract getPresentation(mediaUuid: uuid): Promise<IMediaDocumentDto>;
    public abstract async convertDocumentToImages(path: string): Promise<IConvertedMedia>;
    public abstract pdfToImages(absolutePath: string, path: string, pageCount: number): Promise<IConvertedMedia>;
    public abstract documentToPdf(path: string): Promise<string>;
    public abstract getExampleCsv(): Promise<string>;
    public abstract uploadCsvForUsers(
        authToken: string,
        correlationId: string,
        tokenPayload: IDuuzraTokenPayload,
        duuzraId: string,
        file: Express.Multer.File,
        createdByEmail: string): Promise<IUploadedCsvResponse>;
}

export class DocumentService extends MediaServiceBase implements IDocumentService {
    private documentRepo: DocumentRepository;
    private imageService: ImageService;
    private mediaService: IMediaService;
    private _emailRegex: RegExp = new RegExp(`^([a-zA-Z0-9_\\-\\.]+)@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.)|(([a-zA-Z0-9\\-]+\\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\\]?)$`);

    private gm = graphicsMajick.subClass({ imageMagick: true });

    constructor() {
        super();
        this.documentRepo = new DocumentRepository();
        this.imageService = new ImageService();
        this.mediaService = new MediaService();

        im.convert.path = DocumentConfig.imageMajickConvertPath;
    }


    public getDocument(mediaUuid: uuid): Promise<IMediaDocumentDto> {
        console.log("document.service.ts getDocument()");
        
                return new Promise<IMediaDocumentDto>((resolve, reject) => {
                    this.documentRepo
                        .getDocument(mediaUuid)
                        .then((doc: IMediaDocumentDto) => {
                            resolve(doc);
                        })
                        .catch((err) => {
                            reject(err);
                        });
                });
            }


    public async saveDocument(authToken: string, correlationId: string, tokenPayload: IDuuzraTokenPayload, duuzraUuid: string, model: IMediaDocumentDetails, isAdHoc: boolean): Promise<MediaDocumentDto> {
        console.log("document.service.ts saveDocument()");
        try {
            let mediaDocumentDto: MediaDocumentDto;
            const fileWithExtension = await this.renameWithExtension(model.path, model.originalName);
            let convertedMedia: IConvertedMedia = await this.convertDocumentToImages(fileWithExtension).catch((err) => {
                console.error(err);
                return Promise.reject(err);
            });

            let resolution: number[] = await this.getImageResolution(convertedMedia.pages[0].path).catch((err) => {
                console.error(err);
                return Promise.reject(err);
            });

            let documentSaved: IMediaDocumentDoc = await this.documentRepo.saveDocument(MediaDocumentMapper.mapToDoc(convertedMedia, model.description, model.name, resolution[0], resolution[1], model.originalName, null, isAdHoc)).catch((err) => {
                console.error(err);
                return Promise.reject(err);
            });

            const duuzraMediaDto: IDuuzraMediaDto = {
                mediaType: 'document',
                mediaUuid: documentSaved._id,
                duuzraUuid,
                uuid: null,
                dateDeleted: null,
                isAdHoc: isAdHoc
            };
            const clientUuid = tokenPayload.claims.filter((claim) => {
                return claim.indexOf('duuzra.client') !== -1;
            })[0].split('.')[2];
            const media: IDuuzraMediaDto = await this.mediaService.create(authToken, correlationId, clientUuid, duuzraMediaDto).catch((err) => {
                console.error(err);
                return Promise.reject(err);
            });
            let flag = this.getBoolean(isAdHoc);
            if (flag) {
                let duuzraDuuzra = await this.mediaService.saveAdHocFiles(duuzraMediaDto.duuzraUuid, duuzraMediaDto.mediaUuid, duuzraMediaDto.mediaType, convertedMedia).catch((err) => {
                    console.error(err);
                    return Promise.reject(err);
                });
            }
            mediaDocumentDto = (await this.mediaService.getMediaDtoFromDuuzraMediaDto(media).catch((err) => {
                console.error(err);
                return Promise.reject(err);
            })) as MediaDocumentDto;
            return Promise.resolve(mediaDocumentDto);
        } catch (err) {
            console.error(err);
            return Promise.reject<MediaDocumentDto>(err);
        }
    }

    private deleteDocumentFromDirectory(path: string): void {
        fs.unlink(path, (err) => { 
        });
    }

    public getExampleCsv(): Promise<string> {
        console.log("document.service.ts getExampleCsv()");

        return new Promise<string>((resolve, reject) => {
            fs.readFile('./src/media/document/files/sample.csv', 'utf8', (error, data) => { 
                resolve(data);
            });
        });
    }

    public getPresentation(mediaUuid: uuid): Promise<IMediaDocumentDto> {

        return new Promise<IMediaDocumentDto>((resolve, reject) => {
            this.documentRepo
                .getPresentation(mediaUuid)
                .then((doc: IMediaDocumentDto) => {
                    resolve(doc);
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }

    private async renameWithExtension(uploadedFilePath: string, originalFileName: string): Promise<string> {
        console.log("document.service.ts renameWithExtension()");

        return new Promise<string>((resolve, reject) => {
            const fragments: string[] = originalFileName.split('.');
            const originalFileExtension: string = fragments[fragments.length - 1];
            const renameTo: string = `${uploadedFilePath}.${originalFileExtension}`;
            fs.rename(uploadedFilePath, renameTo, (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(renameTo);
            });
        });
    }

    public async savePresentation(authToken: string, correlationId: string, tokenPayload: IDuuzraTokenPayload, duuzraUuid: string, model: IMediaDocumentDetails, isAdHoc: boolean): Promise<MediaDocumentDto> {
        console.log("document.service.ts savePresentation()");

        try {
            let mediaDocumentDto: MediaDocumentDto;
            const fileWithExtension = await this.renameWithExtension(model.path, model.originalName);
            let convertedMedia: IConvertedMedia = await this.convertDocumentToImages(fileWithExtension).catch((err) => {
                return Promise.reject(err);
            });

            let resolution: number[] = await this.getImageResolution(convertedMedia.pages[0].path);

            let mappedDoc = MediaPresentationMapper.mapToDoc(convertedMedia, model.description, model.name, resolution[0], resolution[1], model.originalName, null, isAdHoc);

            let presentationSaved: IMediaPresentationDoc = await this.documentRepo.savePresentation(mappedDoc).catch((saveErr) => {
                console.error(saveErr);
                return Promise.reject(saveErr);

            });

            const duuzraMediaDto: IDuuzraMediaDto = {
                mediaType: 'presentation',
                mediaUuid: presentationSaved._id,
                duuzraUuid,
                dateDeleted: null,
                uuid: null,
                isAdHoc: isAdHoc
            };
            const clientUuid = tokenPayload.claims.filter((claim) => {
                return claim.indexOf('duuzra.client') !== -1;
            })[0].split('.')[2];
            const media: IDuuzraMediaDto = await this.mediaService.create(authToken, correlationId, clientUuid, duuzraMediaDto).catch((err) => {
                console.error(err);
                return Promise.reject(err);
            });
            let flag = this.getBoolean(isAdHoc);
            if (flag) {
                let duuzraDuuzra = await this.mediaService.saveAdHocFiles(duuzraMediaDto.duuzraUuid, duuzraMediaDto.mediaUuid, duuzraMediaDto.mediaType, convertedMedia).catch((err) => {
                    console.error(err);
                    return Promise.reject(err);
                });
            }
            mediaDocumentDto = (await this.mediaService.getMediaDtoFromDuuzraMediaDto(media).catch((err) => {
                console.error(err);
                return Promise.reject(err);
            })) as MediaDocumentDto;
            return Promise.resolve(mediaDocumentDto);
        } catch (err) {
            console.error(err);
            return Promise.reject<MediaDocumentDto>(err);
        }
    }


    private convertBytesToString(size: any): string {
        const i: any = Math.floor(Math.log(size) / Math.log(1024));
        return (size / Math.pow(1024, i) * 1).toFixed(2) + ' ' + ['b', 'kb', 'mb', 'gb', 'tb'][i];
    };

    public getBoolean(value) {
        switch (value) {
            case true:
            case "true":
                return true;
            default:
                return false;
        }
    }

    
    public async convertDocumentToImages(filepath: string): Promise<IConvertedMedia> {

        console.log("document.service.ts convertDocumentToImages");

        let generatedPdfPath = await this.documentToPdf(filepath).catch((err) => {
            console.error(err);
            return Promise.reject<IConvertedMedia>(err);
        }); 

        if (generatedPdfPath) {
            let result: any = await this.pdfCount(generatedPdfPath).catch((err) => {
                console.error(err);
                return Promise.reject<IConvertedMedia>(err);
            });
 

            if (result.data) {
                let pageCount;

                try {
                    pageCount = parseInt(result.data, null);
                } catch (e) { 

                    return Promise.reject<IConvertedMedia>(e);
                } 

                const convertedMedia: IConvertedMedia = await this.pdfToImages(generatedPdfPath, filepath, pageCount).catch((convertErr) => {   
                    return Promise.reject<IConvertedMedia>(convertErr);
                }); 

                return Promise.resolve<IConvertedMedia>(convertedMedia);
            }
        } else {  
            Promise.reject<IConvertedMedia>('Failed to generate PDF from document.');
        }
    }

    public pdfToImages(absolutePath: string, path: string, pageCount: number): Promise<IConvertedMedia> {
        console.log("document.service.ts pdfToImages()");

        return new Promise<IConvertedMedia>((resolve, reject) => {
            im.convert(this.getDocumentConfig(absolutePath), async (convertErr, stdout) => {
                if (convertErr) {
                    return reject(convertErr);
                }

                const convertedMedia: IConvertedMedia = await this.createConvertedMedia(pageCount, absolutePath, path).catch((err) => {
                    console.error(err);
                    reject(err);
                });
                resolve(convertedMedia);
            });
        });
    }

    private async pdfCount(path: string): Promise<number> {
        console.log("document.service.ts pdfCount()");
        return new Promise<number>((resolve, reject) => {
            try {
                pdfPageCount.count(path, (result) => {
                    resolve(result);
                });
            } catch (err) {
                console.error(err);
                reject(err);
            }
        });
    }

    private async createConvertedMedia(pages: number, absolutePath: string, pdfPath: string): Promise<IConvertedMedia> {
        console.log("document.service.ts createConvertedMedia()");

        let response: IConvertedMedia = {
            originalPath: pdfPath,
            pageCount: pages,
            pages: [],
        };

        let promises: Promise<IOptimizeImage>[] = [];
        for (let i = 0; i < pages; i++) {
            let inputFilePath: string;
            if (pages === 1) {
                inputFilePath = `${pdfPath.split('.')[0]}.${DocumentConfig.imageExtention}`;
            } else {
                inputFilePath = `${pdfPath.split('.')[0]}-${i}.${DocumentConfig.imageExtention}`;
            }
            promises.push(
                this.imageService.optimizeImage(inputFilePath, DocumentConfig.imageExtention, null, inputFilePath)
            );
        }

        await Promise
            .all(promises)
            .then(async (optimizedImages: IOptimizeImage[]) => {
                for (let i = 0; i < pages; i++) {
                    let resolution: number[] = await this.getImageResolution(optimizedImages[i].path);
                    let page = {
                        uuid: uuidgen(),
                        pageNo: i + 1,
                        path: optimizedImages[i].path,
                        fileSize: this.convertBytesToString(fs.statSync(optimizedImages[i].path).size),
                        dimensions: resolution[0] + 'x' + resolution[1]
                    };

                    response.pages.push(page);
                    if (optimizedImages[i].originalPath !== optimizedImages[i].path) { // Presentations overwrite original with optimized so don't delete original
                        fs.unlink(optimizedImages[i].originalPath, (err) => { 
                        });
                    }
                }
            }).catch((err) => {
                Promise.reject(err);
            });

        return response;
    }
    public documentToPdf(path: string): Promise<string> {
        console.log("document.service.ts documentToPdf()");
        return new Promise<string>((resolve, reject) => {
            if (path.indexOf('.pdf') !== -1) {
                resolve(path);
            } else {
                const absolutePath = this.getAbsoluteFilePath(path);
                const commandString: string = DocumentConfig.libreOfficePath + ' ' + DocumentConfig.unoconvPath + ' -f pdf ' + absolutePath;
                exec.exec(commandString,
                    (err, stdout, stderr) => {
                        if (err) {
                            reject(err);
                        } else {
                            const pathParts: string[] = path.split('.');
                            const newPdfPath = path.replace(`.${pathParts[pathParts.length - 1]}`, '.pdf');
                            const newPdfAbsolutePath = this.getAbsoluteFilePath(newPdfPath);
                            resolve(newPdfAbsolutePath);
                        }
                    });
            }
        });
    }
    public uploadCsvForUsers(authToken: string, correlationId: string, tokenPayload: IDuuzraTokenPayload, duuzraId: string,
        file: Express.Multer.File, createdByEmail: string): Promise<IUploadedCsvResponse> {
            console.log("document.service.ts UploadCsvForUsers()");

        return new Promise<IUploadedCsvResponse>((resolve, reject) => {
            let failedUsers = [];
            let addedAttendee: IAttendeeDto[] = [];
            let userService: UserService = new UserService();
            let grpService: GroupService = new GroupService();
            let duuzraService: DuuzraUserService = new DuuzraUserService();
            let promises = [];
            let groups = [];
            let groupAssignment = [];
            let hasEmptyFields: boolean = false;
            let hasFailedOnData: boolean = false;
            let hasInvalidEmail: boolean = false;
            userService.getUserDetails();
            let duuzraattendee: any = [];
            let existingAttendee = [];
            let inputAttendees = [];

            try {
                let formatType: string;
                let rowCount = 0;
                csv.fromPath(file.path).on('data', (data) => {
                    if (data.length >= 3) {
                        let tempUser = { email: '', name: '', group: '', password: '' }

                        let buffer: string = data[0] as string;
                        let data1: string = data[0] as string;
                        let data2: string = data[1] as string;
                        let data3: string = data[2] as string;
                        let data4: string = '';

                        if (data.length === 4) {
                            data4 = data[3] as string;
                            tempUser.password = data4;
                        }

                        data1 = data1.toLowerCase();
                        data2 = data2.toLowerCase();
                        data3 = data3.toLowerCase();

                        // checks for different format of column/position
                        if (buffer === 'email' || buffer === 'name' || buffer === 'group' || buffer === 'password') {
                            if ((data1 === 'email' && data2 === 'name' && data3 === 'group') || data4 === 'password') {
                                formatType = 'email-name-group';
                            } else if ((data1 === 'email' && data2 === 'group' && data3 === 'name') || data4 === 'password') {
                                formatType = 'email-group-name';
                            } else if ((data1 === 'group' && data2 === 'email' && data3 === 'name') || data4 === 'password') {
                                formatType = 'group-email-name';
                            } else if ((data1 === 'group' && data2 === 'name' && data3 === 'email') || data4 === 'password') {
                                formatType = 'group-name-email';
                            } else if ((data1 === 'name' && data2 === 'group' && data3 === 'email') || data4 === 'password') {
                                formatType = 'name-group-email';
                            } else if ((data1 === 'name' && data2 === 'email' && data3 === 'group') || data4 === 'password') {
                                formatType = 'name-email-group';
                            } else {
                                reject({ addedUsers: [], error: 'Invalid CSV format', failedUsers: [], result: false });
                            }
                        } else {
                            if (rowCount === 0) {
                                reject({ addedUsers: [], error: 'Invalid CSV format', failedUsers: [], result: false });
                            } else {
                                // assign value from different field positions
                                switch (formatType) {
                                    case 'email-name-group': {
                                        tempUser.email = data1;
                                        tempUser.name = data2
                                        tempUser.group = data3;
                                        tempUser.password = data4;
                                        break;
                                    }
                                    case 'email-group-name': {
                                        tempUser.email = data1;
                                        tempUser.name = data3
                                        tempUser.group = data2;
                                        tempUser.password = data4;
                                        break;
                                    }
                                    case 'group-email-name': {
                                        tempUser.email = data2;
                                        tempUser.name = data3
                                        tempUser.group = data1;
                                        tempUser.password = data4;
                                        break;
                                    }
                                    case 'group-name-email': {
                                        tempUser.email = data3;
                                        tempUser.name = data2
                                        tempUser.group = data1;
                                        tempUser.password = data4;
                                        break;
                                    }
                                    case 'name-group-email': {
                                        tempUser.email = data3;
                                        tempUser.name = data1
                                        tempUser.group = data2;
                                        tempUser.password = data4;
                                        break;
                                    }
                                    default: {
                                        tempUser.email = data2;
                                        tempUser.name = data1
                                        tempUser.group = data3;
                                        tempUser.password = data4;
                                        break;
                                    }
                                }
                            }

                            if (tempUser.email === "" || tempUser.name === "" || tempUser.group === "") {
                                hasEmptyFields = true;
                                reject({ addedUsers: [], error: 'Empty fields', failedUsers: [], result: false });
                            } else if (!this._emailRegex.test(tempUser.email)) {
                                hasInvalidEmail = true;
                                reject({ addedUsers: [], error: 'Invalid Email', failedUsers: [], result: false });
                            } else {
                                inputAttendees.push(tempUser);

                                let createdUser = userService.createUser(tempUser.email, tempUser.name, createdByEmail, tempUser.password, 'true').catch((err) => {
                                    hasFailedOnData = true;
                                    reject({ addedUsers: [], error: err, failedUsers: [], result: false });
                                });

                                promises.push(createdUser);
                                createdUser.then((user) => {
                                    groupAssignment.push({ group: tempUser.group, attendeeUuid: user._id.replace('auth-user_', '') });
                                });

                                let isPresent = false;
                                for (let i = 0; i < groups.length; i++) {
                                    if (groups[i] === tempUser.group) {
                                        isPresent = true;
                                        break;
                                    }
                                }

                                if (!isPresent) { groups.push(tempUser.group); }
                            }
                        }
                        rowCount++;
                    } else {
                        failedUsers.push(data);
                    }
                }).on('end', () => {
                    Promise.all(promises).then((users: UserDocument[]) => {
                        if (hasEmptyFields || groupAssignment.length < 1 || groups.length < 1) { 
                            reject({ addedUsers: [], error: 'Empty fields', failedUsers: [], result: false });
                        } else if (hasFailedOnData) { 
                            reject({ addedUsers: [], error: 'Failed to add users', failedUsers: [], result: false });
                        } else if (hasInvalidEmail) { 
                            reject({ addedUsers: [], error: 'Invalid Email', failedUsers: [], result: false });
                        } else {
                            duuzraService.get(authToken, correlationId, duuzraId, duuzraId).then((vals) => {// get existing attendee/s on duuzra

                                for (let val of vals) {
                                    for (let inputAttendee of inputAttendees) {
                                        if (val.email === inputAttendee.email) {
                                            existingAttendee.push(inputAttendee); // fetch the attendee that has aready been added on the duuzra
                                        }
                                    }

                                }

                                const userIdsToAdd: string[] = [];
                                // const Duuzra = this.
                                users.forEach((user) => {
                                    try {
                                        let userAttendee: IAttendeeDto = {
                                            uuid: user._id.replace('auth-user_', ''),
                                            authUuid: user._id.replace('auth-user_', ''),
                                            permissions: {
                                                appMessagingEnabled: false,
                                                appQuestionsEnabled: false,
                                                appNotesEnabled: false,
                                                appMasterEnabled: false,
                                                cmsEditEnabled: false,
                                                cmsAnalyticsEnabled: false,
                                                cmsSharingEnabled: false,
                                                canSubmitQuestionAsAnnonymous: false,
                                                canReceiveNotificationDuuzraLive: false,
                                                canReceiveNotificationContentAddRemove: false
                                            },
                                            firstname: user.firstname,
                                            lastname: user.lastname,
                                            email: user.email,
                                            hasRegistered: false,
                                            isEmailValidated: false,
                                            isAnnonymous: false,
                                            isAttendee: false
                                        }

                                        addedAttendee.push(userAttendee);
                                        userIdsToAdd.push(user._id);
                                    } catch (err) { 
                                        reject({ addedUsers: [], error: err, failedUsers: [], result: false });
                                    }
                                });
                                let options = { groups: groups, attendees: groupAssignment };

                                duuzraService.create(authToken, correlationId, duuzraId, addedAttendee, options).then((usersAdded) => {
                                    setTimeout(() => {
                                        let groupDtos: IGroupDto[] = [];
                                        groups.forEach((group) => {
                                            let groupDto: IGroupDto = {
                                                uuid: '',
                                                duuzraUuid: duuzraId,
                                                groupName: group,
                                                groupAttendeeUuids: [],
                                                groupPermissions: {
                                                    appMessagingEnabled: false,
                                                    appQuestionsEnabled: false,
                                                    appNotesEnabled: false,
                                                    appMasterEnabled: false,
                                                    cmsEditEnabled: false,
                                                    cmsAnalyticsEnabled: false,
                                                    cmsSharingEnabled: false,
                                                    canSubmitQuestionAsAnnonymous: false,
                                                    canReceiveNotificationDuuzraLive: false,
                                                    canReceiveNotificationContentAddRemove: false
                                                },
                                                dateCreated: '',
                                                createdBy: '',
                                                isDefault: false
                                            }

                                            groupDtos.push(groupDto);
                                        });
                                        grpService.create(authToken, correlationId, duuzraId, groupDtos, options);
                                    }, 2000);
                                    // resolve({ addedUsers: addedAttendee, failedUsers: failedUsers, result: true });
                                    resolve({ addedUsers: addedAttendee, failedUsers: existingAttendee, result: true });
                                }).catch((err) => {
                                    // reject({ addedUsers: addedAttendee, error: err, failedUsers: failedUsers, result: false });
                                    reject({ addedUsers: addedAttendee, error: err, failedUsers: failedUsers, result: false });
                                });
                            });
                        }
                    })
                        .catch((error) => {
                            // reject({ addedUsers: addedAttendee, error: error, failedUsers: failedUsers, result: false });
                            reject({ addedUsers: addedAttendee, error: error, failedUsers: existingAttendee, result: false });
                        });
                });
            } catch (e) {
                reject({ addedUsers: [], error: e, failedUsers: [], result: false });
            }
        });
    }

    public getImageResolution(path: string): Promise<number[]> { 
        console.log("document.service.ts getImageResolution()");

        return new Promise((resolve, reject) => {
            let absolutePath = this.getAbsoluteFilePath(path);
            this.gm(absolutePath).size((err, val) => {
                if (err) {
                    reject(err);
                } 
                const width: number = val.width;
                const height: number = val.height;

                resolve([width, height]);
            });
        });
    };

    private getDocumentConfig(pdfPath: string): string[] {

        return [
            pdfPath,
            '-density',
            '500',
            '-quality',
            '80',
            `${pdfPath.split('.')[0]}.${DocumentConfig.imageExtention}`];

    }

}

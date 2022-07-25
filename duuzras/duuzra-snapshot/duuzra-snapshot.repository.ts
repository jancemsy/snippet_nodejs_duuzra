import { DateFormatter, IKeyValuePair } from '../../duuzra_types/common';
import { IAttendeePermissionsDto, IDuuzraSnapshotDto, ISnapshotDeltaDto, ISnapshotInfoDto } from '../../duuzra_types/duuzras';
import { System } from '../../shared';
import { DuuzraSnapshotMapper } from './duuzra-snapshot.mapper';

import {
    IDuuzraSnapshotDoc,
    IDuuzraSnapshotPayloadDoc,
    IDuuzraSnapshotsDoc,
    IDuuzraSnapshotUserPermissionsDoc
} from '../../models/duuzra-snapshot-doc';

import { AttendeeRepository, IAttendeeRepository } from '../attendees/attendee.repository';
import { DuuzraContentMapper } from '../contents/content.mapper';
import { ContentRepository, IContentRepository } from '../contents/content.repository';
import { DuuzraInfoRepository, IDuuzraInfoRepository } from '../duuzra-info/duuzra-info.repository';
import { DuuzraMediaMapper } from '../media/media.mapper';
import { IMediaRepository, MediaRepository } from '../media/media.repository';
import { countryList } from '../../duuzra_types/lookup';
import { SnapshotInfoMapper } from '../snapshot-info/snapshot-info.mapper'; 
import { IDuuzraMediaPath } from '../../models/duuzra-media-path-doc'; 
import { EmailService, IEmailService } from '../../shared/email/email-service'; 
import { NotificationLiveRepository, INotificationLiveRepository, NotificationLiveLog, NotificationAddRemoveRepository, INotificationAddRemoveRepository } from '../notification'; 
const uuidgen = require('uuid/v1'); 
const jsonDiffPatch = require('jsondiffpatch');

export abstract class IDuuzraSnapshotRepository {
    public abstract async getSnapshotsByDuuzraUuid(userUuid: string, duuzraUuid: string, activeOnly: boolean): Promise<IDuuzraSnapshotDto[]>
    public abstract async getSnapshotsByAuthUuid(authUuid: string, activeOnly: boolean): Promise<IDuuzraSnapshotDto[]>
    public abstract async getSnapshotByUuid(userUuid: string, uuid: string): Promise<IDuuzraSnapshotDto>;
    public abstract async getSnapshotsCountByDuuzraUuid(userUuid: string, duuzraUuid: string, activeOnly: boolean): Promise<any[]>
    public abstract async getDraftSnapshotByDuuzraUuid(userUuid: string, clientUuid: string, duuzraUuid: string): Promise<IDuuzraSnapshotDto>;
    public abstract async getSnapshotUpdateForAuthUserByDuuzraUuid(authUuid: string, duuzraUuid: string, currentSnapshotUuid: string): Promise<ISnapshotDeltaDto>;
    public abstract async getLatestSnapshotByDuuzraUuid(userUuid: string, duuzraUuid: string): Promise<IDuuzraSnapshotDto>;
    public abstract async createSnapshot(userUuid: string, clientUuid: string, snapshotDto: IDuuzraSnapshotDto): Promise<IDuuzraSnapshotDto>;
    public abstract async deleteSnapshot(userUuid: string, clientUuid: string, uuid: string): Promise<IDuuzraSnapshotDto>;
    public abstract async updateSnapshot(userUuid: string, clientUuid: string, info: IDuuzraSnapshotDto): Promise<IDuuzraSnapshotDto>;

    // Tokens
    public abstract async isPinCodeUnique(pinCode: string): Promise<boolean>;
    public abstract async isUrlTokenUnique(urlToken: string): Promise<boolean>;

    // Delta
    public abstract async getSnapshotDelta(authUuid: string, duuzraUuid: string, snapshotAUuid: string, snapshotBUuid: string, friendlyOutput: boolean): Promise<ISnapshotDeltaDto>;
}

export class DuuzraSnapshotRepository implements IDuuzraSnapshotRepository {
    private readonly objectName = DuuzraSnapshotMapper.getViewType();

    private superUserlist: string[] = [
        "demo1@duuzra.com",
        "demo2@duuzra.com",
        "demo3@duuzra.com"
    ];

    private monthStr: string[] = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
    ];

    private mediaRepo: IMediaRepository;
    private contentMapper: DuuzraContentMapper;
    private infoRepository: IDuuzraInfoRepository;
    private contentRepository: IContentRepository;
    private attendeeRepository: IAttendeeRepository;
    private emailService: IEmailService;
    private notificationlive: INotificationLiveRepository;
    private notificationaddremove: INotificationAddRemoveRepository;

    constructor() {
        this.mediaRepo = new MediaRepository();
        this.contentMapper = new DuuzraContentMapper();
        this.infoRepository = new DuuzraInfoRepository();
        this.contentRepository = new ContentRepository();
        this.attendeeRepository = new AttendeeRepository();
        this.emailService = new EmailService();
        this.notificationlive = new NotificationLiveRepository();
        this.notificationaddremove = new NotificationAddRemoveRepository();
    }

    // ####################################
    // # DATA READS
    // ####################################

    public async getSnapshotsByDuuzraUuid(userUuid: string, duuzraUuid: string, activeOnly: boolean): Promise<IDuuzraSnapshotDto[]> {
        console.log("duuzra-snapshot.repository.ts getSnapshotsByDuzraUuid()");
        try {  
            let rawContents = await System.DB.get(this.objectName, 'duuzraUuid', duuzraUuid) as any;
            if (rawContents) { 
                let sortFunction = function(a, b) {
                    return a.dateCreated > b.dateCreated ? -1 : 1;
                }

                let snapshotDocuments: any[] = rawContents.docs.sort(sortFunction);
                let responseSnapshots: any[] = []; 
                if (activeOnly) { 
                    let seenUsers: string[] = [];
                    let includeSnapshotInResponse = true;

                    for (let i = 0; i < snapshotDocuments.length; i++) {

                        if (snapshotDocuments[i].isDraft) {
                            responseSnapshots.push(snapshotDocuments[i]);
                        } else {
                            let allUsersSeen = true;

                            if (snapshotDocuments[i] && snapshotDocuments[i].users) {
                                Object.keys(snapshotDocuments[i].users).forEach((userId: string) => {
                                    if (seenUsers.indexOf(userId) < 0) {
                                        seenUsers.push(userId);
                                        allUsersSeen = false;
                                    }
                                });

                                if (!allUsersSeen) {
                                    responseSnapshots.push(snapshotDocuments[i]);
                                }
                            }
                        }
                    }
                } else { 
                    responseSnapshots = snapshotDocuments;
                } 
                let snapshotDtosPromises: Promise<IDuuzraSnapshotDto>[] = [];
                responseSnapshots.forEach((contentDoc) => {
                    snapshotDtosPromises.push(
                        this.buildDto(contentDoc)
                    );
                });
                return Promise.all(snapshotDtosPromises);
            } else {
                return Promise.resolve(null);
            }
        } catch (err) { 
            //return Promise.reject<IDuuzraSnapshotDto[]>(err);
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
        }
    }
    public async getSnapshotsCountByDuuzraUuid(userUuid: string, duuzraUuid: string, activeOnly: boolean): Promise<any[]> {
        console.log("duuzra-snapshot.repository.ts getSnapshotsCountByDuzraUuid()");
        try {
            const rawInfos = await System.DB.get('duuzraSnapshot', 'duuzraUuid', duuzraUuid) as any;
            if (rawInfos && rawInfos.docs.length > 0) {
                // Fill out with media
                const infoDtosPromises: Array<Promise<ISnapshotInfoDto>> = [];
                let tempSnapshots = [];

                for (let i = 0; i < rawInfos.docs.length; i++) {

                    if (!rawInfos.docs[i].isDraft) {
                        // ----------count---------
                        let prevId = rawInfos.docs[i].duuzraUuid;
                        let id = 'duuzra-duuzra_' + prevId, myArray = 0;
                        if (rawInfos.docs[i].isActive) { // count features
                            Object.keys(rawInfos.docs[i].payloads.content).forEach((duuzraId) => {
                                let item = rawInfos.docs[i].payloads.content[duuzraId];
                                if (item.contentType === 'layout-page') {
                                    myArray = item.contentUuids.length
                                }
                            });
                        }
                        rawInfos.docs[i].features = myArray;
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
                        this.buildDto0(infoDoc.id, infoDoc)
                    );
                });

                return Promise.all(infoDtosPromises);
            } else {
                return Promise.resolve(null);
            }
        } catch (err) { 
            //return Promise.reject<ISnapshotInfoDto[]>(err);
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
        }
    }
    private async buildDto0(docId, info): Promise<ISnapshotInfoDto> {
        console.log("duuzra-snapshot.repository.ts buildDto()");
        return Promise.resolve(SnapshotInfoMapper.mapToObj(docId, info));
    }

    public async getSnapshotsByAuthUuid(authUuid: string, activeOnly: boolean): Promise<IDuuzraSnapshotDto[]> {
        console.log("duuzra-snapshot.repository.ts getSnapshotsByAuthUuid()");
        try { 
            let rawContents = await System.DB.get(this.objectName, 'authUuid', authUuid) as any;
            if (rawContents) {

                let sortFunction = function(a, b) {
                    return a.dateCreated > b.dateCreated ? -1 : 1;
                } 
                let snapshotDocuments: any[] = rawContents.docs.sort(sortFunction);
                let responseSnapshots: any[] = []; 
                if (activeOnly) { 
                    let seenUsers: string[] = [];
                    let includeSnapshotInResponse = true;

                    for (let i = 0; i < snapshotDocuments.length; i++) {

                        if (snapshotDocuments[i].isDraft) {
                            responseSnapshots.push(snapshotDocuments[i]);
                        } else {
                            let allUsersSeen = true;

                            if (snapshotDocuments[i] && snapshotDocuments[i].users) {
                                Object.keys(snapshotDocuments[i].users).forEach((userId: string) => {
                                    if (seenUsers.indexOf(userId) < 0) {
                                        seenUsers.push(userId);
                                        allUsersSeen = false;
                                    }
                                });

                                if (!allUsersSeen) {
                                    responseSnapshots.push(snapshotDocuments[i]);
                                }
                            }
                        }
                    }
                } else {
                    // No active only filter - return the lot.
                    responseSnapshots = snapshotDocuments;
                }

                // Fill out with media
                let snapshotDtosPromises: Promise<IDuuzraSnapshotDto>[] = [];
                responseSnapshots.forEach((contentDoc) => {
                    snapshotDtosPromises.push(
                        this.buildDto(contentDoc)
                    );
                });

                return Promise.all(snapshotDtosPromises);
            } else {
                return Promise.resolve(null);
            }
        } catch (err) { 
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
            //return Promise.reject<IDuuzraSnapshotDto[]>(err);
        }
    }
 
    public async getSnapshotByUuid(userUuid: string, snapshotUuid: string): Promise<IDuuzraSnapshotDto> {
        console.log("duuzra-snapshot.repository.ts getSnapshotByUuid()");
        try { 
            let rawContents = await System.DB.get(this.objectName, 'uuid', snapshotUuid) as any;
            if (rawContents && rawContents.docs.length === 1) {
                return Promise.resolve(
                    this.buildDto(rawContents.docs[0])
                );
            } else {
                return Promise.resolve(null);
            }
        } catch (err) { 
            return Promise.reject<IDuuzraSnapshotDto>(err);
        }
    }

    public async getDraftSnapshotByDuuzraUuid(userUuid: string, clientUuid: string, duuzraUuid: string): Promise<IDuuzraSnapshotDto> {
        console.log("duuzra-snapshot.repository.ts getDraftSnapshotByDuuzraUuid()");
        try { 
            let snapshotDocId = 'duuzra-snapshot_' + duuzraUuid;
            let rawContents = await System.DB.get(this.objectName, 'draft', duuzraUuid) as any;
            if (rawContents && rawContents.docs.length === 1) {

                return Promise.resolve(
                    this.buildDto(rawContents.docs[0])
                );
            } else {
                return Promise.resolve(null);
            }
        } catch (err) { 
            return Promise.reject<IDuuzraSnapshotDto>(err);
        }
    }


    private async buildSnapshotDeltaPayload(fromSnapshot, toSnapshot, contentPath): Promise<ISnapshotDeltaDto> { 
        console.log("duuzra-snapshot.repository.ts buildSnapshotDeltaPayload()");
        return Promise.resolve(await this.generatesnapshotdeltapayload(toSnapshot, contentPath));
    }


    public async getLatestSnapshotByDuuzraUuid(duuzraUuid: string): Promise<IDuuzraSnapshotDto> {
        console.log("duuzra-snapshot.repository.ts getLatestSnapshotByDuuzraUuid()");
        try { 
            let snapshotDocId = 'duuzra-snapshot_' + duuzraUuid;
            let rawContents = await System.DB.get(this.objectName, 'duuzraUuid', duuzraUuid) as any;
            if (rawContents && rawContents.docs.length > 0) { 
                let latestSnapshot = null;
                let snapshotDtosPromises: Promise<IDuuzraSnapshotDto>[] = [];
                rawContents.docs.forEach((snapshotDoc) => { 
                    if (!latestSnapshot || snapshotDoc.dateCreated > latestSnapshot.dateCreated) {
                        latestSnapshot = snapshotDoc; 
                    } 
                }); 
                return this.buildDto(latestSnapshot);
            } else {
                return Promise.resolve(null);
            }
        } catch (err) { 
            return Promise.reject<IDuuzraSnapshotDto>(err);
        }
    }


    private async generatesnapshotdeltapayload(toSnapshot, contentPath): Promise<ISnapshotDeltaDto> {
        console.log("duuzra-snapshot.repository.ts generatesnapshotdeltapayload()");
        let duuzraSnapshot = DuuzraSnapshotMapper.buildSnapshotDeltaPayload(toSnapshot, contentPath); 
        return duuzraSnapshot;
    }

    private async getMediaByUuid(duuzra): Promise<IDuuzraMediaPath[]>{
        console.log("duuzra-snapshot.repository.ts getMediaByUuid()");
        // let rawContents = await System.DB.get('duuzraMedia', 'all') as any;

        // let snapshot = await this.generatesnapshotdeltapayload(duuzra);

        let contentsUuid = [];
        // let contentPaths: IDuuzraMediaPath[];
        let contentPaths = [];

        try{
            for (let data in duuzra.payloads.content){
                contentsUuid.push(data);
            }

            for (let data of contentsUuid){
                if (duuzra.payloads.content[data].contentType === "Image"){
                    let allMediaImage = await System.DB.get('mediaImage', 'id', duuzra.payloads.content[data].backgroundMedia.mediaUuid) as any; 
                    if (allMediaImage.docs.length > 0){
                        contentPaths.push({
                            uuid: data,
                            path: allMediaImage.docs[0].original.path
                        });
                    }
                }else if (duuzra.payloads.content[data].contentType === "Video"){
                    let allMediaVideo = await System.DB.get('mediaVideo', 'id', duuzra.payloads.content[data].backgroundMedia.mediaUuid) as any; 
                    if (allMediaVideo.docs.length > 0){
                        contentPaths.push({
                            uuid: data,
                            path: allMediaVideo.docs[0].original.path
                        });
                    }
                }else if (duuzra.payloads.content[data].contentType === "Document"){
                    let allMediaDocument = await System.DB.get('mediaDocument', 'id', duuzra.payloads.content[data].backgroundUuid) as any; 
                    if (allMediaDocument.docs.length > 0){
                        contentPaths.push({
                            uuid: data,
                            path: allMediaDocument.docs[0].media.originalPath
                        });
                    }
                }else if (duuzra.payloads.content[data].contentType === "Presentation"){
                    let allMediaPresentation = await System.DB.get('mediaPresentation', 'id', duuzra.payloads.content[data].backgroundUuid) as any; 
                    if (allMediaPresentation.docs.length > 0){
                        contentPaths.push({
                            uuid: data,
                            path: allMediaPresentation.docs[0].media.originalPath
                        });
                    }
                } else {
                    contentPaths.push({
                        uuid: null,
                        path: null
                    });
                }
            }

            return contentPaths;
        }catch (err){
            return [];
        }

    }

    private async buildDto(snapshotDoc): Promise<IDuuzraSnapshotDto> {
        console.log("duuzra-snapshot.repository.ts buildDto()");
        return Promise.resolve(DuuzraSnapshotMapper.mapToObj(snapshotDoc));
    }

    public async getSnapshotUpdateForAuthUserByDuuzraUuid2(authUuid: string, duuzraUuid: string, currentSnapshotUuid: string): Promise<ISnapshotDeltaDto> {
        console.log("duuzra-snapshot.repository.ts getSnapshotUpdateForAuthUserByDuuzraUuid2()");
        try { 
            const snapshotDocId = 'duuzra-snapshot_' + duuzraUuid;
            const compositeKey = [authUuid, duuzraUuid];
            const rawContents = await System.DB.get(this.objectName, 'authUuid_duuzraUuid', compositeKey) as any; 
            if (rawContents && rawContents.docs.length > 0) { 
                let usersCurrentSnapshot: IDuuzraSnapshotDto = null;
                let usersLatestSnapshot: IDuuzraSnapshotDto = null;
                let myLatestSnapshot: any = null;

                rawContents.docs.forEach((snapshotDoc) => {
                    if (snapshotDoc.isActive) {
                        usersCurrentSnapshot = snapshotDoc;
                        let _allowedUuids: string[] = [];
                        let item: any;

                        Object.keys(snapshotDoc.payloads.content).forEach((id) => {
                            item = snapshotDoc.payloads.content[id];

                            if (item.contentType == 'layout-page') { // init targetuuids
                                item.contentUuids.forEach((inner) => {
                                    _allowedUuids.push(inner.targetUuid);
                                });
                            } /* else {
                                if (_allowedUuids.indexOf(item.uuid) == -1) { //not found,delete the item
                                    delete snapshotDoc.payloads.content[id];
                                }
                            } */

                            usersCurrentSnapshot = snapshotDoc;
                            usersLatestSnapshot = snapshotDoc;
                            myLatestSnapshot = snapshotDoc;
                        });
                    }

                    if (!!currentSnapshotUuid) {
                        if (currentSnapshotUuid === snapshotDoc.uuid) {
                            usersCurrentSnapshot = snapshotDoc;
                        }
                    } 
                });

                let contentPath = await this.getMediaByUuid(myLatestSnapshot); 
                return this.buildSnapshotDeltaPayload(usersCurrentSnapshot, usersLatestSnapshot, contentPath); 
            }
        } catch (err) { 
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
            //return Promise.reject<ISnapshotDeltaDto>(err);
        }
    }

    public async getSnapshotUpdateForAuthUserByDuuzraUuid(authUuid: string, duuzraUuid: string, currentSnapshotUuid: string): Promise<ISnapshotDeltaDto> {
        console.log("duuzra-snapshot.repository.ts getSnapshotUpdateForAuthUserByDuuzraUuid");
        try { 
            const snapshotDocId = 'duuzra-snapshot_' + duuzraUuid;
            const compositeKey = [authUuid, duuzraUuid];
            const rawContents = await System.DB.get(this.objectName, 'authUuid_duuzraUuid', compositeKey) as any; 
            if (rawContents && rawContents.docs.length > 0) { 
                let usersCurrentSnapshot: IDuuzraSnapshotDto = null;
                let usersLatestSnapshot: IDuuzraSnapshotDto = null;
                let myLatestSnapshot: any = null;

                rawContents.docs.forEach((snapshotDoc) => {
                    if (snapshotDoc.isActive) {
                        usersCurrentSnapshot = snapshotDoc;
                        let _allowedUuids: string[] = [];
                        let item: any;

                        Object.keys(snapshotDoc.payloads.content).forEach((id) => {
                            item = snapshotDoc.payloads.content[id];

                            if (item.contentType == 'layout-page') { // init targetuuids
                                item.contentUuids.forEach((inner) => {
                                    _allowedUuids.push(inner.targetUuid);
                                });
                            } /* else {
                                if (_allowedUuids.indexOf(item.uuid) == -1) { //not found,delete the item
                                    delete snapshotDoc.payloads.content[id];
                                }
                            } */

                            usersCurrentSnapshot = snapshotDoc;
                            usersLatestSnapshot = snapshotDoc;
                            myLatestSnapshot = snapshotDoc;
                        });
                    }

                    if (!!currentSnapshotUuid) {
                        if (currentSnapshotUuid === snapshotDoc.uuid) {
                            usersCurrentSnapshot = snapshotDoc;
                        }
                    } 
                });

                let contentPath = await this.getMediaByUuid(myLatestSnapshot); 
                return this.buildSnapshotDeltaPayload(usersCurrentSnapshot, usersLatestSnapshot, contentPath); 
            }
        } catch (err) { 
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
            //return Promise.reject<ISnapshotDeltaDto>(err);
        }
    }


    public async createSnapshot(userUuid: string, clientUuid: string, snapshotDto: IDuuzraSnapshotDto): Promise<IDuuzraSnapshotDto> { 
        console.log("duuzra-snapshot.repository.ts createSnapshot()");
        try {
            let duuzraVersion: string;
            // build the snapshot payload
            const payload: IDuuzraSnapshotPayloadDoc = await this.buildSnapshotPayload(snapshotDto.duuzraUuid);
            const users: IKeyValuePair<IDuuzraSnapshotUserPermissionsDoc> = await this.buildSnapshotUsers(clientUuid, snapshotDto.duuzraUuid, snapshotDto.assignedUsers);

            snapshotDto.dateCreated = new DateFormatter(null).toString();
            snapshotDto.dateDeleted = null;
            snapshotDto.createdBy = userUuid;
            snapshotDto.dateModified = new DateFormatter(null).toString();
            snapshotDto.modifiedBy = userUuid;

            // generate a uuid
            if (!snapshotDto.uuid) {
                snapshotDto.uuid = uuidgen();
                snapshotDto.dateCreated = new DateFormatter(null).toString();
            }

            // convert dto to doc
            let snapshotDoc = DuuzraSnapshotMapper.mapToDoc(snapshotDto, payload);
            snapshotDoc.users = users;

            // look for the snapshot doc to see if already exisits
            let duuzraSnapshotsDoc = null;
            let snapshotsDocId = 'duuzra-snapshot_' + snapshotDto.duuzraUuid;
            let rawContents = await System.DB.get('duuzraSnapshot', 'docId', snapshotsDocId) as any;
            if (rawContents && rawContents.docs.length === 1) {
                duuzraSnapshotsDoc = rawContents.docs[0];
                duuzraSnapshotsDoc.snapshots.push(snapshotDoc);
                let isActive = false;
                for (let data of duuzraSnapshotsDoc.snapshots){
                    if (data.isActive){
                        duuzraVersion = data.title;
                        isActive = true;
                    }
                }
                if (!isActive){
                    duuzraVersion = snapshotDto.title;
                }

            } else {
                duuzraSnapshotsDoc = {
                    _id: 'duuzra-snapshot_' + snapshotDto.duuzraUuid,
                    _rev: undefined,
                    type: 'duuzra-snapshot',
                    dateDeleted: null,
                    clientUuid: clientUuid,
                    snapshots: [
                        snapshotDoc
                    ]
                }

                duuzraVersion = snapshotDto.title;
            }

            let couchResponse = await System.DB.save(duuzraSnapshotsDoc);

            /**************************
            * Get last version
            * Then get the added from the latest draft
            * and get the removed from the last snapshot
            * by comparing the two
            ***************************/

            if (rawContents && rawContents.docs.length === 1){
            rawContents = rawContents.docs[0];
            let lastSnapshot;
            let addedFeatures = [];
            let removedFeatured = [];

            rawContents.snapshots.forEach((data) => {
               if (data.title !== "Draft" && data.isActive){
                lastSnapshot = data;
               }
            });

            // Let's get the added feature
            if (lastSnapshot && lastSnapshot !== undefined){

                let attendeelist: any = await this.getAttendeesListByDuuzraUuid(snapshotDto.duuzraUuid);

            }
           }

            // resolve with the created item
            let dto = await this.buildDto(snapshotDoc);

            this.updateLiveCount(snapshotDto.duuzraUuid);

            return Promise.resolve(dto);

        } catch (err) {
            console.error('Error -', err);
            return Promise.reject<IDuuzraSnapshotDto>(err);
        }
    }

    /**
     * Deletes the folder with the specified id
     */
    public async deleteSnapshot(userUuid: string, clientUuid: string, snapshotUuid: string): Promise<IDuuzraSnapshotDto> {
        console.log("duuzra-snapshot.repository.ts DeleteSnapshot()");
        try {

            let deletedArr = null;

            let snapshot = await this.getSnapshotByUuid(userUuid, snapshotUuid);
            if (!snapshot) {
                return Promise.reject<IDuuzraSnapshotDto>(null);
            }
            // load the client doc
            let couchGet = await System.DB.get('duuzraSnapshot', 'docId', 'duuzra-snapshot_' + snapshot.duuzraUuid) as any;

            // add the item
            if (couchGet.docs.length === 1) {

                // Replace the content with the passed one.
                let duuzraSnapshotsDoc = couchGet.docs[0];
                let found = duuzraSnapshotsDoc.snapshots.find((x, i, arr) => {
                    if (x.uuid === snapshotUuid) {
                        deletedArr = duuzraSnapshotsDoc.snapshots.splice(i, 1);
                        return true;
                    } else {
                        return false;
                    }
                });

                if (found) { 
                    let couchResponse = await System.DB.save(duuzraSnapshotsDoc); 
                    this.updateLiveCount(snapshot.duuzraUuid); 
                    return Promise.resolve(await this.buildDto(deletedArr[0]));
                } else { 
                    //return Promise.reject<IDuuzraSnapshotDto>(null);
                    return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
                }

            } else { 
                return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
                //return Promise.reject<IDuuzraSnapshotDto>(null);
            }

        } catch (err) { 
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
            //return Promise.reject<IDuuzraSnapshotDto>(err);
        }
    }

    public async updateLiveCount(id: string) {
        console.log("duuzra-snapshot.repository.ts updateLiveCount()");
        try{
            let couchGet = await System.DB.get('duuzraSnapshot', 'docId', 'duuzra-snapshot_' + id) as any;
            const duuzraSnapshotsDoc = couchGet.docs[0];
            let count: number = 0;
            for (let entry of duuzraSnapshotsDoc.snapshots) {
                if (entry.isActive) {
                    count++;
                }
            }
 
            let couchGet2 = await System.DB.get('duuzraDuuzra', 'id', 'duuzra-duuzra_' + id) as any;
            let duuzraDoc = couchGet2.docs[0];    // Get the duuzra doc
            duuzraDoc.info.liveCount = count;
            let couchResponse2 = await System.DB.save(duuzraDoc);
        }catch (err){ 
        }

    }
 
    public async updateSnapshot(userUuid: string, clientUuid: string, snapshotDto: IDuuzraSnapshotDto): Promise<IDuuzraSnapshotDto> {
        console.log("duuzra-snapshot.repository.ts updateSnapshot()");
        try { 
            let couchGet = await System.DB.get('duuzraSnapshot', 'docId', 'duuzra-snapshot_' + snapshotDto.duuzraUuid) as any; 
            if (couchGet.docs.length === 1) { 
                const duuzraSnapshotsDoc = couchGet.docs[0];
                const storedSnapshot = duuzraSnapshotsDoc.snapshots.find((ss) => ss.uuid === snapshotDto.uuid);

                if (storedSnapshot) { 
                    let payloads = null;
                    if (snapshotDto.refreshContent) {
                        payloads = this.buildSnapshotPayload(snapshotDto.duuzraUuid);
                    } else {
                        payloads = storedSnapshot.payloads;
                    } 
                    const users: IKeyValuePair<IDuuzraSnapshotUserPermissionsDoc> = await this.buildSnapshotUsers(clientUuid, snapshotDto.duuzraUuid, snapshotDto.assignedUsers); 
                    let snapshotDoc = DuuzraSnapshotMapper.mapToDoc(snapshotDto, payloads);
                    snapshotDoc.users = users; 
                    snapshotDoc.dateModified = new DateFormatter(null).toString();
                    snapshotDoc.modifiedBy = userUuid; 
                    let found = duuzraSnapshotsDoc.snapshots.find((x, i, arr) => {
                        if (x.uuid === snapshotDto.uuid) {
                            duuzraSnapshotsDoc.snapshots.splice(i, 1, snapshotDoc);
                            return true;
                        } else {
                            return false;
                        }
                    });

                    let RevisionCount = 0; 
                    if (snapshotDto.isActive) { 
                        duuzraSnapshotsDoc.snapshots.forEach((item) => { 
                            if (item.title !== "Draft"){
                                RevisionCount++;
                            } 

                            if (item.uuid != snapshotDto.uuid) {

                                item.isActive = false;
                            }
                        });
                    }  
                    let couchResponse = await System.DB.save(duuzraSnapshotsDoc); 
                    this.updateLiveCount(snapshotDto.duuzraUuid); 
                    if (storedSnapshot.isDraft === true && snapshotDto.isDraft === false){
                        let attendeelist: any = await this.getAttendeesListByDuuzraUuid(snapshotDto.duuzraUuid);
                        let mysuperUserList = [];

                        for (let attendee of attendeelist){
                            let email = await this.getUserAttendeeEmail(attendee.uuid);  
                            this.superUserlist.forEach((data) => {
                                if (data === email){
                                    mysuperUserList.push(attendee);   
                                }
                            });
                        }

                        let DateNow = new Date();
                        let time: string = DateNow.getHours().toString() + ":" + DateNow.getMinutes() + " am";

                        if (DateNow.getHours() > 12){
                            time = (DateNow.getHours() - 12) + ":" + DateNow.getMinutes() + " pm";
                        }

                        let myDate = (DateNow.getDay() - 2).toString() + "/" + this.monthStr[DateNow.getMonth()] + "/" + DateNow.getFullYear() + " " + time; 
                        let featureCount = await this.getDuuzraContentCount(snapshotDto.duuzraUuid);
                        let RevisionsCount = RevisionCount;

                        let attendesCount = snapshotDto.assignedUsers.length;
                        let version: string = snapshotDto.title;
                        let duuzraName: string = await this.getDuuzraName(snapshotDto.duuzraUuid);

                        let message: string = "<strong>Name: " + duuzraName + "</strong><br><br>" +
                                    "Date Live: " + myDate + "<br>" +
                                    "Features: " + featureCount + "<br>" +
                                    "Revisions: " + RevisionsCount + "<br>" +
                                    "Attendees: " + attendesCount + "<br><br>" +
                            "Active version: " + version;
                        
                        let title =  duuzraName + " is Live";

                        let myDuuzraDate = new DateFormatter(null).toString();

                        let notification = {
                                _id: null,
                                _rev: undefined,
                                type: null,
                                uuid: null,
                                duuzraUuid: snapshotDto.duuzraUuid,
                                isNotify: true,
                                name: duuzraName,
                                numberOfChanges: 0,
                                version: version,
                                changeAdded: [],
                                changeRemoved: [],
                                changeUpdated: [],
                                viewed: 2,
                                dateCreated: myDuuzraDate
                            };

                        await this.createNotificationOnDuuzra(snapshotDto.duuzraUuid, clientUuid, notification, mysuperUserList);

                        let mynotificationdetails = {
                                _id: null,
                                _rev: null,
                                type: null,
                                uuid: null,
                                duuzraUuid: snapshotDto.duuzraUuid,
                                name: duuzraName,
                                features: featureCount,
                                revisions: RevisionsCount,
                                attendees: attendesCount,
                                version: version,
                                dateCreated: null
                            }
                        await this.createNotificationLive(userUuid, clientUuid, mynotificationdetails);

                        if (mysuperUserList.length > 0){
                            for (let attendee of mysuperUserList){
                                if (attendee.permissions.canReceiveNotificationDuuzraLive){
                                    await this.sendEmailNotification(title, duuzraName, message);
                                }
                            }
                        }
                    }

                    // resolve with the updated item
                    return Promise.resolve(await this.buildDto(snapshotDoc));

                } else { 
                    return Promise.reject<IDuuzraSnapshotDto>(new Error('Cannot update a snapshot the does not exisit'));
                }

            } else {
                console.error('Error - Cannot find singular couch document to update.');
                return Promise.reject<IDuuzraSnapshotDto>(null);
            }
        } catch (err) {
            return Promise.reject<IDuuzraSnapshotDto>(err);
        }
    }

    private async sendEmailNotification(title: string , duuzraName: string, message: string){
        console.log("duuzra-snapshot.repository.ts SendEmailNotification()");
        try{
            let recipient = "cat@duuzra.com"; 
            let subject = title;
            let content = message;
            let recipientName = duuzraName;
            return this.emailService.send(recipient, subject, content, recipientName);
        }catch (err){ 
        }

    }

    private async createNotificationOnDuuzra(duuzraUuid: string, clientUuid: string, notification: any, mysuperUserList?: any){
        await this.notificationaddremove.updateNotification(duuzraUuid, clientUuid, notification, mysuperUserList);
    }

    private async createNotificationLive(userUuid: string, clientUuid: string, notificationDetails: any){
        await this.notificationlive.createNotification(userUuid, clientUuid, notificationDetails);
    }

    private async getDuuzraName(duuzraUuid: string){
        try{
            let name: string;

            let rawDuuzraDoc = await System.DB.get('duuzraDuuzra', 'id', 'duuzra-duuzra_' + duuzraUuid) as any;
            rawDuuzraDoc = rawDuuzraDoc.docs[0];

            name = rawDuuzraDoc.info.name;

            return name;
        }catch (err){ 
        }
    }

    private async getDuuzraContentCount(duuzraUuid: string){
        try{
            let count: number;

            let rawDuuzraDoc = await System.DB.get('duuzraDuuzra', 'id', 'duuzra-duuzra_' + duuzraUuid) as any;
            rawDuuzraDoc = rawDuuzraDoc.docs[0];

            count = rawDuuzraDoc.contents.length - 1;

            return count;
        }catch (err){ 
        }

    }

    private async getAttendeesListByDuuzraUuid(duuzraUuid: string){
        try{
            let rawDuuzraDoc = await System.DB.get('duuzraDuuzra', 'id', 'duuzra-duuzra_' + duuzraUuid) as any;
            rawDuuzraDoc = rawDuuzraDoc.docs[0];

            let attendees: any = rawDuuzraDoc.attendees;

            return attendees;
        }catch (err){ 
        }

    }

    private async getUserAttendeeEmail(uuid: string){
        try{
            let email: string;
            let rawUser = await System.DB.get('authUser', 'id', 'auth-user_' + uuid) as any;
            rawUser = rawUser.docs[0];
            email = rawUser.email;

            return email;
        }catch (err){ 
        }

    }

    // ####################################
    // # MISC
    // ####################################

    public async isPinCodeUnique(pinCode: string): Promise<boolean> {
        console.log("duuzra-snapshot.repository.ts isPinCodeUnique()");
        try {

            // Load the index of all snapshots by pinCode
            let couchGet = await System.DB.get('duuzraSnapshot', 'pin-code', pinCode) as any;

            if (couchGet.docs && couchGet.docs.length > 0) {
                // The pin code is not unique
                return Promise.resolve(false);
            } else {
                // The pin code is unique
                return Promise.resolve(true);
            }
        } catch (err) {
            // Reject false as not unique as we do not want any scenarios where a the same is used on 2 duuzras
            return Promise.reject<boolean>(false);
        }

    }

    public async isUrlTokenUnique(urlToken: string): Promise<boolean> {
        console.log("duuzra-snapshot.repository.ts isUrlTokenUnique()");
        try {

            // Load the index of all snapshots by urlToken
            let couchGet = await System.DB.get('duuzraSnapshot', 'url-token', urlToken) as any;

            if (couchGet.docs && couchGet.docs.length > 0) {
                // The urlToken is not unique
                return Promise.resolve(false);
            } else {
                // The urlToken is unique
                return Promise.resolve(true);
            }

        } catch (err) {
            // Reject false as not unique as we do not want any scenarios where a the same is used on 2 duuzras
            return Promise.resolve(false);
        }
    }

    // ####################################
    // # Private
    // ####################################
    public async buildSnapshotPayload(duuzraUuid: string): Promise<IDuuzraSnapshotPayloadDoc> {
        console.log("duuzra-snapshot.repository.ts buildSnapshotPayload()");
        try{
            const info = await this.infoRepository.getInfoByUuid(duuzraUuid); 
            const content = await this.contentRepository.getContentsByDuuzra(duuzraUuid);
            const translations = null; 
            const adHoc = await this.contentRepository.getHiddenFiles(duuzraUuid); 

            const kvpContent = {};
            if (!!content && !!content.length) {
                content.forEach((c) => {
                    kvpContent[c.uuid] = c;
                });
            }
 
            const payload: IDuuzraSnapshotPayloadDoc = {
                info,
                content: kvpContent,
                translations,
                adHoc
            }  
            return payload;
        }catch (err){ 
        }

    }

    private async buildSnapshotUsers(clientUuid: string, duuzraUuid: string, authUuids: string[]): Promise<IKeyValuePair<IDuuzraSnapshotUserPermissionsDoc>> {
        console.log("duuzra-snapshot.repository.ts buildSnaphshotUsers()");
        const duuzraAttendees = await this.attendeeRepository.getAttendeesByDuuzra(null, null, clientUuid, duuzraUuid);
        const userPayload: IKeyValuePair<IDuuzraSnapshotUserPermissionsDoc> = {};

        let i: number = 0;

        if (authUuids) {
            authUuids.forEach((authUuid) => {

                // Load the attendee permissions for the current user.
                const duuzraAttendee = duuzraAttendees.find((att) => att.authUuid === authUuid);

                // TODO: fix the permission bug in audience.
                // 1. we need to make sure that the appropriate permission is given  by default especially for master account
                // 2. we need to make sure that the new attendee is given the right permission based on the setting

                // Build the snapshot permission doc and assign to the snapshot
                const usersPermissions: IDuuzraSnapshotUserPermissionsDoc = {
                    isMasterEnabled: i == 0 ? true : duuzraAttendee.permissions.appMasterEnabled, // this is a stupid fix but i need this asap. figure how to fix the default value for admin later. this requires a lot of debugging and understanding regarding this module
                    isMessagingEnabled: i == 0 ? true : duuzraAttendee.permissions.appMessagingEnabled,
                    isNotesEnabled: i == 0 ? true : duuzraAttendee.permissions.appNotesEnabled,
                    isQuestionsEnabled: i == 0 ? true : duuzraAttendee.permissions.appQuestionsEnabled
                }

                // increment, i==0 is the admin
                i++;

                userPayload[authUuid] = usersPermissions;

            });
        }

        return userPayload;

    }

    /*
        private async loadDocumentSingle(scopeUuid): Promise < IDuuzraSnapshotsDoc > {
            const couchGet = await System.DB.get('duuzraContent', 'docId', 'duuzra-duuzra_' + duuzraUui) as any;
            if (couchGet.docs.length === 1) {
                return Promise.resolve(couchGet.docs[0]);
            }
        }

        private async loadSingle(scopeUuid, uuid) {
            const document = await this.loadDocumentSingle(scopeUuid)
            const snapshotDoc = document.snapshots.find((ss) => ss.uuid === uuid);
            return Promise.resolve(snapshotDoc);
        }
    */

    public async getSnapshotDelta(authUuid: string, duuzraUuid: string, snapshotAUuid: string, snapshotBUuid: string, friendlyOutput: boolean): Promise<ISnapshotDeltaDto> {
        console.log("duuzra-snapshot.repository.ts getSnapshotsDelta()");
        try{
            let snapshotA: IDuuzraSnapshotDoc = !!snapshotAUuid ? await this.loadSingle(duuzraUuid, snapshotAUuid) : null;
            let snapshotB: IDuuzraSnapshotDoc = !!snapshotBUuid ? await this.loadSingle(duuzraUuid, snapshotBUuid) : null; 
            const docId = 'duuzra-duuzra_' + duuzraUuid; 
            const couchGet = await System.DB.get('duuzraContent', 'duuzraId', docId) as any;
            const duuzraDoc = couchGet.docs[0];     
            let phoneUuids: any = duuzraDoc[0].contentUuids; 
            const snapshotAPayload: IDuuzraSnapshotPayloadDoc = !!snapshotA ? snapshotA.payloads : null
            const snapshotBPayload: IDuuzraSnapshotPayloadDoc = !!snapshotB ? snapshotB.payloads : await this.buildSnapshotPayload(duuzraUuid); 
            let contentDelta = null;
            let donotincludeUids: string[] = []; 
            let _layoutUuids: any;

            if (!!snapshotAPayload) {
                for (const _property in snapshotAPayload.content) { 
                    if (snapshotAPayload.content.hasOwnProperty(_property)) { 
                        let _contentItem = snapshotAPayload.content[_property]; 
                        if (_contentItem.contentType == 'layout-page') { 
                            _layoutUuids = _contentItem.contentUuids.length > 0 ? _contentItem.contentUuids : phoneUuids;
                        } else { 
                            _layoutUuids.forEach((item) => {
                                try {
                                    if (item.targetUuid == _contentItem.uuid) {
                                        donotincludeUids.push(_contentItem.uuid); 
                                    }
                                } catch (e) {
                                }
                            });
                        }

                    }
                }

            }

            contentDelta = snapshotBPayload.content; 

            const snapshotDeltaDto: ISnapshotDeltaDto = {
                snapshotUuid: snapshotBUuid // maybe null if compared to content
            }

            if (!friendlyOutput) {
                snapshotDeltaDto.content = contentDelta;
            } else { 
                if (!!contentDelta) {  
                    snapshotDeltaDto.content_friendly = {};
                    let isDragged: boolean = false;

                    let layoutUuids: any;

                    for (const property in contentDelta) {
                        if (contentDelta.hasOwnProperty(property)) { 
                            let contentItem = snapshotBPayload.content[property]; 
                            let isNotInclude = donotincludeUids.length == 0 ? false : (donotincludeUids.indexOf(contentItem.uuid) > -1 ? true : false); 
                            if (!!contentItem && isNotInclude && contentItem.contentType != 'layout-page') {
                                // do not include
                            } else if (!!contentItem) {

                                if (contentItem.contentType == 'layout-page') { // init targetuuids
                                    layoutUuids = contentItem.contentUuids.length > 0 ? contentItem.contentUuids : phoneUuids; 
                                } 

                                isDragged = false;
                                layoutUuids.forEach((item) => {
                                    try {
                                        if (item.targetUuid == contentItem.uuid) {
                                            isDragged = true;
                                        }
                                    } catch (e) {
                                        isDragged = false;
                                    }
                                });

                                let changedItem: any = {
                                    contentUuid: contentItem.uuid,
                                    contentType: contentItem.contentType,
                                    contentTitle: contentItem.title,
                                    isDragged: isDragged

                                }
                                snapshotDeltaDto.content_friendly[property] = changedItem;

                            }
                        }
                    }
                } 

            }

            return Promise.resolve(snapshotDeltaDto);
        }catch (err){
            //return Promise.reject<ISnapshotDeltaDto>(err);
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
        }

    }

    

    
    private async loadSingle(scopeUuid, uuid) {
        const document = await this.loadDocumentSingle(scopeUuid)
        const snapshotDoc = document.snapshots.find((ss) => ss.uuid === uuid);
        return Promise.resolve(snapshotDoc);
    }


    private async loadDocumentSingle(scopeUuid): Promise<IDuuzraSnapshotsDoc> {
        console.log("duuzra-snapshot.repository.ts loadDocumentSingle()");
        try{
            const couchGet = await System.DB.get('duuzraSnapshot', 'docId', 'duuzra-snapshot_' + scopeUuid) as any;
            if (couchGet.docs.length === 1) {
                return Promise.resolve(couchGet.docs[0]);
            }
        }catch (err){
            //return Promise.reject<IDuuzraSnapshotsDoc>(err);
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
        }

    }


}

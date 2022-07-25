import {
    IAttendeeDto,
    IDuuzraContentDto,
    IDuuzraDto,
    IDuuzraGroupsDto,
    IDuuzraInfoDto
} from '../../duuzra_types/duuzras';

import { IDuuzraAttendeeDoc } from '../../models/duuzra-attendee-doc';
import { IDuuzraContentDoc } from '../../models/duuzra-content-doc';
import { IDuuzraDoc } from '../../models/duuzra-duuzra-doc';
import { IDuuzraGroupDoc } from '../../models/duuzra-group-doc';
import { IDuuzraInfoDoc } from '../../models/duuzra-info-doc';

import { System } from '../../shared';
import { DuuzraContentMapper } from '../contents/content.mapper';
import { DuuzraDuuzraMapper } from './duuzra-duuzra.mapper';

import { DuuzraSnapshotRepository } from '../../duuzras/duuzra-snapshot/duuzra-snapshot.repository'; 

import { HiddenMediaRepository  } from '../../duuzras/hidden-media/hidden-media.repository';


const uuidgen = require('uuid/v1');

export abstract class IDuuzraDuuzraRepository {
    public abstract async getDuuzraDuuzraById(uuid: string): Promise<IDuuzraDto>;
    public abstract async getDuuzraFeatureById(uuid: string): Promise<IDuuzraDto>;
    public abstract async saveAdHocFiles(duuzraUuid: string, uuid: string, mediaType: string, mediaObject: any): Promise<IDuuzraDto>
}

export class DuuzraDuuzraRepository implements IDuuzraDuuzraRepository {
    private readonly objectName = DuuzraDuuzraMapper.getViewType();

    private contentMapper: DuuzraContentMapper;
    private snapshotRepo: DuuzraSnapshotRepository; 
    private hiddenRepo : HiddenMediaRepository; 
     
    constructor() {
        this.snapshotRepo = new DuuzraSnapshotRepository();
        this.contentMapper = new DuuzraContentMapper();
        this.hiddenRepo = new HiddenMediaRepository();
    }

    // ####################################
    // # DATA READS
    // ####################################

    public async getDuuzraDuuzraById(uuid: string): Promise<IDuuzraDto> { 
        console.log("duuzra-duuzra.repository.ts getDuuzraDuuzraById()");
        try {
            const rawDuuzras = await System.DB.get(this.objectName, 'id', 'duuzra-duuzra_' + uuid) as any;
            if (rawDuuzras && rawDuuzras.docs.length === 1) {
                return Promise.resolve(this.buildDto(rawDuuzras.docs[0]._id, rawDuuzras.docs[0]));
            } else {
                return Promise.resolve(null);
            }
        } catch (err) { 
            //return Promise.reject<IDuuzraDto>(err);
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
        }
    }

    public async saveAdHocFiles(duuzraUuid: string, uuid: string, mediaType: string, mediaObject: any): Promise<IDuuzraDto> { 
        try {
            const rawDuuzras = await System.DB.get(this.objectName, 'id', 'duuzra-duuzra_' + duuzraUuid) as any;
            if (rawDuuzras && rawDuuzras.docs.length === 1) {
                let duuzraDoc = rawDuuzras.docs[0];
                let adHocJson: any
                adHocJson = {
                    uuid: uuid,
                    contentType: mediaType,
                    thumb: "",
                    src: "",
                    pages: []
                };
                if (mediaType !== "video" && mediaType !== "image") {
                    adHocJson.src = mediaObject.originalPath;
                    adHocJson.thumb = mediaObject.pages[0].path;
                    if (mediaObject.pages && mediaObject.pages !== undefined && mediaObject.pages.length > 0) {
                        mediaObject.pages.forEach((page) => {
                            let docPages: any = {};
                            docPages["uuid"] = page.uuid;
                            docPages["path"] = page.path;
                            adHocJson.pages.push(docPages);
                        });
                    }
                } else {
                    adHocJson.thumb = mediaType === "video" ? mediaObject.original.thumbnailPath : mediaObject.original.path;
                    adHocJson.src = mediaType === "video" ? mediaObject.original.path : "";
                } if (duuzraDoc['adHocs'] !== undefined && duuzraDoc['adHocs'] && duuzraDoc['adHocs'].length > 0) {
                    duuzraDoc['adHocs'].push(adHocJson);
                } else {
                    duuzraDoc['adHocs'] = [];
                    duuzraDoc['adHocs'].push(adHocJson);
                }
                let couchResponse = await System.DB.save(duuzraDoc);


                setTimeout(() => { 
                    this.hiddenRepo.updateHiddenFilesInSnapshot(duuzraUuid);
                }, 100);



                return Promise.resolve(rawDuuzras.docs);
            } else {
                return Promise.resolve(null);
            }
        } catch (err) { 
            //return Promise.reject<IDuuzraDto>(err);
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
        }
    }

    public async getDuuzraFeatureById(uuid: string): Promise<IDuuzraDto> { 
        console.log("duuzra-duuzra.repository.ts getDuuzraFeatureById()");
        try {
            const rawDuuzras = await System.DB.get(this.objectName, 'id', 'duuzra-duuzra_' + uuid) as any;
            if (rawDuuzras && rawDuuzras.docs.length === 1) {
                return Promise.resolve(this.buildDto(rawDuuzras.docs[0]._id, rawDuuzras.docs[0]));
            } else {
                return Promise.resolve(null);
            }
        } catch (err) { 
            //return Promise.reject<IDuuzraDto>(err);
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
        }
    }


    

    private async buildDto(docId, duuzraDoc): Promise<IDuuzraDto> {
        return Promise.resolve(DuuzraDuuzraMapper.mapToObj(docId, duuzraDoc));
    }

    
}

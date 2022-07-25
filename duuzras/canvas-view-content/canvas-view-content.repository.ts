import { System } from '../../shared';
import { UUID } from 'angular2-uuid';
import { IDuuzraContentDto } from '../../duuzra_types/duuzras';
import { IDuuzraMediaDto } from '../../duuzra_types/duuzras';
import { DuuzraCanvasContentMapper } from './canvas-view-content.mapper';
import { IDuuzraContentDoc } from '../../models/duuzra-content-doc';
import { IDuuzraContentChildDoc } from '../../models/duuzra-contentchild-doc';

import { DuuzraMediaMapper } from '../media/media.mapper';
import { IMediaRepository, MediaRepository } from '../media/media.repository';

import { NotificationAddRemoveRepository, INotificationAddRemoveRepository } from '../notification/notification-add-remove/notification-add-remove.repository';

import { DateFormatter } from '../../duuzra_types/common';
import { timingSafeEqual } from 'crypto';

export abstract class IContentRepository { 
    public abstract async canvasViewContentCreate(clientUuid: string, duuzraUuid: string, content: any): Promise<any>;
}

export interface targetsInterface {
    uuid: string;
    backgroundColour: string;
    textColour: string;
}

export class CanvasViewContentRepository implements IContentRepository {
    private readonly objectName = DuuzraCanvasContentMapper.getViewType();

    private mediaRepo: IMediaRepository;
    private contentMapper: DuuzraCanvasContentMapper;
    private notificationRepo: INotificationAddRemoveRepository;

    constructor() {
        this.mediaRepo = new MediaRepository();
        this.contentMapper = new DuuzraCanvasContentMapper();
        this.notificationRepo = new NotificationAddRemoveRepository();
    }

    // ####################################
    // # DATA CHANGES
    // ####################################

    /**
     * Saves the specified content
     */
    public async canvasViewContentCreate(clientUuid: string, duuzraUuid: string, currentArea: any): Promise<any> {  
        let type = "update";
        try { 
            let canvasContentDoc = DuuzraCanvasContentMapper.mapCanvasContentToDoc(currentArea); 
            let couchGet = await System.DB.get('duuzraDuuzra', 'id', 'duuzra-duuzra_' + duuzraUuid) as any;
            let status = 404;
            if (canvasContentDoc.canvasUuid !== undefined) { 
                if (couchGet.docs.length > 0) {
                    let contentDoc = couchGet.docs[0];
                    contentDoc.contents.forEach((content) => {
                        if (content.uuid === canvasContentDoc.canvasUuid) { 
                            if (content.theme.canvasFeature.height !== canvasContentDoc.height ||
                                content.theme.canvasFeature.width !== canvasContentDoc.width ||
                                content.theme.canvasFeature.x !== canvasContentDoc.x ||
                                content.theme.canvasFeature.y !== canvasContentDoc.y) {
                            content.theme.canvasFeature = canvasContentDoc;
                            content.theme.customHeight = canvasContentDoc.height;
                            content.theme.customWidth = canvasContentDoc.width;
                            status = 200;
                            }

                            status = 200;
                            
                        }
                    })
                    let couchResponse = await System.DB.save(contentDoc);
                } else { 
                    //return Promise.reject<IDuuzraContentDto>(null);
                    return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
                }
            } 
            return Promise.resolve({ msg: "Canvas view successfully updated !", type: type, status: status });
        } catch (err) { 
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
            //return Promise.reject<any>(err);
        }
    }

    /**
     * Deletes the content with the specified id
     */
    public async deleteCanvasContent(clientUuid: string, duuzraUuid: string, contentUuid: string): Promise<any> { 
        let type = "delete";
        try {
            let couchGet = await System.DB.get('duuzraDuuzra', 'id', 'duuzra-duuzra_' + duuzraUuid) as any;
            let status = 404;
            let mycontent = [];
            let deletedArr = null;
            let myDate = new DateFormatter(null).toString();
            let duuzraDoc = couchGet.docs[0];
            let found = false;
            let contentArray = [];
            duuzraDoc.contents.forEach((content) => {
                if (content.contentType === "layout-page") {
                    content.contentUuids.forEach((item) => {
                        if (item.targetUuid !== contentUuid) {
                            contentArray.push(item);
                        }else{
                            found = true;
                        }
                    });
                }
                content.contentUuids = contentArray;
            })

            if (found) { 
                let couchResponse = await System.DB.save(duuzraDoc);
                status = 200; 
                return Promise.resolve({ msg: "Canvas view successfully updated !", type: type, status: status });
            } else { 
                return Promise.reject<IDuuzraContentDto>(null);
            } 
        } catch (err) { 
            return Promise.reject<IDuuzraContentDto>(err);
        }
    }

    public async updatenotification(duuzraUuid: string, clientUuid: string, duuzraName: string, mycontent: any, type: string) { 
        let DateNow = new Date();
        let time: string = DateNow.getHours().toString() + ":" + DateNow.getMinutes().toString() + ":" + DateNow.getSeconds().toString(); 
        let myDate = new DateFormatter(null).toString(); 
        mycontent.date = myDate; 
        let mynotification = {
            _id: null,
            _rev: undefined,
            type: null,
            uuid: null,
            duuzraUuid: duuzraUuid,
            name: duuzraName,
            isNotify: false,
            numberOfChanges: 0,
            version: null,
            changeAdded: [],
            changeRemoved: [],
            changeUpdated: [],
            viewed: 2,
            dateCreated: myDate
        };

        if (type === "update") {
            mynotification.changeUpdated = mycontent;
        } else if (type === "add") {
            mynotification.changeAdded = mycontent;
        } else {
            mynotification.changeRemoved = mycontent;
        }

        await this.notificationRepo.updateNotification(duuzraUuid, clientUuid, mynotification);
    }
}

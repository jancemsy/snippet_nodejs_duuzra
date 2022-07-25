import { System } from '../../shared';
import { UUID } from 'angular2-uuid';
import { IDuuzraContentDto } from '../../duuzra_types/duuzras';
import { IDuuzraMediaDto } from '../../duuzra_types/duuzras';
import { DuuzraContentMapper } from './content.mapper';
import { IDuuzraContentDoc } from '../../models/duuzra-content-doc';
import { IDuuzraContentChildDoc } from '../../models/duuzra-contentchild-doc';

import { DuuzraMediaMapper } from '../media/media.mapper';
import { IMediaRepository, MediaRepository } from '../media/media.repository';

import { NotificationAddRemoveRepository, INotificationAddRemoveRepository } from '../notification/notification-add-remove/notification-add-remove.repository';

import { DateFormatter } from '../../duuzra_types/common';
import { timingSafeEqual } from 'crypto';

export abstract class IContentRepository {
    public abstract async getContentsByDuuzra(duuzraUuid: string): Promise<IDuuzraContentDto[]>;
    public abstract async DuplicateDuuzraContent(duuzraUuid: string, targetUuid: string): Promise<IDuuzraContentDto[]>;
    public abstract async getContentByUuid(clientUuid: string, duuzraUuid: string, id: string): Promise<IDuuzraContentDto>;
    public abstract async createContent(clientUuid: string, duuzraUuid: string, content: IDuuzraContentDto, flag: boolean, heightAndWidth: object): Promise<IDuuzraContentDto>;
    public abstract async deleteContent(clientUuid: string, duuzraUuid: string, uuid: string): Promise<IDuuzraContentDto>;
    public abstract async updateContent(clientUuid: string, duuzraUuid: string, content: IDuuzraContentDto): Promise<IDuuzraContentDto>;
    public abstract async checkContent(clientUuid: string, duuzraUuid: string, contentType: string): Promise<boolean>;  
    public abstract async getContentAttachmentVisibility(duuzraUuid: string, contentUuid: string, slideUuid: string): Promise<boolean>; 
    public abstract async getHiddenFiles(duuzraUuid: string): Promise<IDuuzraContentDto[]>;
}

export interface targetsInterface {
    uuid: string;
    backgroundColour: string;
    textColour: string;
}

export class ContentRepository implements IContentRepository {
    private readonly objectName = DuuzraContentMapper.getViewType();

    private mediaRepo: IMediaRepository;
    private contentMapper: DuuzraContentMapper;
    private notificationRepo: INotificationAddRemoveRepository;

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

    constructor() {
        this.mediaRepo = new MediaRepository();
        this.contentMapper = new DuuzraContentMapper();
        this.notificationRepo = new NotificationAddRemoveRepository();
    }

    // ####################################
    // # DATA READS
    // ####################################

   



    public updateRawContents(rawContents: any): any {
        let targets: Array<targetsInterface> = [];
        let n: targetsInterface;

        rawContents.docs[0].forEach((target) => {
            if (target.backgroundColour) {
                targets.push({ uuid: target.uuid, backgroundColour: target.backgroundColour, textColour: target.textColour });
            }
        });
 
        let i: number = 0;
        let j: number = 0;
        let index: number = 0;

        rawContents.docs[0].forEach((target) => {
            if (i == 0) {
                target.contentUuids.forEach((item) => { 
                    targets.forEach((t) => {
                        if (item.targetUuid == t.uuid && !item.backgroundColour) {  
                            item.backgroundColour = t.backgroundColour;
                            item.textColour = t.textColour;
                        }
                    });

                    index++;
                });
                i = 1;
            }
        });

        return rawContents;
    }

    public async getContentsByDuuzra(duuzraUuid: string): Promise<IDuuzraContentDto[]> {  
        console.log("content.repository.ts getContentsByDuuzra()");
        try {
            let duuzraDocId = 'duuzra-duuzra_' + duuzraUuid;
            let rawContents = await System.DB.get(this.objectName, 'duuzraId', duuzraDocId) as any;
            if (rawContents && rawContents.docs.length === 1) { 

                // Fill out with media
                let contentDtosPromises: Promise<IDuuzraContentDto>[] = [];
                rawContents.docs[0].forEach((contentDoc) => {
                    contentDtosPromises.push(
                        this.buildDto(contentDoc)
                    );
                });
                return Promise.all(contentDtosPromises);
            } else {
                return Promise.resolve(null);
            }
        } catch (err) { 
            return Promise.reject<IDuuzraContentDto[]>(err);
        }
    }
  
    public async getHiddenFiles(duuzraUuid: string): Promise<any[]> { 
        console.log("content.repository.ts getHiddenFiles()");
        try {
            let duuzraDocId = 'duuzra-duuzra_' + duuzraUuid;
            let rawContents = await System.DB.get("duuzraDuuzra", 'id', duuzraDocId) as any;
            if (rawContents && rawContents.docs.length === 1) {
                let contentDtosPromises: Promise<IDuuzraContentDto>[] = [];
                if (rawContents.docs[0].adHocs !== undefined){
                    return Promise.all(rawContents.docs[0].adHocs);
                } else{
                    return Promise.resolve(null);
                }
            } else {
                return Promise.resolve(null);
            }
        } catch (err) { 
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
            //return Promise.reject<IDuuzraContentDto[]>(err);
        }
    }

    public async getContentAttachmentVisibility(duuzraUuid: string, contentUuid: string, slideUuid: string): Promise<boolean>{  
        console.log("content.repository.ts getContentAttachmentVisibility()");
        let rawInfos;
        try{  
           rawInfos = await System.DB.get('duuzraSnapshot', 'docId', 'duuzra-snapshot_' + duuzraUuid) as any;
        }catch(e){
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
        }
        

        return new Promise<boolean>(resolve => {
            try { 
                let found: boolean = false; 

                if (rawInfos.docs.length > 0) {
                    let doc = rawInfos.docs[0];  
                    let snapshot = doc.snapshots;
    
                    if (snapshot.length > 0) { 
                        for (let i = 0; i < snapshot.length; i++) { 
                            if (!snapshot[i].isDraft) {  
                                if (snapshot[i].isActive) { 
                                    Object.keys(snapshot[i].payloads.content).forEach((contentId) => {
                                        if (snapshot[i].payloads.content[contentId].contentType !== 'layout-page') {
                                            if (snapshot[i].payloads.content[contentId].uuid == contentUuid) {
                                                //loop here for detail  
                                                for (let page of snapshot[i].payloads.content[contentId].pages) {
                                                    if (page.uuid == slideUuid) { 
                                                        if (page.isVisibleToAttendees === true) {                                      
                                                            resolve(true);
                                                        } else { 
                                                            resolve(false);
                                                        }
                                                                  
                                                    }
                                                }
                                            }
                                        }
                                    });
                                }
                            }
                        }
     
                    }
                }
            } catch (err) { 
                resolve(false);
            }
        });
   }

    

    public async checkContent(clientUuid: string, duuzraUuid: string, contentType: string): Promise<boolean> { 
        console.log("content.repository.ts checkContent()");
        try {
            let duuzraDocId = 'duuzra-duuzra_' + duuzraUuid;
            let rawContents = await System.DB.get(this.objectName, 'duuzraId', duuzraDocId) as any;
            if (!rawContents || !rawContents.docs || !rawContents.docs.length) {
                return Promise.reject<any>(new Error("No duuzra document found."));
            }
            let doc = rawContents.docs[0];
            if (!!doc && !!doc.length) {
                let sameContentType = doc.filter((item) => {
                    return item.contentType === contentType
                });
                if (!!sameContentType && !!sameContentType.length) {
                     
                    return Promise.reject<any>(new Error("There is already one of this content type"));
                }
            }
            return Promise.resolve(true);
        } catch (err) { 
            return Promise.reject<any>(err); 
        }
    }

    /**
     * Gets content by id
     */
    public async getContentByUuid(clientUuid: string, duuzraUuid: string, contentUuid: string): Promise<IDuuzraContentDto> {  
        console.log("content.repository.ts getContentsByUuid()");
        try {
            let rawContents = await System.DB.get(this.objectName, 'uuid', contentUuid) as any;
            if (rawContents && rawContents.docs.length === 1) {
                return Promise.resolve(this.buildDto(rawContents.docs[0]));
            } else {
                return Promise.resolve(null);
            }
        } catch (err) { 
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
            //return Promise.reject<IDuuzraContentDto>(err);
        }
    }
 
    private async buildDto(contentItemDoc: IDuuzraContentDoc): Promise<IDuuzraContentDto> { 
        console.log("content.repository.ts buildDto()");
        let backgroundMediaPromise: Promise<IDuuzraMediaDto>;
        let customIconMediaPromises: Promise<IDuuzraMediaDto>[] = [];

        let duuzraMediaUuids: string[] = []
        if (contentItemDoc.backgroundUuid) {
            duuzraMediaUuids.push(contentItemDoc.backgroundUuid);
        }

        if (contentItemDoc.contentUuids.length > 0) {
            // note - not content uuids but content child objects label to be renamed
            contentItemDoc.contentUuids.forEach((contentChild: IDuuzraContentChildDoc) => {
                if (contentChild.customIconMediaUuid) {
                    duuzraMediaUuids.push(contentChild.customIconMediaUuid);
                }
            });
        }

        if (duuzraMediaUuids.length > 0) {

            // Make the media requests
            let duuzraMediaDtoPromises: Promise<any>[] = []
            duuzraMediaUuids.forEach((duuzraMediaUuid: string) => {
                duuzraMediaDtoPromises.push(this.mediaRepo.getMediaByUuid(duuzraMediaUuid));
            });

            let mediaDtos = await Promise.all(duuzraMediaDtoPromises);
            return Promise.resolve(DuuzraContentMapper.mapToObj(contentItemDoc, mediaDtos));

        } else {
            return Promise.resolve(DuuzraContentMapper.mapToObj(contentItemDoc, null));
        }

    }

    private async buildWithChildrenDto(contentItemDoc, mediaDtos): Promise<IDuuzraContentDto> {
        console.log("content.repository.ts buildWithChildrenDto()");
        return Promise.resolve(DuuzraContentMapper.mapToObj(contentItemDoc, null));
    }

    // ####################################
    // # DATA CHANGES
    // ####################################

    /**
     * Saves the specified content
     */
    public async createContent(clientUuid: string, duuzraUuid: string, content: IDuuzraContentDto, canvasFlag: boolean, canvasjson: object): Promise<IDuuzraContentDto> { 
        console.log("content.repository.ts CreateContent()");
        let type = "add";
        try {
            // convert dto to doc
            let contentDoc : any = DuuzraContentMapper.mapToDoc(content);
 
            if (canvasFlag) {
                canvasjson['canvasUuid'] = contentDoc.uuid;   
                
                if (contentDoc.theme) {
                    contentDoc.theme['canvasFeature'] = canvasjson;
                } else {
                    //when theme is set to null let us initialize it with our canvas json 
                    contentDoc['theme'] = {
                        canvasFeature: canvasjson,
                        preview: null,
                        backgroundColour: null,
                        themePrimaryColour: null,
                        themeSecondaryColour: null,
                        buttonPrimaryColour: null,
                        buttonSecondaryColour: null,
                        buttonStyle: null,
                        buttonOpacity: 0,
                        buttonRoundCorner: false,
                        font: null,
                        size: null,
                        fontStyle: null,
                        fontWeight: null,
                        underLine: null,
                        borderLess: false,
                        customSize: false,
                        customHeight: null,
                        customWidth: null,
                        featureSettings: null,
                    }; 
                } 
                
            } 

            // load the duuzra doc
            let couchGet = await System.DB.get('duuzraDuuzra', 'id', 'duuzra-duuzra_' + duuzraUuid) as any;

            // adds the item to the duuzra document
            if (couchGet.docs.length === 1) {

                let duuzraDoc = couchGet.docs[0];
                if (duuzraDoc.contents) {
                    duuzraDoc.contents.push(contentDoc); // todo - check for conflict
                } else {
                    duuzraDoc.contents = [contentDoc]; // todo - check for conflict
                }
                if (canvasFlag) {//canvas flag, true if this content was created from canvas 
                    duuzraDoc.contents.forEach((item) => {
                        if (item.contentType === "layout-page") {
                            let contentIsert = {
                                targetUuid: contentDoc.uuid,
                                icon: null,
                                customIconMediaUuid: null,
                                textColour: "#71a2d6",
                                backgroundColour: "#00295d"
                            }
                            item.contentUuids.push(contentIsert);
                        }
                    })
                }
                // save the document
                let couchResponse = await System.DB.save(duuzraDoc);

                let mycontent = [];
                // end

                let DateNow = new Date();
                let time: string = DateNow.getHours().toString() + ":" + DateNow.getMinutes().toString() + ":" + DateNow.getSeconds().toString();

                let myDate = DateNow.getFullYear().toString() + "-" + (DateNow.getMonth() + 1).toString() + "-" + (DateNow.getDay() - 2).toString() + " " + time;

                // For notification
                let updateType = "Added Content";

                mycontent.push({
                    uuid: contentDoc.uuid,
                    name: contentDoc.title,
                    contentType: contentDoc.contentType,
                    updateType: updateType,
                    date: myDate
                });
                // end

                await this.updatenotification(duuzraUuid, clientUuid, duuzraDoc.info.name, mycontent, type);

            } else { 
                return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
                //return Promise.reject<IDuuzraContentDto>(null);
            }

            // resolve with the created item
            return Promise.resolve(this.buildDto(contentDoc));
        } catch (err) { 
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
            //return Promise.reject<IDuuzraContentDto>(err);
        }
    }

    /**
     * Deletes the content with the specified id
     */
    public async deleteContent(clientUuid: string, duuzraUuid: string, contentUuid: string): Promise<IDuuzraContentDto> { 
        console.log("content.repository.ts DeleteContent()");
        let type = "delete";
        try { 
            let deletedArr = null; 
            let couchGet = await System.DB.get('duuzraDuuzra', 'id', 'duuzra-duuzra_' + duuzraUuid) as any; 
            let mycontent = []; 
            let DateNow = new Date();
            let time: string = DateNow.getHours().toString() + ":" + DateNow.getMinutes().toString() + ":" + DateNow.getSeconds().toString(); 
            let myDate = new DateFormatter(null).toString();
            
            if (couchGet.docs.length == 1) { 
                let duuzraDoc = couchGet.docs[0];
                let found = duuzraDoc.contents.find((x, i, arr) => {
                    if (x.uuid == contentUuid) {

                        // For notification
                        let updateType = "Deleted Content";

                        if (x.contentType !== "layout-page") {
                            mycontent.push({
                                uuid: x.uuid,
                                name: x.title,
                                contentType: x.contentType,
                                updateType: updateType,
                                date: myDate
                            });
                        }
                        // end

                        deletedArr = duuzraDoc.contents.splice(i, 1);
                        return true;
                    } else {
                        return false;
                    }
                });

                await this.updatenotification(duuzraUuid, clientUuid, duuzraDoc.info.name, mycontent, type);

                if (found) {
                    // save the client doc
                    let couchResponse = await System.DB.save(duuzraDoc); 
                    return Promise.resolve(this.buildDto(deletedArr[0]));
                } else { 
                    //return Promise.reject<IDuuzraContentDto>(null);
                    return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
                } 
            } else { 
                //return Promise.reject<IDuuzraContentDto>(null);
                return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
            } 
        } catch (err) { 
            //return Promise.reject<IDuuzraContentDto>(err);
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
        }
    }




    
    

    /**
     * Updates the specified content
     */
    public async updateContent(clientUuid: string, duuzraUuid: string, content: any): Promise<IDuuzraContentDto> {  
        console.log("content.repository.ts UpdateContent()");
        let type = "update";         
        let isCanvasUpdate: boolean = false;   
        let isAttachToLayout: boolean = false;  
        if (content) {    
          if( content.theme) {
            if (content.theme.canvasFeature) {
                if (content.theme.canvasFeature['attachToLayout']) {
                    isAttachToLayout = true;
                    delete content.theme.canvasFeature['attachToLayout'];  
                }
            }
          }
        }    

 
        if (content.sortOrder != 111110) {
            try {   
                let contentDoc = DuuzraContentMapper.mapToDoc(content);
                if (content.backgroundUuid || content.backgroundUuid !== undefined){
                    contentDoc.backgroundUuid = content.backgroundUuid;
                }  

                let couchGet = await System.DB.get('duuzraDuuzra', 'id', 'duuzra-duuzra_' + duuzraUuid) as any;

                let y = 15;
                let y_increment = 43; 
                if (couchGet.docs.length === 1) { 
                    let duuzraDoc = couchGet.docs[0]; 
                    duuzraDoc.contents.forEach((_content) => { 
                        if (_content.contentType != "layout-page") { 

                            
                            if (!_content.theme || _content.theme == null) {  
                                    _content['theme'] = { 
                                        preview: null,
                                        backgroundColour: null,
                                        themePrimaryColour: null,
                                        themeSecondaryColour: null,
                                        buttonPrimaryColour: null,
                                        buttonSecondaryColour: null,
                                        buttonStyle: null,
                                        buttonOpacity: 0,
                                        buttonRoundCorner: false,
                                        font: null,
                                        size: null,
                                        fontStyle: null,
                                        fontWeight: null,
                                        underLine: null,
                                        borderLess: false,
                                        customSize: false,
                                        customHeight: null,
                                        customWidth: null,
                                        featureSettings: null,
                                    };  
                            } 

                            if (_content.theme) {
                                if (_content.theme['canvasFeature']) {  
                                    if (_content.theme['canvasFeature'].y >= y) {
                                        y = _content.theme['canvasFeature'].y + y_increment; 
                                    } 
                                }
                            } 
                        }

                    }); 

 
                    duuzraDoc.contents.forEach((_content) => { 
                        if (_content.contentType == "layout-page") {
                            if (isAttachToLayout) {
                                isCanvasUpdate = true;

                                let newattachment: any = {
                                    backgroundColour: null,
                                    customIconMedia: null,
                                    icon: null,
                                    targetUuid: content.uuid,
                                    textColour: null
                                };

                                _content.contentUuids.push(newattachment);
                            }
                        } else {
                            
                            if (_content.theme) {  //if canvas is not yet defined, automatically set this up 
                                if (!_content.theme['canvasFeature']) {
                                    _content.theme['canvasFeature'] = {
                                        x: 50, y: y, height: 35, width: 200, 
                                        uuid: _content.contentType,
                                        canvasUuid: _content.uuid
                                    };
                                    y = y + y_increment;
                                } else {
                                    
                                }
                            }

                        }

                        
                        contentDoc.contentUuids.forEach((v) => {   
                            if (_content.uuid == v.targetUuid && content.backgroundColour && !v.backgroundColour) { /// update the contentDoc
                                v.backgroundColour = _content.backgroundColour;
                                v.textColour = _content.textColour;
                            }

                            if (_content.uuid == v.targetUuid && v.backgroundColour) { // update the duuzraDoc
                                _content.backgroundColour = v.backgroundColour;
                                _content.textColour = v.textColour;
                            }
                            
                        });
                    });

                    let myDate = new DateFormatter(null).toString();

                    let mycontent = []; 


                    let found = duuzraDoc.contents.find((x, i, arr) => {
                        if (x.uuid === content.uuid) {
                            // For notification
                            let updateType = "Content Update";
                            if (x.title !== content.title) {
                                updateType = "Name Chanage from " + '"' + x.title + '"';
                            }
                            if (content.contentType !== "layout-page") {
                                mycontent.push({
                                    uuid: content.uuid,
                                    name: content.title,
                                    contentType: content.contentType,
                                    updateType: updateType,
                                    date: myDate
                                });
                            } else {
                                let layout = duuzraDoc.contents[i];
                                let targetUuid = "";
                                layout.contentUuids.forEach((data) => {
                                    let bol = true;

                                    if (contentDoc.contentUuids.length > 0) {
                                        contentDoc.contentUuids.forEach((mydata) => {
                                            if (mydata.targetUuid === data.targetUuid) {
                                                bol = false;
                                            }
                                        });
                                    }
                                    if (bol) {
                                        targetUuid = data.targetUuid;
                                    }
                                });
                                 

                                duuzraDoc.contents.forEach((data) => {
                                    if (data.uuid === targetUuid) {
                                        mycontent.push({
                                            uuid: data.uuid,
                                            name: data.title,
                                            contentType: data.contentType,
                                            updateType: updateType,
                                            date: myDate
                                        });
                                    }
                                });
                                this.updatenotification(duuzraUuid, clientUuid, duuzraDoc.info.name, mycontent, type);
                            }
                            // end
                            duuzraDoc.contents.splice(i, 1, contentDoc);
 
                            return true;
                        } else {
                            return false;
                        }
                    });

                    if (found || isCanvasUpdate) {  
                        let couchResponse = await System.DB.save(duuzraDoc);
                        await this.updateDuuzraSnapshot(duuzraUuid, clientUuid, duuzraDoc); 
                        return Promise.resolve(this.buildDto(contentDoc));
                    } else { 
                        return Promise.reject<IDuuzraContentDto>(null);
                    }

                }

            } catch (err) { 
                return Promise.reject<IDuuzraContentDto>(err);

            }
        } else if (content.sortOrder == 111110) {
            try {

                let couchGet = await System.DB.get('duuzraDuuzra', 'id', 'duuzra-duuzra_' + duuzraUuid) as any;
                let duuzraDoc = couchGet.docs[0];
                let found = duuzraDoc.contents.find((x, i, arr) => {
                    if (x.uuid === content.uuid) {
                        x.views += content.views;
                        x.notesCount += content.notesCount;
                        x.questionCount += content.questionCount;
                        x.uniqueCount += content.uniqueCount;
                        return true;
                    } else {
                        return false;
                    }
                });
                if (found) { 
                    let couchResponse = await System.DB.save(duuzraDoc);  
                } else { 
                    return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
                    //return Promise.reject<IDuuzraContentDto>(null);
                }
            } catch (err) { 
                return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
            }

        }
        return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
    }


 
    public async updateDuuzraSnapshotSlideVisibility(duuzraUuid: string, contentUuid: string, slideUuid : string,  toggle: boolean) { 
        try { 
            let rawInfos = await System.DB.get('duuzraSnapshot', 'docId', 'duuzra-snapshot_' + duuzraUuid) as any; 

            if (rawInfos.docs.length > 0) {
                let doc = rawInfos.docs[0];
                let snapshot = doc.snapshots;

                if (snapshot.length > 0) {
                    
                    for (let i = 0; i < snapshot.length; i++) {

                        if (!snapshot[i].isDraft) {
 
                            if (snapshot[i].isActive) {

                                Object.keys(snapshot[i].payloads.content).forEach((contentId) => {
                                    if (snapshot[i].payloads.content[contentId].contentType !== 'layout-page') {
                                        if (snapshot[i].payloads.content[contentId].uuid == contentUuid) {
                                            //loop here for detail  
                                            for (let page of snapshot[i].payloads.content[contentId].pages) {
                                                if (page.uuid == slideUuid) {
                                                    page.isVisibleToAttendees = toggle;
                                                }
                                            }
                                        }
                                    }
                                });
                            }
                        }
                    

                        doc._rev = rawInfos.docs[0]._rev;
                        await System.DB.save(doc);
                    }
                }//if  
            }// rawInfos.docs.length > 0
        } catch (err) { 
        }
    }

    public async updateDuuzraSnapshot(duuzraUuid: string, clientUuid: string, mycontent: any) { 
        try {
            let rawInfos = await System.DB.get('duuzraSnapshot', 'docId', 'duuzra-snapshot_' + duuzraUuid) as any;
            if (rawInfos.docs.length > 0) {
                let doc = rawInfos.docs[0];
                let snapshot = doc.snapshots;
                if (rawInfos && snapshot.length > 0) {
                    for (let i = 0; i < snapshot.length; i++) {
                        if (!snapshot[i].isDraft) {
                            if (snapshot[i].isActive) {
                                Object.keys(snapshot[i].payloads.content).forEach((duuzraId) => {
                                    mycontent.contents.forEach((content) => {
                                        if (snapshot[i].payloads.content[duuzraId].contentType !== 'layout-page') {
                                            if (content.uuid === rawInfos.docs[i].payloads.content[duuzraId].uuid) {
                                                snapshot[i].payloads.content[duuzraId].theme = content.theme;
                                            }
                                        }
                                    })
                                });
                            }
                        }
                    }

                    doc._rev = rawInfos.docs[0]._rev;
                    await System.DB.save(doc);
                }
            }
        } catch (err) { 
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

    public async DuplicateDuuzraContent(duuzraUuid: string, targetUuid: string): Promise<IDuuzraContentDto[]> { 
        console.log("content.repository.ts DuplicateDuuzraContent()");
        try { 
            let rawOrigDuuzra = await this.getContentsByDuuzra(duuzraUuid); 
            let rawDuplicateDuuzra = await this.getContentsByDuuzra(targetUuid);  
            let couchGet1 = await System.DB.get('duuzraDuuzra', 'id', 'duuzra-duuzra_' + duuzraUuid) as any; 
            couchGet1 = couchGet1.docs[0]; 
            let origContentUuids = rawOrigDuuzra[0].contentUuids; 
            let origContents: IDuuzraContentDto[] = [];
            let istarget: boolean;
            let extraContents: IDuuzraContentDto[] = [];  
            let Attendees: any;
            let Groups: any; 
            couchGet1.groups.forEach((data, i, ss) => {
                couchGet1.groups[i].uuid = UUID.UUID();
            });  
            Attendees = couchGet1.attendees;
            Groups = couchGet1.groups; 
            couchGet1.contents.forEach((data, i, ss) => {
                let myUuid = UUID.UUID();
                istarget = false;
                origContentUuids.forEach((val, x, sss) => {
                    if (data.uuid === val.targetUuid) {
                        rawOrigDuuzra[0].contentUuids[x].targetUuid = myUuid;
                        istarget = true;
                    }
                });

                if (istarget) {  
                    data.uuid = myUuid;  
                    origContents.push(data);
                } else {
                    data.uuid = UUID.UUID();  
                    extraContents.push(data);
                }
            });

            let couchGet = await System.DB.get('duuzraDuuzra', 'id', 'duuzra-duuzra_' + targetUuid) as any; 
            if (couchGet.docs.length === 1) { 
                let duuzraDoc = couchGet.docs[0];
                if (duuzraDoc.contents) {
                    duuzraDoc.contents[0].contentUuids = rawOrigDuuzra[0].contentUuids;
                    origContents.forEach((data, i, ss) => {
                        duuzraDoc.contents.push(data);
                    });

                    extraContents.forEach((data, i, ss) => {
                        if (i > 0) { 
                            duuzraDoc.contents.push(data);
                        }
                    });

                } else {
                    duuzraDoc.contents = [rawDuplicateDuuzra[0]];
                }

                duuzraDoc.info.theme.buttonStyle = couchGet1.info.theme.buttonStyle; 
                duuzraDoc.attendees = Attendees; 
                duuzraDoc.groups = Groups;    

                let couchResponse = await System.DB.save(duuzraDoc); 
                return Promise.resolve(rawOrigDuuzra);
            } else { 
                //return Promise.reject<IDuuzraContentDto[]>(null);
                return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
            }
        } catch (err) {
            //return Promise.reject<IDuuzraContentDto[]>(err);
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
        }

    }
}

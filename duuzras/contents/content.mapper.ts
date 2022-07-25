import { IDuuzraMediaDto } from '../../duuzra_types/duuzras';
import { IDuuzraContentDto } from '../../duuzra_types/duuzras';
import { IDuuzraContentDoc } from '../../models/duuzra-content-doc';
import {
    IDuuzraContentChildDto,
    IDuuzraContentPageDto,
    IDuuzraContentPresentationDto,
    IDuuzraContentDocumentDto,
    IDuuzraContentHotspotDto,
    IDuuzraContentPollDto,
    IDuuzraContentPageBuilderDto,
    IDuuzraContentDocumentPageDto,
    IDuuzraContentPageBuilderPageDto,
    IDuuzraContentFormDto,
    IDuuzraContentAgendaDto
} from '../../duuzra_types/duuzras';

import { IDuuzraContentChildDoc } from '../../models/duuzra-contentchild-doc';
import { IDuuzraContentPresentationDoc } from '../../models/duuzra-content-presentation-doc';
import { IDuuzraContentPageDoc } from '../../models/duuzra-content-page-doc';
import { IDuuzraContentPollDoc } from '../../models/duuzra-content-poll-doc';
import { IDuuzraContentHotspotDoc } from '../../models/duuzra-content-hotspot-doc';
import { IDuuzraContentDocumentDoc } from '../../models/duuzra-content-document-doc';
import { IDuuzraContentPageBuilderDoc } from "../../models/duuzra-content-page-builder-doc";
import { IDuuzraContentDocumentPageDoc } from "../../models/duuzra-content-document-page-doc";
import { IDuuzraContentPageBuilderPageDoc } from "../../models/duuzra-content-page-builder-page-doc";
import { IDuuzraContentFormDoc } from "../../models/duuzra-content-form-doc";
import { IDuuzraContentAgendaDoc } from "../../models/duuzra-content-agenda-doc";

const uuidgen = require('uuid/v1');
export class DuuzraContentMapper {

    public static getViewType() {
        return 'duuzraContent';
    }

    public static mapToObj(contentDoc: IDuuzraContentDoc, mediaDtos: IDuuzraMediaDto[]): IDuuzraContentDto {

        let mediaDto = mediaDtos && mediaDtos.length ? mediaDtos.find((dto) => dto.uuid === contentDoc.backgroundUuid) : null;
        let contentDto: IDuuzraContentDto = {
            uuid: contentDoc.uuid,
            contentType: contentDoc.contentType || '',
            title: contentDoc.title,
            tags: contentDoc.tags,
            sortOrder: contentDoc.sortOrder,
            contentUuids: this.mapContentChildrenToDto(contentDoc.contentUuids || [], mediaDtos),
            backgroundMedia: mediaDto,
            allowDownload: contentDoc.allowDownload,
            isFirstPageSet: contentDoc.isFirstPageSet, 
            isTrackingSwitch: contentDoc.isTrackingSwitch,
            theme: contentDoc.theme,
            views: contentDoc.views,
            notesCount: contentDoc.notesCount,
            questionCount: contentDoc.questionCount,
            uniqueCount: contentDoc.uniqueCount,
            backgroundColour: contentDoc.backgroundColour,
            textColour: contentDoc.textColour,
            icon: contentDoc.icon,
            address: contentDoc.address,
            locked: contentDoc.locked, 
            isVisibleToAttendees : contentDoc.isVisibleToAttendees 
        };

        switch (contentDto.contentType.toLowerCase()) {
            case 'presentation':
                let contentPresentationDto: IDuuzraContentPresentationDto = contentDoc as IDuuzraContentPresentationDto;
                let contentPresentationDoc: IDuuzraContentPresentationDoc = contentDoc as IDuuzraContentPresentationDoc;
                if (contentPresentationDoc.pages) {
                    contentPresentationDto.pages = this.mapContentDocumentPageDocToDocumentPageDto(contentPresentationDoc.pages || []);
                }
                return contentPresentationDto;
            case 'document':
                let contentDocumentDto: IDuuzraContentDocumentDto = contentDoc as IDuuzraContentDocumentDto;
                let contentDocumentDoc: IDuuzraContentDocumentDoc = contentDoc as IDuuzraContentDocumentDoc;
                if (contentDocumentDoc.pages) {
                    contentDocumentDto.pages = this.mapContentDocumentPageDocToDocumentPageDto(contentDocumentDoc.pages || []);
                }
                return contentDocumentDto;
            case 'agenda':
                const contentAgendaDto: IDuuzraContentAgendaDto = contentDoc as IDuuzraContentAgendaDto;
                const contentAgendaDoc: IDuuzraContentAgendaDoc = contentDoc as IDuuzraContentAgendaDoc;
                contentAgendaDto.sessions = contentAgendaDoc.sessions;
                // if (contentAgendaDto.sessions) {
                //     contentAgendaDoc.sessions = ;
                // }
                return contentAgendaDto;
            case 'pagebuilder':
                let contentPageBuilderDto: IDuuzraContentPageBuilderDto = contentDoc as IDuuzraContentPageBuilderDto;
                let contentPageBuilderDoc: IDuuzraContentPageBuilderDoc = contentDoc as IDuuzraContentPageBuilderDoc;
                if (contentPageBuilderDoc.pages) {
                    contentPageBuilderDto.pages = this.mapContentPageBuilderPageDocToPageBuilderPageDto(contentPageBuilderDoc.pages || []);
                }
                return contentPageBuilderDto;
            case 'form':
                return contentDoc as IDuuzraContentFormDto;
            case 'poll':
                return contentDoc as IDuuzraContentPollDto;
            case 'hotspot':
                return contentDoc as IDuuzraContentHotspotDto;
            default:
                return contentDto;
        }
    }

    public static mapToDoc(contentDto: IDuuzraContentDto): IDuuzraContentDoc {

        // Auto id
        if (!contentDto.uuid) {
            contentDto.uuid = uuidgen();
        }

        let mapped: any = this.mapContentChildrenToDoc(contentDto.contentUuids || []);

        /// TODO duplicate content  james
        let contentDoc: IDuuzraContentDoc = {
            uuid: contentDto.uuid,
            contentType: contentDto.contentType || '',
            title: contentDto.title,
            tags: contentDto.tags,
            sortOrder: contentDto.sortOrder,
            allowDownload: contentDto.allowDownload,
            isFirstPageSet: contentDto.isFirstPageSet,
            isTrackingSwitch: contentDto.isTrackingSwitch,
            contentUuids: mapped ,
            backgroundUuid: contentDto.backgroundMedia ? contentDto.backgroundMedia.uuid : null, // Some content uses backgroundUuid so this should be modified.
            theme: contentDto.theme,
            views: contentDto.views,
            notesCount: contentDto.notesCount,
            questionCount: contentDto.questionCount,
            uniqueCount: contentDto.uniqueCount,
            backgroundColour: contentDto.backgroundColour,
            textColour: contentDto.textColour,
            icon: contentDto.icon,
            address: contentDto.address,
            locked: contentDto.locked,
            isVisibleToAttendees : contentDto.isVisibleToAttendees
        };

        switch (contentDto.contentType.toLowerCase()) {
            case 'presentation':
                let contentPresentationDto: IDuuzraContentPresentationDto = contentDto as IDuuzraContentPresentationDto;
                let contentPresentationDoc: IDuuzraContentPresentationDoc = contentDoc as IDuuzraContentPresentationDoc;
                if (contentPresentationDto.pages) {
                    contentPresentationDoc.pages = this.mapContentDocumentPageDtoToDocumentPageDoc(contentPresentationDto.pages || []);
                }
                return contentPresentationDoc;
            case 'document':
                let contentDocumentDto: IDuuzraContentDocumentDto = contentDto as IDuuzraContentDocumentDto;
                let contentDocumentDoc: IDuuzraContentDocumentDoc = contentDoc as IDuuzraContentDocumentDoc;
                if (contentDocumentDto.pages) {
                    contentDocumentDoc.pages = this.mapContentDocumentPageDtoToDocumentPageDoc(contentDocumentDto.pages || []);
                }
                return contentDocumentDoc;
            case 'pagebuilder':
                let contentPageBuilderDto: IDuuzraContentPageBuilderDto = contentDto as IDuuzraContentPageBuilderDto;
                let contentPageBuilderDoc: IDuuzraContentPageBuilderDoc = contentDoc as IDuuzraContentPageBuilderDoc;
                if (contentPageBuilderDto.pages) {
                    contentPageBuilderDoc.pages = this.mapContentPageBuilderPageDtoToPageBuilderPageDoc(contentPageBuilderDto.pages || []);
                }
                return contentPageBuilderDoc;
            case 'agenda':
                const contentAgendaDto: IDuuzraContentAgendaDto = contentDto as IDuuzraContentAgendaDto;
                const contentAgendaDoc: IDuuzraContentAgendaDoc = contentDoc as IDuuzraContentAgendaDoc;
                contentAgendaDoc.sessions = contentAgendaDto.sessions;
                // if (contentAgendaDto.sessions) {
                //     contentAgendaDoc.sessions = ;
                // }
                return contentAgendaDoc;
            case 'form':
                let contentFormDto: IDuuzraContentFormDto = contentDto as IDuuzraContentFormDto;
                let contentFormDoc: IDuuzraContentFormDoc = contentFormDto as IDuuzraContentFormDoc;

                for (let i = 0; i < contentFormDoc.formElements.length; i++) {
                    if (!contentFormDoc.formElements[i].uuid) {
                        contentFormDoc.formElements[i].uuid = uuidgen();
                    }
                }

                return contentFormDoc;
            case 'poll':
                let duuzraContentPoll = contentDto as IDuuzraContentPollDto;
                if (duuzraContentPoll.responses) {
                    for (let i = 0; i < duuzraContentPoll.responses.length; i++) {
                        if (!duuzraContentPoll.responses[i].uuid) {
                            duuzraContentPoll.responses[i].uuid = uuidgen();
                        }
                    }
                }

                return duuzraContentPoll;
            case 'hotspot':
                let contentHotspotDoc: IDuuzraContentHotspotDoc = contentDto as IDuuzraContentHotspotDoc;
                return contentHotspotDoc;
            default:
                return contentDoc;
        }
    }

    public static mapContentChildrenToDoc(contentChildDtos: IDuuzraContentChildDto[]): IDuuzraContentChildDoc[] {
        return contentChildDtos.map((dto) => {
            return this.mapContentChildToDoc(dto);
        });
    }

    public static mapContentChildrenToDto(contentChildDocs: IDuuzraContentChildDoc[],
                                          duuzraMediaDtos: IDuuzraMediaDto[]): IDuuzraContentChildDto[] { 
        return contentChildDocs.map((doc) => {
            let mediaDto = duuzraMediaDtos ? duuzraMediaDtos.find((dto) => dto.uuid === doc.customIconMediaUuid) : null;
            return this.mapContentChildToDto(doc, mediaDto);
        });
    }

    public static mapContentChildToDoc(contentChildDto: IDuuzraContentChildDto): IDuuzraContentChildDoc {

        return {
            targetUuid: contentChildDto.targetUuid,
            icon: contentChildDto.icon,
            customIconMediaUuid: contentChildDto.customIconMedia ? contentChildDto.customIconMedia.uuid : null,
            textColour: contentChildDto.textColour,
            backgroundColour: contentChildDto.backgroundColour
        }

    }

    public static mapContentDocumentPageDtoToDocumentPageDoc(contentChildDto: IDuuzraContentDocumentPageDto[]): IDuuzraContentDocumentPageDoc[] {
        let result: IDuuzraContentDocumentPageDoc[] = [];

        for (let i = 0; i < contentChildDto.length; i++) {
            result.push({
                uuid: contentChildDto[i].uuid ? contentChildDto[i].uuid : uuidgen(),
                path: contentChildDto[i].path,
                pageNo: contentChildDto[i].pageNo,
                childContentUuids: contentChildDto[i].childContentUuids,
                isLocked: contentChildDto[i].isLocked,
                pageTitle: contentChildDto[i].pageTitle,
                fileSize: contentChildDto[i].fileSize,
                dimensions: contentChildDto[i].dimensions
            });
        }

        return result;
    }

    public static mapContentmapContentDocumentPageDtoToDocumentPageDoc(contentChildDto: IDuuzraContentPageBuilderPageDto[]): IDuuzraContentPageBuilderPageDoc[] {
        let result: IDuuzraContentPageBuilderPageDoc[] = [];

        for (let i = 0; i < contentChildDto.length; i++) {
            result.push({
                uuid: contentChildDto[i].uuid ? contentChildDto[i].uuid : uuidgen(),
                pageNo: contentChildDto[i].pageNo,
                childContentUuids: contentChildDto[i].childContentUuids,
                pageTitle: contentChildDto[i].pageTitle,
                body: contentChildDto[i].body,
                title: contentChildDto[i].title,
                subtitle: contentChildDto[i].subtitle,
                imageCollapsed: contentChildDto[i].imageCollapsed,
                linkedFeaturesCollapsed: contentChildDto[i].linkedFeaturesCollapsed,
                textCollapsed: contentChildDto[i].textCollapsed,
                imageMediaUuid: contentChildDto[i].imageMediaUuid,
                linkedFeatures: contentChildDto[i].linkedFeatureUuids
            });
        }

        return result;
    }

    public static mapContentDocumentPageDocToDocumentPageDto(contentChildDto: IDuuzraContentDocumentPageDoc[]): IDuuzraContentDocumentPageDto[] {
        let result: IDuuzraContentDocumentPageDto[] = [];

        for (let i = 0; i < contentChildDto.length; i++) {
            result.push({
                uuid: contentChildDto[i].uuid ? contentChildDto[i].uuid : uuidgen(),
                path: contentChildDto[i].path,
                pageNo: contentChildDto[i].pageNo,
                childContentUuids: contentChildDto[i].childContentUuids,
                isLocked: contentChildDto[i].isLocked,
                pageTitle: contentChildDto[i].pageTitle,
                fileSize: contentChildDto[i].fileSize,
                dimensions: contentChildDto[i].dimensions
            });
        }

        return result;
    }

    // tslint:disable-next-line:max-line-length
    public static mapContentPageBuilderPageDtoToPageBuilderPageDoc(contentChildDto: IDuuzraContentPageBuilderPageDto[]): IDuuzraContentPageBuilderPageDoc[] {
        let result: IDuuzraContentPageBuilderPageDoc[] = [];

        for (let i = 0; i < contentChildDto.length; i++) {
            result.push({
                uuid: contentChildDto[i].uuid ? contentChildDto[i].uuid : uuidgen(),
                pageNo: contentChildDto[i].pageNo,
                childContentUuids: contentChildDto[i].childContentUuids,
                pageTitle: contentChildDto[i].pageTitle,
                subtitle: contentChildDto[i].subtitle,
                body: contentChildDto[i].body,
                title: contentChildDto[i].title,
                imageMediaUuid: contentChildDto[i].imageMediaUuid,
                imageCollapsed: contentChildDto[i].imageCollapsed,
                textCollapsed: contentChildDto[i].textCollapsed,
                linkedFeaturesCollapsed: contentChildDto[i].linkedFeaturesCollapsed,
                linkedFeatures: contentChildDto[i].linkedFeatureUuids
            });
        }

        return result;
    }

    // tslint:disable-next-line:max-line-length
    public static mapContentPageBuilderPageDocToPageBuilderPageDto(contentChildDto: IDuuzraContentPageBuilderPageDoc[]): IDuuzraContentPageBuilderPageDto[] {
        let result: IDuuzraContentPageBuilderPageDto[] = [];

        for (let i = 0; i < contentChildDto.length; i++) {
            result.push({
                uuid: contentChildDto[i].uuid ? contentChildDto[i].uuid : uuidgen(),
                pageNo: contentChildDto[i].pageNo,
                childContentUuids: contentChildDto[i].childContentUuids,
                pageTitle: contentChildDto[i].pageTitle,
                subtitle: contentChildDto[i].subtitle,
                body: contentChildDto[i].body,
                title: contentChildDto[i].title,
                imageMediaUuid: contentChildDto[i].imageMediaUuid,
                imageCollapsed: contentChildDto[i].imageCollapsed,
                textCollapsed: contentChildDto[i].textCollapsed,
                linkedFeaturesCollapsed: contentChildDto[i].linkedFeaturesCollapsed,
                linkedFeatureUuids: contentChildDto[i].linkedFeatures
            });
        }

        return result;
    }

    public static mapContentChildToDto(contentChildDoc: IDuuzraContentChildDoc, duuzraMediaDto: IDuuzraMediaDto): IDuuzraContentChildDto {

        return {
            targetUuid: contentChildDoc.targetUuid,
            icon: contentChildDoc.icon,
            customIconMedia: duuzraMediaDto,
            textColour: contentChildDoc.textColour,
            backgroundColour: contentChildDoc.backgroundColour
        }
    }
}

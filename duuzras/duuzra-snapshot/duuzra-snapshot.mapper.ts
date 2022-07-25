
import { IDuuzraSnapshotDto, ISnapshotDeltaDto } from '../../duuzra_types/duuzras';
import { IDuuzraSnapshotDoc, IDuuzraSnapshotPayloadDoc } from '../../models/duuzra-snapshot-doc';

import { IDuuzraMediaPath } from '../../models/duuzra-media-path-doc';
const uuidgen = require('uuid/v1');
var etag = require('etag');

export class DuuzraSnapshotMapper {

    public static getViewType() { return 'duuzraSnapshot'; }

    public static mapToObj(snapshotDoc: IDuuzraSnapshotDoc): IDuuzraSnapshotDto {

        // Get the snapshot user document keys. These are the authUuids
        const userUuids = Object.getOwnPropertyNames(snapshotDoc.users);

        return {
            uuid: snapshotDoc.uuid,
            duuzraUuid: snapshotDoc.duuzraUuid,
            title: snapshotDoc.title,
            assignedUsers: userUuids || [],
            security: snapshotDoc.security,
            isDraft: snapshotDoc.isDraft,
            isActive: snapshotDoc.isActive,
            dateCreated: snapshotDoc.dateCreated,
            dateDeleted: snapshotDoc.dateDeleted,
            dateModified: snapshotDoc.dateModified,
            createdBy: snapshotDoc.createdBy,
            modifiedBy: snapshotDoc.modifiedBy,
            refreshContent: false,
            notesCount: snapshotDoc.notesCount,
            questionCount: snapshotDoc.questionCount,
            features: snapshotDoc.features,
            expiryDate: snapshotDoc.expiryDate,
            isCanvas: snapshotDoc.isCanvas, 
            nameofUploadedImage: snapshotDoc.nameofUploadedImage
        };
    }

    public static buildSnapshotDeltaPayload(snapshotDoc: IDuuzraSnapshotDoc, ContentPath: IDuuzraMediaPath): ISnapshotDeltaDto {
        let content: any;
        return {
            snapshotUuid: snapshotDoc.uuid,
            info: snapshotDoc.payloads.info,
            content: snapshotDoc.payloads.content,
            translations: snapshotDoc.payloads.translations,
            adHoc: snapshotDoc.payloads.adHoc, 
            paths: ContentPath
        };
    }

    public static mapToDoc(snapshotDto: IDuuzraSnapshotDto, payload: IDuuzraSnapshotPayloadDoc): IDuuzraSnapshotDoc {

        // Auto id
        if (!snapshotDto.uuid) {
            snapshotDto.uuid = uuidgen();
        }

        return {
            uuid: snapshotDto.uuid,
            duuzraUuid: snapshotDto.duuzraUuid,
            title: snapshotDto.title,
            isDraft: snapshotDto.isDraft,
            isActive: snapshotDto.isActive,
            eTag: this.createPayloadETag(payload),
            dateCreated: snapshotDto.dateCreated,
            dateDeleted: snapshotDto.dateDeleted,
            createdBy: snapshotDto.createdBy,
            dateModified: snapshotDto.dateModified,
            modifiedBy: snapshotDto.modifiedBy,
            payloads: payload,
            attendees: null, // this is handled in the repositories after this call.
            users: null, // this is handled in the repositories after this call.
            security: snapshotDto.security,
            notesCount: snapshotDto.notesCount,
            questionCount: snapshotDto.questionCount,
            features: snapshotDto.features,
            expiryDate: snapshotDto.expiryDate,
            isCanvas: snapshotDto.isCanvas,
            nameofUploadedImage: snapshotDto.nameofUploadedImage 
        }
    }

    private static createPayloadETag(payload) {
        let generatedETag = etag(JSON.stringify(payload)); 
        return generatedETag;
    }

}

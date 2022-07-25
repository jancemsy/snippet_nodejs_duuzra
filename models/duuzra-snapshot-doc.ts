import { IDbModel } from '../duuzra_types/database';
import { IKeyValuePair } from '../duuzra_types/common';
import { IDuuzraInfoDto } from '../duuzra_types/duuzras';
import { IDuuzraContentDto } from '../duuzra_types/duuzras';

export interface IDuuzraSnapshotsDoc extends IDbModel {
    snapshots: IDuuzraSnapshotDoc[];
}

export interface IDuuzraSnapshotDoc {
    uuid: string;
    duuzraUuid: string;
    title: string;
    isDraft: boolean;
    isActive: boolean;
    eTag: string;
    dateCreated: string;
    createdBy: string;
    dateModified: string;
    dateDeleted: string;
    modifiedBy: string;
    payloads: IDuuzraSnapshotPayloadDoc;
    users: IKeyValuePair<IDuuzraSnapshotUserPermissionsDoc>;
    attendees: any;
    security: {
        isSecure: boolean;
        pinCode: string | null;
        urlToken: string | null;
    }
    notesCount:  number;
    questionCount:  number;
    features: number;
    expiryDate: string;
    isCanvas: boolean; 
    nameofUploadedImage: string;
}

export interface IDuuzraSnapshotPayloadDoc {
    info: IDuuzraInfoDto;
    content: IKeyValuePair<IDuuzraContentDto>;
    translations: IKeyValuePair<any>;
    adHoc: IKeyValuePair<any>
}
export interface IDuuzraSnapshotUserPermissionsDoc {
    isMasterEnabled: boolean,
    isMessagingEnabled: boolean,
    isNotesEnabled: boolean,
    isQuestionsEnabled: boolean
}

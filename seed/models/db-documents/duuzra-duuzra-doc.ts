import { IDbModel } from '../database/index';

export interface IDuuzraDoc extends IDbModel {
    clientUuid: string
    info: {
        accountUuid: string;
        name: string;
        thumbnailUuid: string
        size?: string;
        isTemplate?: boolean;
        childDuuzras?: string[];
        createdBy?: string;
        dateCreated?: string; // should be serializable datetime
        dateModified?: string; // should be serializable datetime
        dateDeleted?: string; // should be serializable datetime
        tags?: string[];
        theme: any; // Should be seperated ref
        address: string
    },
    contents: [{
        uuid: string
        contentType: string;
        title: string;
        sortOrder: number;
        contentUuids: string[];
        backgroundUuid?: string;
    }],
    media: [{
        uuid: string
    }],
    administrators: string[]
}

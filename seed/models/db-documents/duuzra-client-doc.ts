import { IDbModel } from '../database/index';

export interface IClientDoc extends IDbModel  {
    info: {}
    accounts: [{
        uuid: string,
        name: string
    }],
    media: [{
        uuid: string,
        mediaUuid: string
    }],
    duuzras: [{
        uuid: string
    }],
    folders: [{
        parentUuid: string;
        accountUuid: string;
        title: string;
        thumbnail: string;
        duuzraUuids: string[];
    }]
}

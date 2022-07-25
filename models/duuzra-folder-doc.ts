import { IDbModel } from '../duuzra_types/database';

export interface IDuuzraFolderDoc {
    uuid: string;
    parentUuid: string;
    accountUuid: string;
    title: string;
    thumbnail: string;
    duuzraUuids: string[];
    dateCreated: string;
    deletedDate: string;
    isPin: boolean;
}

import { IDbModel } from '../duuzra_types/database';

export interface IUserDataDoc extends IDbModel {
    userData: IUserDataDuuzraItemDoc[],
}

export interface IUserDataDuuzraItemDoc {
    uuid: string;
    authUuid: string;
    duuzraUuid: string;
    contentUuid: string;
    type: string;
    dateCreated: string;
}

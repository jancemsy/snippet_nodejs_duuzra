import { IDbModel } from '../duuzra_types/database';

export interface IDuuzraMediaDoc {
    mediaType?: string;
    mediaUuid: string;
    uuid: string;
    duuzraUuid: string
    dateDeleted: string;
    isAdHoc: boolean
}

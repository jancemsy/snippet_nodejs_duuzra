import { IDbModel } from '../../database/index';

export interface IMediaDoc extends IDbModel {
    fileType?: string;
    name?: string;
    url: string;
}

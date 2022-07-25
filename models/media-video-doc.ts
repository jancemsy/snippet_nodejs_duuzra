import { IDbModel, IDbMediaModel } from '../duuzra_types/database';
import { IMediaStorageDetail, IMediaVideoStorageDetail } from '../duuzra_types/media';
import { IKeyValuePair } from '../duuzra_types/common';

export interface IMediaVideoDoc extends IDbModel, IDbMediaModel {
    format: string;
    converted: IKeyValuePair<IMediaVideoStorageDetail>;
    original: IMediaVideoStorageDetail;
    mimeType: string;
    description: string;
    name: string;
    dateCreated: string;
    dateDeleted: string;
    isAdHoc: boolean
}

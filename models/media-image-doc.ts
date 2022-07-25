import { IDbModel, IDbMediaModel } from '../duuzra_types/database';
import { IMediaStorageDetail } from '../duuzra_types/media';
import { IKeyValuePair } from '../duuzra_types/common';

export interface IMediaImageDoc extends IDbModel, IDbMediaModel {
    format: string;
    converted: IKeyValuePair<IMediaStorageDetail>;
    original: IMediaStorageDetail;
    mimeType: string;
    description: string;
    name: string;
    dateCreated: string;
    dateDeleted: string;
    isAdHoc: boolean
}

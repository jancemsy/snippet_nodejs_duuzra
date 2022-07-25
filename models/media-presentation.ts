import { IDbModel, IDbMediaModel } from '../duuzra_types/database';
import { IConvertedMedia } from '../duuzra_types/media';

export interface IMediaPresentationDoc extends IDbModel, IDbMediaModel {
    media: IConvertedMedia;
    description: string;
    name: string;
    dateCreated: string;
    dateDeleted: string;
    width: number;
    height: number;
    isAdHoc: boolean
}

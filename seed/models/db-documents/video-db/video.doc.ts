import { IDbModel } from '../../database/index';
import { IKeyValuePair } from '../../database/index';

export interface IVideoDoc extends IDbModel {
    format: string;
    converted: IKeyValuePair<any>;
    original: any;
    mimeType: string;
}

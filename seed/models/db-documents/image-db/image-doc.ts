import { IDbModel } from '../../database/index';
import { IKeyValuePair } from '../../database/index';

export interface IImageDoc extends IDbModel {
    format: string;
    converted: IKeyValuePair<any>;
    original: any;
    mimeType: string;
}

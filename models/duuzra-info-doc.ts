import { IDbModel } from '../duuzra_types/database';
import { IDuuzraMediaDto, IDuuzraThemeDto } from '../duuzra_types/duuzras';
import { IDuuzraMediaDoc } from './duuzra-media-doc';

export interface IDuuzraInfoDoc {
    accountUuid: string;
    eTag?: string;
    name: string;
    thumbnailImage: IDuuzraMediaDto;
    thumbnailUuid: string;
    thumbnail: string;
    size?: string;
    isTemplate?: boolean;
    childDuuzras?: string[];
    createdBy?: string;
    dateCreated?: string; // should be serializable datetime
    dateModified?: string; // should be serializable datetime
    dateDeleted?: string; // should be serializable datetime
    tags?: string[];
    theme: IDuuzraThemeDto; // Should be seperated ref
    homepageUuid: string;
    liveCount: number;
    isPin: boolean;
    password: string;
    expiryDate: string;
    isCanvas: boolean; 
    nameofUploadedImage: string;
    creator: string;
    address: string;
}

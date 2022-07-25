import { IDuuzraContentChildDoc } from './duuzra-contentchild-doc';
import { IDuuzraThemeDto } from '../duuzra_types/duuzras';
import { IDuuzraIconCms } from './IDuuzraIconCms';

export interface IDuuzraContentDoc {
    uuid: string;
    contentType: string;
    title: string;
    tags: string[];
    sortOrder: number;
    contentUuids: IDuuzraContentChildDoc[];
    backgroundUuid?: string;
    allowDownload: boolean;
    isFirstPageSet?: boolean;
    isTrackingSwitch?: boolean;
    theme: IDuuzraThemeDto;
    backgroundColour: string;
    textColour: string;
    views?: number;
    notesCount?: number;
    path?: string;
    questionCount?: number;
    uniqueCount?: number;
    icon?: IDuuzraIconCms;
    address: string;
    locked?: boolean; 
    isVisibleToAttendees?: boolean;
}

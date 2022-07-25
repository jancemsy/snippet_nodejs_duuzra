import { IDbModel } from '../duuzra_types/database';
import { IDuuzraAttendeeDoc } from './duuzra-attendee-doc';
import { IDuuzraContentDoc } from './duuzra-content-doc';
import { IDuuzraGroupDoc } from './duuzra-group-doc';
import { IDuuzraInfoDoc } from './duuzra-info-doc';

export interface IDuuzraDoc extends IDbModel {
    clientUuid: string,
    info: IDuuzraInfoDoc,
    contents: IDuuzraContentDoc[],
    media: [{
        uuid: string
    }],
    administrators: string[],
    users: string[],
    groups: IDuuzraGroupDoc[],
    attendees: IDuuzraAttendeeDoc[],
    isPin: boolean
}

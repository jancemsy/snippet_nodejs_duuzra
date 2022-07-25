import { IDbModel } from '../duuzra_types/database';
import { IDuuzraAttendeePermissionsDoc } from './duuzra-attendee-permissions-doc'

export interface IDuuzraGroupDoc {
    uuid: string;
    groupName: string;
    groupAttendeeUuids: string[];
    groupPermissions: IDuuzraAttendeePermissionsDoc; /* All group members get these and then are overridden on the attendee */
    dateCreated: string;
    createdBy: string;
    isDefault: boolean;
}

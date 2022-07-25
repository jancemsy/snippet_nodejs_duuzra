import { IDuuzraAttendeePermissionsDoc } from './duuzra-attendee-permissions-doc';

export interface IDuuzraAttendeeDoc {
    uuid: string,
    authUuid: string,
    permissions: IDuuzraAttendeePermissionsDoc,
    duuzraUuid?: string,
    firstname?: string,
    lastname?: string,
    email?: string,
    hasRegistered?: boolean,
    isEmailValidated?: boolean,
    isAnnonymous?: boolean,
    isAttendee?: boolean,
    datecreated?: string,
    createdby?: string
}

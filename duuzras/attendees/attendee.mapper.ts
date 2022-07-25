import { IAuthUserDto } from '../../duuzra_types/auth';
import { IAttendeeDto, IAttendeePermissionsDto } from '../../duuzra_types/duuzras';
import { IDuuzraAttendeeDoc } from '../../models/duuzra-attendee-doc';
import { IDuuzraAttendeePermissionsDoc } from '../../models/duuzra-attendee-permissions-doc';

const uuidgen = require('uuid/v1');

export class AttendeeMapper {

    /**
     * Used to get a new uuid for the correlation id for the calls to the auth service.
     * - this should not be required however the real correlation id is not yet available in the repositories.
     */
    public static getNewUuid() { return uuidgen(); }

    public static getViewType() { return 'duuzraAttendee'; }

    public static mapToObj(attendeeDoc: IDuuzraAttendeeDoc, authServiceData: IAuthUserDto, duuzraUuid: string): IAttendeeDto {

        try {
            const attendeeDto: IAttendeeDto = {
                uuid: attendeeDoc.uuid,
                authUuid: attendeeDoc.authUuid,
                duuzraUuid: duuzraUuid,
                firstname: authServiceData ? authServiceData.firstname : null,
                lastname: authServiceData ? authServiceData.lastname : null,
                email: authServiceData ? authServiceData.email : null,
                permissions: AttendeeMapper.mapPermissionsToObj(attendeeDoc.permissions),
                hasRegistered: authServiceData ? authServiceData.hasRegistered : null,
                isEmailValidated: authServiceData ? authServiceData.isEmailValidated : null,
                isAnnonymous: authServiceData ? authServiceData.isAnnonymous : null,
                isAttendee: authServiceData ? authServiceData.isAttendee : null,
                datecreated: authServiceData ? authServiceData.dateCreated : null,
                createdby: authServiceData ? authServiceData.createdBy : null
            };

            return attendeeDto;
        } catch (e) {
            console.error('AttendeeMapper - mapToObj failed' + e); 
            return null; 
        }
    }

    public static mapToDoc(attendeeDto: IAttendeeDto): IDuuzraAttendeeDoc {

        // Auto id
        if (!attendeeDto.uuid) {
            attendeeDto.uuid = uuidgen();
        }

        return {
            uuid: attendeeDto.uuid,
            authUuid: attendeeDto.authUuid,
            permissions: AttendeeMapper.mapPermissionsToDoc(attendeeDto.permissions)
        }
    }

    public static mapPermissionsToObj(attendeePermissionsDoc: IDuuzraAttendeePermissionsDoc): IAttendeePermissionsDto {

        // todo - this shoul not return null as should be comprehensive and have constructed the permissions.
        //      - this check has been added while developing so that this map will succedd even without the permissions
        if (attendeePermissionsDoc) {
            // const attendeePermissionsDto = attendeePermissionsDoc as IAttendeePermissionsDto; // Object has the same shape
            const attendeePermissionsDto: IDuuzraAttendeePermissionsDoc = {
                appMessagingEnabled: attendeePermissionsDoc.appMasterEnabled,
                appQuestionsEnabled: attendeePermissionsDoc.appQuestionsEnabled,
                appNotesEnabled: attendeePermissionsDoc.appNotesEnabled,
                appMasterEnabled: attendeePermissionsDoc.appMasterEnabled,
                cmsEditEnabled: attendeePermissionsDoc.cmsEditEnabled,
                cmsAnalyticsEnabled: attendeePermissionsDoc.cmsAnalyticsEnabled,
                cmsSharingEnabled: attendeePermissionsDoc.cmsSharingEnabled,
                canSubmitQuestionAsAnnonymous: attendeePermissionsDoc.canSubmitQuestionAsAnnonymous,
                canReceiveNotificationDuuzraLive: attendeePermissionsDoc.canReceiveNotificationDuuzraLive,
                canReceiveNotificationContentAddRemove: attendeePermissionsDoc.canReceiveNotificationContentAddRemove
            }
            return attendeePermissionsDto
        } else {
            return null;
        }
    }

    public static mapPermissionsToDoc(attendeePermissionsDto: IAttendeePermissionsDto): IDuuzraAttendeePermissionsDoc {

        // todo - this shoul not return null as should be comprehensive and have constructed the permissions.
        //      - this check has been added while developing so that this map will succedd even without the permissions
        if (attendeePermissionsDto) {
            // const attendeePermissionsDoc = attendeePermissionsDto as IAttendeePermissionsDto; // Object has the same shape
            const attendeePermissionsDoc: IDuuzraAttendeePermissionsDoc = {
                appMessagingEnabled: attendeePermissionsDto.appMasterEnabled,
                appQuestionsEnabled: attendeePermissionsDto.appQuestionsEnabled,
                appNotesEnabled: attendeePermissionsDto.appNotesEnabled,
                appMasterEnabled: attendeePermissionsDto.appMasterEnabled,
                cmsEditEnabled: attendeePermissionsDto.cmsEditEnabled,
                cmsAnalyticsEnabled: attendeePermissionsDto.cmsAnalyticsEnabled,
                cmsSharingEnabled: attendeePermissionsDto.cmsSharingEnabled,
                canSubmitQuestionAsAnnonymous: attendeePermissionsDto.canSubmitQuestionAsAnnonymous,
                canReceiveNotificationDuuzraLive: attendeePermissionsDto.canReceiveNotificationDuuzraLive,
                canReceiveNotificationContentAddRemove: attendeePermissionsDto.canReceiveNotificationContentAddRemove
            }
            return attendeePermissionsDoc;
        } else {
            return null;
        }
    }
}

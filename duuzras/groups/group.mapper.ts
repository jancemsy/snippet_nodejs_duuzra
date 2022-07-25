import { IGroupDto } from '../../duuzra_types/duuzras';
import { IDuuzraGroupDoc } from '../../models/duuzra-group-doc';
import { AttendeeMapper } from '../attendees/attendee.mapper'

const uuidgen = require('uuid/v1');

export class GroupMapper {

    public static getViewType() { return 'duuzraGroup'; }

    public static mapToObj(groupDoc: IDuuzraGroupDoc, duuzraUuid: string): IGroupDto {
        try {
            let groupDto: IGroupDto = {
                uuid: groupDoc.uuid,
                duuzraUuid: duuzraUuid,
                groupName: groupDoc.groupName,
                groupAttendeeUuids: groupDoc.groupAttendeeUuids,
                groupPermissions: AttendeeMapper.mapPermissionsToObj(groupDoc.groupPermissions),
                dateCreated: groupDoc.dateCreated,
                createdBy: groupDoc.createdBy,
                isDefault: groupDoc.isDefault
            }

            return groupDto;

        } catch (e) {
            console.error("GroupMapper - mapToObj failure" + e);
            return null;
        }

    }

    public static mapToDoc(groupDto: IGroupDto): IDuuzraGroupDoc {

        try {

            // Auto id
            if (!groupDto.uuid) {
                groupDto.uuid = uuidgen();
            }

            let groupDoc: IDuuzraGroupDoc = {
                uuid: groupDto.uuid,
                groupName: groupDto.groupName,
                groupAttendeeUuids: groupDto.groupAttendeeUuids,
                groupPermissions: AttendeeMapper.mapPermissionsToDoc(groupDto.groupPermissions),
                dateCreated: groupDto.dateCreated,
                createdBy: groupDto.createdBy,
                isDefault: groupDto.isDefault
            }

            return groupDoc;

        } catch (e) {
            console.error("GroupMapper - mapToDoc failure" + e)
            return null;
        }
    }
}

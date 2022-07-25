import { IDuuzraFolderDto } from '../../duuzra_types/duuzras';
import { IDuuzraFolderDoc } from '../../models/duuzra-folder-doc';
import { DateFormatter } from '../../duuzra_types/common';

const uuidgen = require('uuid/v1');
export class DuuzraFolderMapper {

    public static getViewType() { return 'duuzraFolder'; }

    public static mapToObj(folderDoc: IDuuzraFolderDoc): IDuuzraFolderDto {
        return {
            uuid: folderDoc.uuid,
            parentUuid: folderDoc.parentUuid || '',
            accountUuid: folderDoc.accountUuid,
            title: folderDoc.title,
            thumbnail: folderDoc.thumbnail,
            duuzraUuids: folderDoc.duuzraUuids || [],
            dateCreated: new DateFormatter(folderDoc.dateCreated).toString(),
            dateDeleted: folderDoc.deletedDate,
            isPin: folderDoc.isPin
        };
    }

    public static mapToDoc(folderDto: IDuuzraFolderDto): IDuuzraFolderDoc {
        // Auto id
        if (!folderDto.uuid) {
            folderDto.uuid = uuidgen();
        }

        return {
            uuid: folderDto.uuid,
            parentUuid: folderDto.parentUuid || '',
            accountUuid: folderDto.accountUuid,
            title: folderDto.title,
            thumbnail: folderDto.thumbnail,
            duuzraUuids: folderDto.duuzraUuids || [],
            dateCreated: new DateFormatter(folderDto.dateCreated).toString() ,
            deletedDate: folderDto.dateDeleted,
            isPin: folderDto.isPin
        }
    }
}

import { DateFormatter } from '../../duuzra_types/common';
import { IDuuzraMediaDto } from '../../duuzra_types/duuzras';
import { IDuuzraMediaDoc } from '../../models/duuzra-media-doc';

const uuidgen = require('uuid/v1'); 
export class DuuzraHiddenMediaMapper {

    public static getViewType() { return 'duuzraMedia'; } 
    public static mapToObj(mediaDoc: IDuuzraMediaDoc): IDuuzraMediaDto {

        let mediaDto: IDuuzraMediaDto = {
            uuid: mediaDoc.uuid,
            mediaUuid: mediaDoc.mediaUuid,
            mediaType: mediaDoc.mediaType,
            dateDeleted: mediaDoc.dateDeleted ? new DateFormatter(mediaDoc.dateDeleted).toString() : null,
            duuzraUuid: mediaDoc.duuzraUuid,
            isAdHoc: mediaDoc.isAdHoc
        };

        return mediaDto;
    }

    public static mapToDoc(mediaDto: IDuuzraMediaDto): IDuuzraMediaDoc { 
        if (!mediaDto.uuid) {
            mediaDto.uuid = uuidgen();
        }

        let mediaDoc: IDuuzraMediaDoc = {
            uuid: mediaDto.uuid,
            mediaUuid: mediaDto.mediaUuid,
            mediaType: mediaDto.mediaType,
            dateDeleted: mediaDto.dateDeleted ? new DateFormatter(mediaDto.dateDeleted).toString() : null,
            duuzraUuid: mediaDto.duuzraUuid,
            isAdHoc: mediaDto.isAdHoc
        };

        return mediaDoc;
    }
}

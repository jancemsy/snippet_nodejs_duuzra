import {
    IDuuzraDto,
} from '../../duuzra_types/duuzras';

import { IDuuzraDoc } from '../../models/duuzra-duuzra-doc';

import { DateFormatter } from '../../duuzra_types/common';

const uuidgen = require('uuid/v1');

export class DuuzraDuuzraMapper {
    public static getViewType() { return 'duuzraDuuzra'; }
    public static getDocType() { return 'duuzra-duuzra'; }
    public static getDocId(uuid: string) { return 'duuzra-duuzra_' + uuid; }
    public static revertDocId(docId: string) { return docId.replace('duuzra-duuzra_', ''); }

    public static mapToObj(docId: string, duuzraDoc: IDuuzraDoc): IDuuzraDto {
        const duuzraDto: IDuuzraDto = {
            uuid: this.revertDocId(docId),
            clientUuid: duuzraDoc.clientUuid,
            password: null,
            expiryDate: null,
            isCanvas: false,
            nameofUploadedImage: null,
            info: duuzraDoc.info,
            contents: duuzraDoc.contents,
            media: null,
            administrator: duuzraDoc.administrators,
            users: duuzraDoc.users,
            groups: duuzraDoc.groups,
            attendees: duuzraDoc.attendees,
            isPin: duuzraDoc.isPin,
            adHocs: null
        }

        return duuzraDto;
    }

    public static mapToDoc() { }
}

import { IDuuzraInfoDto, IDuuzraThemeDto } from '../../duuzra_types/duuzras';
import { IDuuzraMediaDto } from '../../duuzra_types/duuzras';

import { IDuuzraInfoDoc } from '../../models/duuzra-info-doc';

import { DateFormatter } from '../../duuzra_types/common';

const uuidgen = require('uuid/v1');

export class DuuzraInfoMapper {

    public static getViewType() { return 'duuzraInfo'; }
    public static getDocType() { return 'duuzra-info'; }
    public static getDocId(uuid: string) { return 'duuzra-info_' + uuid; }
    public static revertDocId(docId: string) { return docId.replace('duuzra-duuzra_', ''); }

    public static mapToObj(docId: string, infoDoc: IDuuzraInfoDoc, thumbnailImg: IDuuzraMediaDto): IDuuzraInfoDto {

        // Parse object dates
        const dateCreated = new DateFormatter(infoDoc.dateCreated); // now or original (will always be original)
        const dateModified = new DateFormatter(infoDoc.dateModified); // now or original (will always be original)
        const dateDeleted = infoDoc.dateDeleted ? new DateFormatter(infoDoc.dateDeleted) : null;

        const duuzraInfoDto: IDuuzraInfoDto = {
            uuid: this.revertDocId(docId),
            accountUuid: infoDoc.accountUuid || null,
            eTag: infoDoc.eTag,
            name: infoDoc.name,
            liveCount : infoDoc.liveCount,
            thumbnailImage: thumbnailImg,
            thumbnail: infoDoc.thumbnail,
            size: infoDoc.size,
            isTemplate: infoDoc.isTemplate,
            childDuuzras: infoDoc.childDuuzras,
            createdBy: infoDoc.createdBy,
            dateCreated: dateCreated.toString(),
            dateModified: dateModified.toString(),
            dateDeleted: dateDeleted ? dateDeleted.toString() : null,
            tags: infoDoc.tags,
            theme: infoDoc.theme,
            homepageUuid: infoDoc.homepageUuid,
            isPin: infoDoc.isPin,
            password: infoDoc.password,
            expiryDate: infoDoc.expiryDate,
            isCanvas: infoDoc.isCanvas,
            nameofUploadedImage: infoDoc.nameofUploadedImage,
            creator: infoDoc.creator,
            address: infoDoc.address
        };

        return duuzraInfoDto;
    }

    public static mapToDoc(duuzraInfoDto: IDuuzraInfoDto/*, thumbnailImageMediaRef: ICouchRef*/): IDuuzraInfoDoc {

        // Parse object dates
        const dateCreated = new DateFormatter(duuzraInfoDto.dateCreated); // now or original
        const dateModified = new DateFormatter(null); // now
        let dateDeleted = null;

        if (duuzraInfoDto.dateDeleted) {
            dateDeleted = new DateFormatter(duuzraInfoDto.dateDeleted);
        }

        // Auto id
        // if(!duuzraInfoDto.uuid) {
        //   duuzraInfoDto.uuid = uuidgen();
        // }

        const duuzraInfo: IDuuzraInfoDoc = {
            accountUuid: duuzraInfoDto.accountUuid || null,
            eTag: duuzraInfoDto.eTag,
            name: duuzraInfoDto.name,
            liveCount : duuzraInfoDto.liveCount,
            thumbnailImage: null,
            thumbnailUuid: duuzraInfoDto.thumbnailImage ? duuzraInfoDto.thumbnailImage.uuid : null,
            thumbnail: duuzraInfoDto.thumbnail,
            size: duuzraInfoDto.size,
            isTemplate: duuzraInfoDto.isTemplate,
            childDuuzras: duuzraInfoDto.childDuuzras,
            createdBy: duuzraInfoDto.createdBy,
            dateCreated: dateCreated ? dateCreated.toJSON() : null,
            dateModified: dateModified ? dateModified.toJSON() : null,
            dateDeleted: dateDeleted ? dateDeleted.toJSON() : null,
            tags: duuzraInfoDto.tags,
            theme: duuzraInfoDto.theme,
            homepageUuid: duuzraInfoDto.homepageUuid,
            isPin: duuzraInfoDto.isPin,
            password: duuzraInfoDto.password,
            expiryDate: duuzraInfoDto.expiryDate,
            isCanvas: duuzraInfoDto.isCanvas,
            nameofUploadedImage: duuzraInfoDto.nameofUploadedImage,
            creator: duuzraInfoDto.creator,
            address: duuzraInfoDto.address
        };

        return duuzraInfo;
    }
}

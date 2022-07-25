import { IMediaStorageDetail, IMediaVideoStorageDetail } from '../../../duuzra_types/media';
import { IKeyValuePair, DateFormatter } from '../../../duuzra_types/common';
import { IMediaVideoDoc } from '../../../models/media-video-doc';
import mimeTypes = require('mime-types');
import uuid = require('uuid/v1');

export class MediaVideoMapper {

    public static getViewType() { return 'mediaVideo'; }

    public static map(convertedImages: IKeyValuePair<IMediaVideoStorageDetail>, original: IMediaVideoStorageDetail, format: string,
        description: string, name: string, originalName: string, dateDeleted: DateFormatter, isAdHoc: boolean): IMediaVideoDoc {

        return {
            _id: uuid(),
            _rev: undefined,
            format: format,
            converted: convertedImages,
            type: 'media-video',
            description: description,
            name: name,
            originalFileName: originalName,
            dateCreated: new DateFormatter().toString(),
            dateDeleted: dateDeleted ? new DateFormatter(dateDeleted).toString() : null,
            original: original,
            mimeType: mimeTypes.lookup(original.path),
            isAdHoc: isAdHoc
        };

    }
}

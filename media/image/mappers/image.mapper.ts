import { IMediaStorageDetail } from '../../../duuzra_types/media';
import { IKeyValuePair, DateFormatter } from '../../../duuzra_types/common';
import { IMediaImageDoc } from '../../../models/media-image-doc';
import mimeTypes = require('mime-types');
import uuid = require('uuid/v1');

export class MediaImageMapper {

    public static getViewType() { return 'mediaImage'; }

    public static map(convertedImages: IKeyValuePair<IMediaStorageDetail>, original: IMediaStorageDetail, format: string,
                      description: string, name: string, originalName: string, dateDeleted: DateFormatter, isAdHoc: boolean): IMediaImageDoc {

        return {
            _id: uuid(),
            _rev: undefined,
            format: format,
            converted: convertedImages,
            type: 'media-image',
            original: original,
            mimeType: mimeTypes.lookup(original.path),
            description: description,
            name: name,
            originalFileName: originalName,
            dateCreated: new DateFormatter().toString(),
            dateDeleted: dateDeleted ? new DateFormatter(dateDeleted).toString() : null,
            isAdHoc: isAdHoc
        };

    }
}

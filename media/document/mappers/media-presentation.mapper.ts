import { IMediaPresentationDoc } from '../../../models/media-presentation';
import { IConvertedMedia, IMediaPresentationResponse } from '../../../duuzra_types/media';
import uuid = require('uuid/v1');
import { DateFormatter } from '../../../duuzra_types/common';

export class MediaPresentationMapper {

    public static getDocType() { return 'media-presentation'; }
    public static getDesignType() { return 'mediaPresentation'; }

    public static mapToDoc(convertedMedia: IConvertedMedia, description: string, name: string, width: number, height: number, originalName: string, dateDeleted: DateFormatter, isAdHoc: boolean): IMediaPresentationDoc {

        return {
            _id: uuid(),
            _rev: undefined,
            type: this.getDocType(),
            media: convertedMedia,
            description: description,
            name: name,
            originalFileName: originalName,
            dateCreated: new DateFormatter().toString(),
            dateDeleted: dateDeleted ? new DateFormatter(dateDeleted).toString() : null,
            height: height,
            width: width,
            isAdHoc: isAdHoc
        };

    }

    public static mapToResponse(mediaPresentationDoc: IMediaPresentationDoc): IMediaPresentationResponse {
        return {
            id: mediaPresentationDoc._id,
            convertedMedia: mediaPresentationDoc.media,
        };
    }
}

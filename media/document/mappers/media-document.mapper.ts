import { IConvertedMedia, IMediaDocumentResponse, IMediaDocumentDto, IMediaPage, MediaDocumentDto } from '../../../duuzra_types/media';
import { IMediaDocumentDoc } from '../../../models/media-document';
import uuid = require('uuid/v1');
import { DateFormatter } from '../../../duuzra_types/common';
import { IMediaPresentationDoc } from "../../../models/media-presentation";
import { IDuuzraMediaDto } from '../../../duuzra_types/duuzras';
import * as path from 'path';
import fs = require('fs');
export class MediaDocumentMapper {

    public static getDocType() { return 'media-document'; }
    public static getDesignType() { return 'mediaDocument'; }

    public static mapToDoc(convertedMedia: IConvertedMedia, description: string, name: string, width: number, height: number, originalName: string, dateDeleted: DateFormatter, isAdHoc: boolean): IMediaDocumentDoc {

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

    public static mapDocumentToDto(documentDoc: IMediaDocumentDoc, mediaDto?: IDuuzraMediaDto): IMediaDocumentDto {
        let rootPath = process.cwd() + '/' + documentDoc.media.originalPath;
        return new MediaDocumentDto(
            mediaDto && mediaDto.duuzraUuid ? mediaDto.duuzraUuid : null,
            documentDoc.description,
            documentDoc.name,
            documentDoc.originalFileName,
            documentDoc.media.originalPath,
            path.basename(rootPath),
            this.convertBytesToString(fs.statSync(rootPath).size),
            documentDoc.dateCreated,
            documentDoc.dateDeleted,
            documentDoc.width,
            documentDoc.height,
            documentDoc.media,
            mediaDto,
            'document',
            documentDoc.isAdHoc,
        );
    }

    private static convertBytesToString(size: any): string {
        let i: any = Math.floor(Math.log(size) / Math.log(1024));
        return (size / Math.pow(1024, i) * 1).toFixed(2) + ' ' + ['b', 'kb', 'mb', 'gb', 'tb'][i];
    };

    public static mapPresentationToDto(documentDoc: IMediaPresentationDoc, mediaDto?: IDuuzraMediaDto): IMediaDocumentDto {

        let rootPath = process.cwd() + '/' + documentDoc.media.originalPath;
        return new MediaDocumentDto(
            mediaDto && mediaDto.duuzraUuid ? mediaDto.duuzraUuid : null,
            documentDoc.description,
            documentDoc.name,
            documentDoc.originalFileName,
            documentDoc.media.originalPath,
            path.basename(rootPath),
            this.convertBytesToString(fs.statSync(rootPath).size),
            documentDoc.dateCreated,
            documentDoc.dateDeleted,
            documentDoc.width,
            documentDoc.height,
            documentDoc.media,
            mediaDto,
            'presentation',
            documentDoc.isAdHoc,
        );
    }

    public static mapToResponse(mediaDocumentDoc: IMediaDocumentDoc): IMediaDocumentResponse {
        return {
            id: mediaDocumentDoc._id,
            convertedMedia: mediaDocumentDoc.media,
        };
    }
}

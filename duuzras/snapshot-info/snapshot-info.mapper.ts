import { DateFormatter } from '../../duuzra_types/common';
import { ISnapshotInfoDto } from '../../duuzra_types/duuzras';
import { IDuuzraInfoDto } from '../../duuzra_types/duuzras';
import { IDuuzraMediaDto } from '../../duuzra_types/duuzras';
import { IDuuzraSnapshotDoc, IDuuzraSnapshotPayloadDoc } from '../../models/duuzra-snapshot-doc';

export class SnapshotInfoMapper {
    public static getViewType() { return 'snapshotInfo'; }
    public static getDocType() { return 'duuzra-info'; }
    public static getDocId(uuid: string) { return 'duuzra-info_' + uuid; }
    public static revertDocId(docId: string) { return docId.replace('duuzra-snapshot_', ''); }

    public static mapToObj(docId: string, snapshotDoc: IDuuzraSnapshotDoc): ISnapshotInfoDto {

        const snapshotInfoDto: ISnapshotInfoDto = {
            duuzraUuid: snapshotDoc.payloads.info.uuid,
            name: snapshotDoc.payloads.info.name,
            snapshotUuid: snapshotDoc.uuid,
            thumbnailImage: snapshotDoc.payloads.info.thumbnailImage,
            dateCreated: snapshotDoc.payloads.info.dateCreated,
            dateModified: snapshotDoc.dateModified,
            title: snapshotDoc.title,
            users: null,
            attendees: snapshotDoc.users,
            isDraft: snapshotDoc.isDraft,
            isActive: snapshotDoc.isActive,
            notesCount: snapshotDoc.notesCount,
            questionCount: snapshotDoc.questionCount,
            features: snapshotDoc.features,
            expiryDate: snapshotDoc.payloads.info.expiryDate,
            isCanvas: snapshotDoc.payloads.info.isCanvas,
            nameofUploadedImage: snapshotDoc.payloads.info.nameofUploadedImage

        };

        return snapshotInfoDto;
    }
}

import { DateFormatter } from '../../duuzra_types/common';
import { DuuzraPollClickLog, IDuuzraPollClickDto } from './model/index';

const uuidgen = require('uuid/v1');

export class DuuzraPollClickMapper {
    public static getViewType() { return 'pollClickLogEntry'; }
    public static getDocType() { return 'poll-click-log-entry'; }

    public static convertPollClickDOc(coordinate: IDuuzraPollClickDto): DuuzraPollClickLog {
        const myDate = new DateFormatter(null).toString();
        const id = uuidgen();
        const duuzraDto: DuuzraPollClickLog = {
            _id: 'poll-click-log-entry_' + id,
            _rev: undefined,
            type: this.getDocType(),
            uuid: id,
            duuzraUuid: coordinate.duuzraUuid,
            contentUuid: coordinate.contentUuid,
            slideUuid: coordinate.slideUuid,
            userUuid: coordinate.userUuid,
            x: coordinate.x,
            y: coordinate.y,
            UnitResolution: coordinate.UnitResolution,
            dateCreated: myDate
        }

        return duuzraDto;
    }

    public static convertPollClickDto(coordinate: any): IDuuzraPollClickDto {
        return {
            uuid: coordinate.uuid,
            duuzraUuid: coordinate.duuzraUuid,
            contentUuid: coordinate.contentUuid,
            slideUuid: coordinate.slideUuid,
            userUuid: coordinate.userUuid,
            x: coordinate.x,
            y: coordinate.y,
            UnitResolution: coordinate.UnitResolution,
            dateCreated: coordinate.dateCreated
        }
    }
}

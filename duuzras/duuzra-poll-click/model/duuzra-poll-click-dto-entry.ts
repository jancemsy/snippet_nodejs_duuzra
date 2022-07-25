import { IDbModel } from '../../../duuzra_types/database';

export class DuuzraPollClickLog implements IDbModel {

    public static readonly docType = 'pollClickLog';

    public readonly _id: string;
    public readonly _rev: string;
    public readonly type: string = 'poll-click-log-entry';

    constructor(
        public uuid: string,
        public duuzraUuid: string,
        public contentUuid: string,
        public slideUuid: string,
        public userUuid: string,
        public x: string,
        public y: string,
        public UnitResolution: string,
        public dateCreated: string
    ) {
        this._id = uuid;
    }
}

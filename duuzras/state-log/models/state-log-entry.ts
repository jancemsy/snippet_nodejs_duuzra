import { IDbModel } from '../../../duuzra_types/database';
import { IDuuzraNavigationPushLayer } from '../../../duuzra_types/duuzras';

export type StateLogEntryType = 'content-lock' | 'navigation';
export type StateLogData = IDuuzraNavigationPushLayer[] | boolean;

export class StateLogEntry implements IDbModel {
    public readonly _id: string;
    public readonly _rev: string;
    public readonly type: string = 'duuzra-state-entry';

    public static docType = 'duuzraStateEntry';

    constructor(
        id: string,
        public entryType: StateLogEntryType,
        public duuzraUuid: string,
        public contentUuid: string = null,
        public data: StateLogData = null,
        public slideUuid: string = null,
        public timeStamp: number = Date.now(),

    ) {
        this._id = id;
    }
}

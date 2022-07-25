import { IDbModel } from '../../../duuzra_types/database';

export class AnalyticContentResultEntry implements IDbModel {
    public readonly _id: string;
    public readonly _rev: string;
    public readonly type: string = 'analytic-content-result';

    public static readonly docType = 'AnalyticContentResultEntry';

    constructor(
        public duuzraUuid: string,
        public contentUuid: string,
        public contentName: string,
        public userUuid: string,
        public email: string,
        public name: string,
        public SecondsSincePreviousView: string,
        public dateCreated: string,
        public ENV?: string
    ) {
        this._id = userUuid;
    }
}

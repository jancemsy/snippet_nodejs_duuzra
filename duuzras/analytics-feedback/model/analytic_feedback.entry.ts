import { IDbModel } from '../../../duuzra_types/database';

export class analyticFeedbackEntry implements IDbModel {
    public readonly _id: string;
    public readonly _rev: string;
    public readonly type: string = 'analytic-feedback';

    public static readonly docType = 'analyticFeedbackEntry';

    constructor(
        public duuzraUuid: string,
        public contentUuid: string,
        public contentName: string,
        public userUuid: string,
        public email: string,
        public name: string,
        public SecondsSincePreviousView: string,
        public dateCreated: string
    ) {
        this._id = userUuid;
    }
}

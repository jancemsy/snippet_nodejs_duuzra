import {IDbModel} from '../duuzra_types/database';
export interface IPollDoc extends IDbModel  {
    uuid?: string,
    duuzraUuid: string,
    contentUuid: string,
    identifier: string,
    attendee: string,
    datetime: string,
    answerNumber: string,
    answerText: string,
    attendeeName: string
}

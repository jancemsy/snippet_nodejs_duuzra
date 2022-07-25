import { IPollDoc } from '../../models/duuzra-poll-doc';
import { IAppPollAnalyticsDto } from '../../duuzra_types/src/duuzras/app-analytics-poll-dto';
const uuidgen = require('uuid/v1');

export class AnalyticsPollResultMapper {
    public static getNewUuid() { return uuidgen(); }
    public static getViewType() { return 'duuzraPollResult'; }

    public static mapToAnalyticPollResultEntry(analyticsPollDto: IAppPollAnalyticsDto): IPollDoc{
        const newId = this.getNewUuid()
        return {
            _id: "analytic-poll-result_" + newId,
            _rev: undefined,
            type: 'analytic-poll-result',
            uuid: newId,
            duuzraUuid: analyticsPollDto.duuzraUuid,
            contentUuid: analyticsPollDto.contentUuid,
            identifier: analyticsPollDto.identifier,
            attendee: analyticsPollDto.attendee,
            datetime: analyticsPollDto.datetime,
            answerNumber: analyticsPollDto.answerNumber,
            answerText: analyticsPollDto.answerText,
            attendeeName: analyticsPollDto.attendeeName
        }
    }

    public static mapToAnalyticPollResultDto(analytic: IPollDoc): IAppPollAnalyticsDto{
        let analyticUuid = analytic._id.split('analytic-poll-result_');
        if (analytic.uuid === undefined){
            let idarr = analytic._id.split('_');
            analytic.uuid = idarr[1];
        }
        return {
            uuid: analytic.uuid,
            duuzraUuid: analytic.duuzraUuid,
            contentUuid: analytic.contentUuid,
            identifier: analytic.identifier,
            attendee: analytic.attendee,
            datetime: analytic.datetime,
            answerNumber: analytic.answerNumber,
            answerText: analytic.answerText,
            attendeeName: analytic.attendeeName
        }
    }
}

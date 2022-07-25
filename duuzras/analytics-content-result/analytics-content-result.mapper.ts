import { IAnalyticsSubmission } from '../../duuzra_types/analytics';
import { IAppAnalyticsDto } from '../../duuzra_types/duuzras';
import { AnalyticContentResultEntry, AnalyticContentResultDto } from './index';

const uuidgen = require('uuid/v1');

export class AnalyticsContentResultMapper {

    public static mapToAnalyticContentResultEntry(duuzraUuid: string, content: string, contentname: string, uuid: string, email: string, date: string, name: string, seconds: string): AnalyticContentResultEntry{
        let id = uuidgen();
        return {
            _id: "analytic-content-result_" + id,
            _rev: undefined,
            type: 'analytic-content-result',
            duuzraUuid: duuzraUuid,
            contentUuid: content,
            contentName: contentname,
            userUuid: uuid,
            email: email,
            name: name,
            SecondsSincePreviousView: seconds,
            dateCreated: date
        }
    }

    public static mapToAnalyticContentResultDto(analytic: AnalyticContentResultEntry): AnalyticContentResultDto{
        let analyticUuid = analytic._id.split('analytic-content-result_');
        return {
            uuid: analyticUuid[1],
            duuzraUuid: analytic.duuzraUuid,
            contentUuid: analytic.contentUuid,
            contentName: analytic.contentName,
            userUuid: analytic.userUuid,
            email: analytic.email,
            name: analytic.name,
            SecondsSincePreviousView: analytic.SecondsSincePreviousView,
            dateCreated: analytic.dateCreated
        }
    }
}

import { IAnalyticsSubmission } from '../../duuzra_types/analytics';
import { IAppAnalyticsDto } from '../../duuzra_types/duuzras';
import { analyticFeedbackEntry, AnalyticFeedbackDto } from './index';

const uuidgen = require('uuid/v1');

export class AnalyticsFeedbackMapper {

    public static mapToAnalyticFeedbackEntry(duuzraUuid: string, content: string, contentname: string, uuid: string, email: string, date: string, name: string, seconds: string): analyticFeedbackEntry{
        let id = uuidgen();
        return {
            _id: "analytic-feedback_" + id,
            _rev: undefined,
            type: 'analytic-feedback',
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

    public static mapToAnalyticFeedbackDto(analytic: analyticFeedbackEntry): AnalyticFeedbackDto{
        let analyticUuid = analytic._id.split('analytic-feedback_');
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

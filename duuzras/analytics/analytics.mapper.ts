import { IAnalyticsSubmission } from '../../duuzra_types/analytics';
import { IAppAnalyticsDto } from '../../duuzra_types/duuzras';
const uuidgen = require('uuid/v1');

export class AnalyticsMapper {

    /**
     * Maps a analytics submission the app to a format appropriate for the analytics service.
     * This intermission for the content api allows the app data to be aumented with other data and
     * supports greater flexability of the analytics api as there is a single consumer.
     * (Opposed to however many app instances at various versions there are.)
     * @param appAnalyics
     * @param userUuid
     * @param duuzraUuid
     */
    public static mapAppSubmissionToAnalyticsSubmission(
        appAnalyics: IAppAnalyticsDto,
        userUuid: string,
        duuzraUuid: string): IAnalyticsSubmission {
        let analyticsSubmission: IAnalyticsSubmission = {
            userUuid: userUuid,
            duuzraUuid: duuzraUuid,
            contentTags: appAnalyics.contentTags,
            dateCreated: appAnalyics.dateCreated,
            data: appAnalyics.data,
            fromContentUuid: appAnalyics.fromContentUuid,
            fromContentTitle: null,
            toContentUuid: appAnalyics.toContentUuid,
            toContentTitle: null,
            timeElapsed: appAnalyics.timeElapsed ? appAnalyics.timeElapsed : null,
            duuzraName: null,
            gps: {
                lat: appAnalyics && appAnalyics.gps && appAnalyics.gps.lat ? appAnalyics.gps.lat : 0,
                long: appAnalyics && appAnalyics.gps && appAnalyics.gps.long ? appAnalyics.gps.long : 0,
            },
            isPush: appAnalyics.isPush,
        };

        return analyticsSubmission;
    }
}

import { IDuuzraInfo } from '../../duuzra_types/duuzras';
import { CacheService } from '../../shared/cache/cache.service';
import { IAppAnalyticsDto } from '../../duuzra_types/duuzras';
import { AnalyticsMapper } from './analytics.mapper';
import { IAuthUserDto } from '../../duuzra_types/auth';
import { IDuuzraContentDto, IDuuzraInfoDto } from '../../duuzra_types/duuzras';

import { System } from '../../shared';

export abstract class IAnalyticsRepository {
    public abstract async identifyDuuzra(attendeeUuid: string): Promise<string>;
}

/**
 * This class has been added to indicate that content data can be used to enhance the data set to the analytics service.
 */
export class AnalyticsRepository implements IAnalyticsRepository {

    constructor() { }

    /**
     * This method should take the attendeeUuid provided by the app and then identify what userId and duuzra the user is in.
     * This will reduce the load on the data transfer of analytics and can be handled by the server.
     * This is one example of augmeting the data send for analytics to enhance the reporting capability of the analytics service
     * @param attendeeUuid
     */
    public async identifyDuuzra(attendeeUuid: string): Promise<string> {
        console.log("analytics.repository.ts identifyDuuzra()");

        /*
            At this time this method cannot be created as the concept of n attendee with an Id does not yet exisit in the data.
            Once added this method could use the attendee uuid to identify the duuzra and user.
         */
        return Promise.reject<string>(new Error('action not implemented.'));
    }
}

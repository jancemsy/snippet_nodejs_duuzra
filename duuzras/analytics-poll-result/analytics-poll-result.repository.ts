import { IAppAnalyticsDto, IAppPollAnalyticsDto } from '../../duuzra_types/duuzras';
import { AnalyticsPollResultMapper } from './analytics-poll-result.mapper';
import { System } from '../../shared';
export abstract class IAnalyticsPollResultRepository {
    public abstract async savePollData(authToken: string, correlationId: string, client: IAppPollAnalyticsDto): Promise<IAppPollAnalyticsDto>;
    public abstract async getPollResultByUuid(authToken: string, correlationId: string, filters: any): Promise<IAppPollAnalyticsDto[]>;
}

/**
 * This class has been added to indicate that content data can be used to enhance the data set to the analytics service.
 */
export class AnalyticsPollResultRepository implements IAnalyticsPollResultRepository {
    private readonly objectName = AnalyticsPollResultMapper.getViewType();

    constructor() { }

    public async savePollData(authToken: string, correlationId: string, client: IAppPollAnalyticsDto): Promise<IAppPollAnalyticsDto> {
        console.log("analytics-poll-result.ts savePollData()");
        try {
            const clientDoc = AnalyticsPollResultMapper.mapToAnalyticPollResultEntry(client);
            const couchResponse = await System.DB.save(clientDoc);
            return Promise.resolve(AnalyticsPollResultMapper.mapToAnalyticPollResultDto(clientDoc));
        } catch (err) { 
            return Promise.reject<IAppPollAnalyticsDto>(err);
        }
    }
    public async getPollResultByUuid(authToken: string, correlationId: string, filters: any): Promise<IAppPollAnalyticsDto[]> {
        console.log("analytics-poll-result.ts getPollResultByUuid()");
        try {
            const rawPollResult = await System.DB.get(this.objectName, 'duuzraUuid', filters.duuzraUuid) as any;
            if (rawPollResult && rawPollResult.docs.length >= 1) {
                const infoDtosPromises: Array<Promise<IAppPollAnalyticsDto>> = [];
                rawPollResult.docs.forEach((element) => {
                    infoDtosPromises.push(Promise.resolve(AnalyticsPollResultMapper.mapToAnalyticPollResultDto(element)));
                });
                return Promise.all(infoDtosPromises);

            } else {
                return Promise.resolve(null);
            }
        } catch (err) { 
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
            //return Promise.reject<IAppPollAnalyticsDto[]>(err);
        }
    }

}

import { ServiceBase } from '../../core/services/index';
import { ITokenProvider } from '../../core/token/index';
import { IClientDto } from '../../duuzra_types/duuzras';
import { IAppPollAnalyticsDto } from '../../duuzra_types/duuzras'
import { CommandTypes, CommunicationFactory, CommunicationVerb, ICommunication, ServiceBusQueues, WsChannels } from '../../duuzra_types/network';
import { IDuuzraTokenPayload } from '../../duuzra_types/security';
import { System } from '../../shared';
import { AnalyticsPollResultRepository, IAnalyticsPollResultRepository } from './analytics-poll-result.repository';

export interface IAnalyticsPollResultService {
    create(token: string, correlationId: string, scopeUuid: string, object: IAppPollAnalyticsDto, options?: any): Promise<IAppPollAnalyticsDto>;
    get(token: string, correlationId: string, scopeUuid: string, filter: any, sort: any): Promise<IAppPollAnalyticsDto[]>;
}

export class AnalyticsPollResultService extends ServiceBase<IAppPollAnalyticsDto> implements IAnalyticsPollResultService {
    private analyticsPollRepo: IAnalyticsPollResultRepository;

    // ##########################################################################
    // # LIFECYCLE
    // ##########################################################################
    constructor() {
        super();
        this.analyticsPollRepo = new AnalyticsPollResultRepository();
    }
    public async createAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, object: IAppPollAnalyticsDto): Promise<IAppPollAnalyticsDto>;
    public async createAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, object: IAppPollAnalyticsDto[]): Promise<IAppPollAnalyticsDto[]>;
    public async createAction(
        tokenProvider: ITokenProvider,
        correlationId: string,
        scopeUuid: string,
        object: IAppPollAnalyticsDto | IAppPollAnalyticsDto[]
    ): Promise<IAppPollAnalyticsDto | IAppPollAnalyticsDto[]> { 
        console.log("analytics-poll-result.service.ts CreateAction()");
        return this.implementSingleOnly(CommunicationVerb.POST, object, () => this.analyticsPollRepo.savePollData(tokenProvider.token, correlationId, object as IAppPollAnalyticsDto))
    }

    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuid: string): Promise<IAppPollAnalyticsDto>;
    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, parameters?: any, sort?: any): Promise<IAppPollAnalyticsDto[]>
    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, parameters?: any, sort?: any): Promise<IAppPollAnalyticsDto | IAppPollAnalyticsDto[]> {
        console.log("analytics-poll-result.service.ts getAction()");
        if ((parameters)) { 
            return await this.analyticsPollRepo.getPollResultByUuid(
                tokenProvider.token,
                correlationId,
                parameters as any
            );
        }

    }

    // ####################################
    // # DATA CHANGES
    // ####################################

}

import { IAnalyticsSubmission } from '../../duuzra_types/analytics';
import { CommunicationVerb } from '../../duuzra_types/network';
import { AnalyticsConfig } from '../../analytics.config';
import { ServiceBase } from '../../core/services/index';
import { ITokenProvider } from '../../core/token/index';
import { HttpApi } from '../../shared/http-api.service';
import { AnalyticsFeedbackMapper } from './analytics-feedback.mapper';
import { AnalyticsFeedbackRepository } from './analytics-feedback.repository';

import { IAppAnalyticsDto } from '../../duuzra_types/duuzras';
import { IDuuzraTokenPayload } from '../../duuzra_types/security';
import { ContentService } from '../contents/content.service';
import { DuuzraInfoService } from '../duuzra-info/duuzra-info.service';
import { UserManagementService } from '../user-mgt/index';
import { isArray } from 'util';
import { AnalyticFeedbackDto, analyticFeedbackEntry } from './index';

export interface IAnalyticsFeedbackService {
    create(token: string, correlationId: string, scopeUuid: string, object: AnalyticFeedbackDto): Promise<AnalyticFeedbackDto>;
    get(token: string, correlationId: string, scopeUuid: string, uuid: string): Promise<AnalyticFeedbackDto>;
    get(token: string, correlationId: string, scopeUuid: string, filter?: any, sort?: any): Promise<AnalyticFeedbackDto[]>;
}

export class AnalyticsFeedbackService extends ServiceBase<AnalyticFeedbackDto> implements IAnalyticsFeedbackService {
    private analyticsRepo: AnalyticsFeedbackRepository;
    private contentService: ContentService;
    private duuzraInfoService: DuuzraInfoService;
    private usersMngService: UserManagementService;
    private http: HttpApi;

    constructor() {
        super();
        this.http = new HttpApi();
        this.analyticsRepo = new AnalyticsFeedbackRepository();
        this.contentService = new ContentService();
        this.duuzraInfoService = new DuuzraInfoService();
        this.usersMngService = new UserManagementService();
    }

    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuid: string): Promise<AnalyticFeedbackDto>;
    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, filters?: any, sort?: any): Promise<AnalyticFeedbackDto[]>
    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, filters?: any, sort?: any): Promise<AnalyticFeedbackDto | AnalyticFeedbackDto[]> { 

        let result : any = null; 

        try{
        if (filters){
            if (filters.type){
                if (filters.type === "duuzraUuid"){
                    result =  await this.analyticsRepo.getAnalyticByDuuzraUuid(scopeUuid);
                }else if (filters.type === "contentUuid"){
                    result =  await this.analyticsRepo.getAnalyticByContentUuid(scopeUuid);
                }else if (filters.type === "userUuid"){
                    result = await this.analyticsRepo.getAnalyticByUserUuuid(scopeUuid);
                }
            } else {
                result = await this.analyticsRepo.getAnalyticByDuuzraUuid(scopeUuid);
            }
        } else {
            result = await this.analyticsRepo.getAnalyticByDuuzraUuid(scopeUuid);
        } 
        // return await this.notiRepo.getNotificationLive(tokenProvider.payload.uuid);
        return Promise.resolve(result);
    }catch(e){
        return Promise.resolve(null);
    }
    }

    public async createAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, object: AnalyticFeedbackDto): Promise<AnalyticFeedbackDto>;
    public async createAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, object: AnalyticFeedbackDto[]): Promise<AnalyticFeedbackDto[]>;
    public async createAction(
        tokenProvider: ITokenProvider,
        correlationId: string,
        scopeUuid: string,
        object: AnalyticFeedbackDto | AnalyticFeedbackDto[]
    ): Promise<AnalyticFeedbackDto | AnalyticFeedbackDto[]> {
        console.log("analytics-feedback.service.ts createAction()");
        return Promise.resolve(null);
    }
}

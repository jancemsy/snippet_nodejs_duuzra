import { IAnalyticsSubmission } from '../../duuzra_types/analytics';
import { CommunicationVerb } from '../../duuzra_types/network';
import { AnalyticsConfig } from '../../analytics.config';
import { ServiceBase } from '../../core/services/index';
import { ITokenProvider } from '../../core/token/index';
import { HttpApi } from '../../shared/http-api.service';
import { AnalyticsContentResultMapper } from './analytics-content-result.mapper';
import { AnalyticsContentResultRepository } from './analytics-content-result.repository';

import { IAppAnalyticsDto } from '../../duuzra_types/duuzras';
import { AnalyticContentResultDto } from './model/analytics-content-result.dto';
import { IDuuzraTokenPayload } from '../../duuzra_types/security';
import { ContentService } from '../contents/content.service';
import { DuuzraInfoService } from '../duuzra-info/duuzra-info.service';
import { UserManagementService } from '../user-mgt/index';
import { isArray } from 'util';

export interface IAnalyticsContentResultService {
    create(token: string, correlationId: string, scopeUuid: string, object: AnalyticContentResultDto): Promise<AnalyticContentResultDto>;
    get(token: string, correlationId: string, scopeUuid: string, uuid: string): Promise<AnalyticContentResultDto>;
    get(token: string, correlationId: string, scopeUuid: string, filter?: any, sort?: any): Promise<AnalyticContentResultDto[]>;
}

export class AnalyticsContentResultService extends ServiceBase<AnalyticContentResultDto> implements IAnalyticsContentResultService {
    private analyticsRepo: AnalyticsContentResultRepository;
    private contentService: ContentService;
    private duuzraInfoService: DuuzraInfoService;
    private usersMngService: UserManagementService;
    private http: HttpApi;

    constructor() {
        super();
        this.http = new HttpApi();
        this.analyticsRepo = new AnalyticsContentResultRepository();
        this.contentService = new ContentService();
        this.duuzraInfoService = new DuuzraInfoService();
        this.usersMngService = new UserManagementService();
    }
    // ####################################
    // # DATA READS
    // ####################################

    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuid: string): Promise<AnalyticContentResultDto>;
    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, filters?: any, sort?: any): Promise<AnalyticContentResultDto[]>
    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, filters?: any, sort?: any): Promise<AnalyticContentResultDto | AnalyticContentResultDto[]> { 
 
        let result : any = null;  

        try{ 
            if (filters){
                if (filters.type){
                    if (filters.type === "duuzraUuid"){
                        result =  await this.analyticsRepo.getAnalyticByDuuzraUuid(scopeUuid);
                    } else if (filters.type === "contentUuid"){
                        result =  await this.analyticsRepo.getAnalyticByContentUuid(scopeUuid);
                    } else if (filters.type === "userUuid"){
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

    public async createAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, object: AnalyticContentResultDto): Promise<AnalyticContentResultDto>;
    public async createAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, object: AnalyticContentResultDto[]): Promise<AnalyticContentResultDto[]>;
    public async createAction(
        tokenProvider: ITokenProvider,
        correlationId: string,
        scopeUuid: string,
        object: AnalyticContentResultDto | AnalyticContentResultDto[]
    ): Promise<AnalyticContentResultDto | AnalyticContentResultDto[]> { 
        console.log("analytics-content-result.service.ts createAction()");
        return Promise.resolve(null);
    }
}

import { IAnalyticsSubmission } from '../../duuzra_types/analytics';
import { CommunicationVerb } from '../../duuzra_types/network';
import { AnalyticsConfig } from '../../analytics.config';
import { ServiceBase } from '../../core/services/index';
import { ITokenProvider } from '../../core/token/index';
import { HttpApi } from '../../shared/http-api.service';
import { AnalyticsMapper } from './analytics.mapper';
import { AnalyticsRepository } from './analytics.repository';
import { AnalyticsFeedbackRepository } from '../analytics-feedback/analytics-feedback.repository';
import { AnalyticsContentResultRepository } from '../analytics-content-result/analytics-content-result.repository';

import { IAppAnalyticsDto } from '../../duuzra_types/duuzras';
import { IDuuzraTokenPayload } from '../../duuzra_types/security';
import { ContentService } from '../contents/content.service';
import { DuuzraInfoService } from '../duuzra-info/duuzra-info.service';
import { UserManagementService } from '../user-mgt/index';
import { isArray } from 'util';

export interface IAnalyticsService {
    create(token: string, correlationId: string, scopeUuid: string, object: IAppAnalyticsDto): Promise<IAppAnalyticsDto>;
}

export class AnalyticsService extends ServiceBase<IAppAnalyticsDto> implements IAnalyticsService {
    private analyticsRepo: AnalyticsRepository;
    private analyticsFeedbackRepo: AnalyticsFeedbackRepository;
    private analyticsContentResultRepo: AnalyticsContentResultRepository;
    private contentService: ContentService;
    private duuzraInfoService: DuuzraInfoService;
    private usersMngService: UserManagementService;
    private http: HttpApi;

    constructor() {
        super();
        this.http = new HttpApi();
        this.analyticsRepo = new AnalyticsRepository();
        this.analyticsFeedbackRepo = new AnalyticsFeedbackRepository();
        this.analyticsContentResultRepo = new AnalyticsContentResultRepository();
        this.contentService = new ContentService();
        this.duuzraInfoService = new DuuzraInfoService();
        this.usersMngService = new UserManagementService();
    }

    public async createAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, object: IAppAnalyticsDto): Promise<IAppAnalyticsDto>;
    public async createAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, object: IAppAnalyticsDto[]): Promise<IAppAnalyticsDto[]>;
    public async createAction(
        tokenProvider: ITokenProvider,
        correlationId: string,
        scopeUuid: string,
        object: IAppAnalyticsDto | IAppAnalyticsDto[]
    ): Promise<IAppAnalyticsDto | IAppAnalyticsDto[]> {
        return this.implementSingleOnly(CommunicationVerb.POST, object, () => this.postAnalytics(
            tokenProvider,
            correlationId,
            scopeUuid,
            object as IAppAnalyticsDto
        ));
    }

    public async postAnalytics(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, object: IAppAnalyticsDto): Promise<IAppAnalyticsDto> { 
        console.log("analytics.service.ts postAnalytics()");
        try { 
            const duuzraUuid: string = object.duuzraUuid;  
            const analyticsMessage: IAnalyticsSubmission = AnalyticsMapper.mapAppSubmissionToAnalyticsSubmission(object, tokenProvider.payload.uuid, duuzraUuid);
            const user: any = this.usersMngService.getAction(tokenProvider, correlationId, scopeUuid, analyticsMessage.userUuid); 
            const fromContentPromise = this.contentService.get(tokenProvider.token, correlationId, analyticsMessage.duuzraUuid, analyticsMessage.fromContentUuid, null);
            const toContentPromise = this.contentService.get(tokenProvider.token, correlationId, analyticsMessage.duuzraUuid, analyticsMessage.toContentUuid, null);
            const duuzraInfoPromice = this.duuzraInfoService.get(tokenProvider.token, correlationId, scopeUuid, null);

            const promiseArray: any = [fromContentPromise, toContentPromise, duuzraInfoPromice, user];

            await Promise.all(promiseArray).then(
                ([fromContentItem, toContentItem, duuzraInfo, myuser]: any) => {

                    if (AnalyticsService.isArray(fromContentItem)) {
                        analyticsMessage.fromContentTitle = fromContentItem && fromContentItem[0] && fromContentItem[0].title ? fromContentItem[0].title : '';
                    } else {
                        analyticsMessage.fromContentTitle = fromContentItem && fromContentItem.title ? fromContentItem.title : '';
                    }

                    if (AnalyticsService.isArray(fromContentItem)) {
                        analyticsMessage.toContentTitle = toContentItem && toContentItem[0] && toContentItem[0].title ? toContentItem[0].title : '';
                    } else {
                        analyticsMessage.toContentTitle = toContentItem && toContentItem.title ? toContentItem.title : '';
                    }

                    analyticsMessage.duuzraName = duuzraInfo && duuzraInfo[0] && duuzraInfo[0].name ? duuzraInfo[0].name : ''; 
                    this.postDataToDuuzraAnalyticsEndpoint(analyticsMessage); 
                    if (object.attendeeUuid){ 
                        this.analyticsFeedbackRepo.createAnalytic(fromContentItem, duuzraUuid, object, myuser);
                    } else { 
                        this.analyticsContentResultRepo.createAnalytic(toContentItem, duuzraUuid, object, myuser);
                    }

                }
            );

            return Promise.resolve(object);

        } catch (e) {
            return Promise.resolve(null);
        }
    }
 
    private async postDataToDuuzraAnalyticsEndpoint(analyticsMessage) { 
        try { 
            const analyticsReponse: any = await this.http.post(
                AnalyticsConfig.analyticsEndpoint,
                null, // We could pass the auth token here if we needed the analytics api to be more open.
                JSON.stringify(analyticsMessage)
            ); 

            return Promise.resolve(analyticsReponse);
        } catch (ex) { 
        } 
    }

    private static isArray(a) {

        try {
            return (!!a) && (a.constructor === Array);
        } catch (e) {
            return false;
        }

    };
}

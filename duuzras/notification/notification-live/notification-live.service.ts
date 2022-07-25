import { ServiceBase } from '../../../core/services/index';
import { ITokenProvider } from '../../../core/token/index';
import { NotificationLiveLog, NotificationLiveLogDto } from '../model/index';
import { NotificationLiveRepository, INotificationLiveRepository } from './notification-live.repository';  
import { DuuzraPermissions } from '../../duuzra.permissions';
import { CommunicationVerb } from '../../../duuzra_types/network';
import { IDuuzraTokenPayload } from '../../../duuzra_types/security';
import { ClaimsService } from '../../../shared/claims/claims.service';

export interface INotificationLiveService {
    get(token: string, correlationId: string, scopeUuid: string, uuid: string): Promise<NotificationLiveLogDto>;
    get(token: string, correlationId: string, scopeUuid: string, filter?: any, sort?: any): Promise<NotificationLiveLogDto[]>;
    create(token: string, correlationId: string, scopeUuid: string, object: NotificationLiveLogDto): Promise<NotificationLiveLogDto>;
    update(token: string, correlationId: string, scopeUuid: string, object: NotificationLiveLogDto): Promise<NotificationLiveLogDto>;
    delete(token: string, correlationId: string, scopeUuid: string, uuid: string): Promise<NotificationLiveLogDto>;
}

export class NotificationLiveService extends ServiceBase<NotificationLiveLogDto> implements INotificationLiveService {

    private notiRepo: INotificationLiveRepository; 

    constructor() {
        super();
        this.notiRepo = new NotificationLiveRepository();
    }
 

    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuid: string): Promise<NotificationLiveLogDto>;
    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, filters?: any, sort?: any): Promise<NotificationLiveLogDto[]>
    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, filters?: any, sort?: any): Promise<NotificationLiveLogDto | NotificationLiveLogDto[]> {
        console.log("notification-live.service.ts getAction()");
        try{ 
            return await this.notiRepo.getNotificationLive(tokenProvider.payload.uuid);
        }catch (err){ 
        }
    } 

    public async createAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, object: NotificationLiveLogDto): Promise<NotificationLiveLogDto>;
    public async createAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, object: NotificationLiveLogDto[]): Promise<NotificationLiveLogDto[]>;
    public async createAction(
        tokenProvider: ITokenProvider,
        correlationId: string,
        scopeUuid: string,
        object: NotificationLiveLogDto | NotificationLiveLogDto[]
    ): Promise<NotificationLiveLogDto | NotificationLiveLogDto[]> { 
        console.log("notification-live.service.ts createAction()");
        return null;
    }

    protected async updateAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, object: NotificationLiveLogDto): Promise<NotificationLiveLogDto> { 
        console.log("notification-live.service.ts updateAction()");
        return null;
    }

    protected async deleteAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuid: string, isDeleted?: boolean): Promise<NotificationLiveLogDto>;
    protected async deleteAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuids: string[], isDeleted?: boolean): Promise<NotificationLiveLogDto[]>;
    protected async deleteAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuids: string | string[], isDeleted?: boolean): Promise<NotificationLiveLogDto | NotificationLiveLogDto[]> { 
        console.log("notification-live.service.ts deleteAction()");
        return null;
    }

    
}

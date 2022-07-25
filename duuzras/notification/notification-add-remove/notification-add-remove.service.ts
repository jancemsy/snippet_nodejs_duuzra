import { ServiceBase } from '../../../core/services/index';
import { ITokenProvider } from '../../../core/token/index';
import { CommunicationVerb } from '../../../duuzra_types/network';
import { IDuuzraTokenPayload } from '../../../duuzra_types/security';
import { ClaimsService } from '../../../shared/claims/claims.service';
import { NotificationAddRemoveLogDto } from '../model/index'; 
import { NotificationAddRemoveRepository, INotificationAddRemoveRepository } from './notification-add-remove.repository'; 

import { DuuzraPermissions } from '../../duuzra.permissions';

export interface INotificationAddRemoveService {
    get(token: string, correlationId: string, scopeUuid: string, uuid: string): Promise<NotificationAddRemoveLogDto>;
    get(token: string, correlationId: string, scopeUuid: string, filter?: any, sort?: any): Promise<NotificationAddRemoveLogDto[]>;
    create(token: string, correlationId: string, scopeUuid: string, object: NotificationAddRemoveLogDto): Promise<NotificationAddRemoveLogDto>;
    update(token: string, correlationId: string, scopeUuid: string, object: NotificationAddRemoveLogDto): Promise<NotificationAddRemoveLogDto>;
    delete(token: string, correlationId: string, scopeUuid: string, uuid: string): Promise<NotificationAddRemoveLogDto>;
}

export class NotificationAddRemoveService extends ServiceBase<NotificationAddRemoveLogDto> implements INotificationAddRemoveService {
    private notirepo: INotificationAddRemoveRepository;
 
    constructor() {
        super();
        this.notirepo = new NotificationAddRemoveRepository();
    } 

    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuid: string): Promise<NotificationAddRemoveLogDto>;
    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, filters?: any, sort?: any): Promise<NotificationAddRemoveLogDto[]>
    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, filters?: any, sort?: any): Promise<NotificationAddRemoveLogDto | NotificationAddRemoveLogDto[]> {
        console.log("notification-add-remove.service.ts getAction()");
        try{ 
            return await this.notirepo.getNotifcation(tokenProvider.payload.uuid);
        }catch (err){ 
        }
    } 

    public async createAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, object: NotificationAddRemoveLogDto): Promise<NotificationAddRemoveLogDto>;
    public async createAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, object: NotificationAddRemoveLogDto[]): Promise<NotificationAddRemoveLogDto[]>;
    public async createAction(
        tokenProvider: ITokenProvider,
        correlationId: string,
        scopeUuid: string,
        object: NotificationAddRemoveLogDto | NotificationAddRemoveLogDto[]
    ): Promise<NotificationAddRemoveLogDto | NotificationAddRemoveLogDto[]> { 
        console.log("notification-add-remove.service.ts createAction()");
        return null;
    }

    protected async updateAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, object: NotificationAddRemoveLogDto): Promise<NotificationAddRemoveLogDto> { 
        console.log("notification-add-remove.service.ts updateAction()");
        return null;
    }

    protected async deleteAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuid: string, isDeleted?: boolean): Promise<NotificationAddRemoveLogDto>;
    protected async deleteAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuids: string[], isDeleted?: boolean): Promise<NotificationAddRemoveLogDto[]>;
    protected async deleteAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuids: string | string[], isDeleted?: boolean): Promise<NotificationAddRemoveLogDto | NotificationAddRemoveLogDto[]> { 
        console.log("notification-add-remove.service.ts DeleteAction()");
        return null;
    }
}

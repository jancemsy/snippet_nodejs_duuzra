import { ISnapshotInfoDto } from '../../duuzra_types/duuzras';
import { CommunicationStatuses, CommunicationVerb } from '../../duuzra_types/network';
import { ServiceBase } from '../../core/services/index';
import { ITokenProvider } from '../../core/token/index';
import { ClaimsService } from '../../shared/claims/claims.service';
import { DuuzraPermissions } from '../duuzra.permissions';
import { IDuuzraTokenPayload } from '../../duuzra_types/security';
import { IMediaService, MediaService } from '../media/media.service';
import { ISnapshotInfoRepository, SnapshotInfoRepository } from './snapshot-info.repository'; 

export interface ISnapshotInfoService {
    get(token: string, correlationId: string, scopeUuid: string, filter?: any, sort?: any): Promise<ISnapshotInfoDto[]>;
    delete(token: string, correlationId: string, scopeUuid: string, uuid: string): Promise<ISnapshotInfoDto>;
} 
export class SnapshotInfoService extends ServiceBase<ISnapshotInfoDto> implements ISnapshotInfoService { 
    private mediaService: IMediaService;
    private infoRepo: ISnapshotInfoRepository; 
    constructor() {
        super();
        this.mediaService = new MediaService();
        this.infoRepo = new SnapshotInfoRepository();
    } 

    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuid: string): Promise<ISnapshotInfoDto>;
    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, filters?: any, sort?: any): Promise<ISnapshotInfoDto[]>
    public async getAction(
        tokenProvider: ITokenProvider,
        correlationId: string,
        scopeUuid: string,
        filters?: any,
        sort?: any
    ): Promise<ISnapshotInfoDto | ISnapshotInfoDto[]> {  
        console.log("snapshot-info.service.ts getAction()");
        if (this.isUuidQuery(filters)) {
            this.throwSingleActionTypeNotImplementedException(CommunicationVerb.GET);
        } else {
            const map: Map<boolean, () => Promise<ISnapshotInfoDto[]>> = new Map(); 
            map.set(!!tokenProvider.payload.uuid, () => this.infoRepo.getInfosByAuthUser(tokenProvider.payload.uuid));
            return this.getResultsFromPrioritizedConditions(map, filters, sort);
        }
    }
    protected async deleteAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuid: string, isDeleted?: boolean): Promise<ISnapshotInfoDto>;
    protected async deleteAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuids: string[], isDeleted?: boolean): Promise<ISnapshotInfoDto[]>;
    protected async deleteAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuids: string | string[], isDeleted?: boolean): Promise<ISnapshotInfoDto | ISnapshotInfoDto[]> {  
        console.log("snapshot-info.service.ts deleteAction()"); 
        return this.implementSingleOnly(CommunicationVerb.POST, uuids, async () => {
            const uuidSingle: string = uuids as string;
            return this.infoRepo.deleteInfo(tokenProvider.payload.uuid, uuidSingle, isDeleted);
        });
    }
}

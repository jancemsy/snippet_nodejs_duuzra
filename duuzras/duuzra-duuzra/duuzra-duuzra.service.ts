import { IDuuzraDto } from '../../duuzra_types/duuzras';
import { IDuuzraTokenPayload } from '../../duuzra_types/security';
import { DuuzraDuuzraRepository, IDuuzraDuuzraRepository } from './duuzra-duuzra.repository';

import { ServiceBase } from '../../core/services/index';
import { ITokenProvider } from '../../core/token/index';
import { CommunicationStatuses, CommunicationVerb } from '../../duuzra_types/network';
import { ClaimsService } from '../../shared/claims/claims.service';
import { DuuzraPermissions } from '../duuzra.permissions';

export interface IDuuzraService {
    get(token: string, correlationId: string, scopeUuid: string, uuid: string): Promise<IDuuzraDto>;
    get(token: string, correlationId: string, scopeUuid: string, filter?: any, sort?: any): Promise<IDuuzraDto[]>;
}

export class DuuzraService extends ServiceBase<IDuuzraDto> implements IDuuzraService {
    private duuzraRepo: IDuuzraDuuzraRepository;

    // ##########################################################################
    // # LIFECYCLE
    // ##########################################################################

    constructor() {
        super();
        this.duuzraRepo = new DuuzraDuuzraRepository();
    }

    // ####################################
    // # DATA READS
    // ####################################

    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuid: string): Promise<IDuuzraDto>;
    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, filters?: any, sort?: any): Promise<IDuuzraDto[]>
    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, filters?: any, sort?: any): Promise<IDuuzraDto | IDuuzraDto[]> {
        console.log("duuzra-duuzra.servic.ts getAction()");
        if (this.isUuidQuery(filters)) {
            return await this.duuzraRepo.getDuuzraDuuzraById(filters as string);
        }
        // else {
        //     const map: Map<boolean, () => Promise<IDuuzraDto[]>> = new Map();
        //     map.set(!!tokenProvider.payload.uuid, () => this.duuzraRepo.getDuuzraDuuzraById(tokenProvider.payload.uuid));
        //     return this.getResultsFromPrioritizedConditions(map, filters, sort);
        // }
    }
}

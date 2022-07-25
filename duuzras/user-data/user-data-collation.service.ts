import { IUserDataDto, IUserDataItemDto } from '../../duuzra_types/duuzras';
import { CommunicationVerb } from '../../duuzra_types/network';
import { IDuuzraTokenPayload } from '../../duuzra_types/security';
import { ServiceBase } from '../../core/services/index';
import { ITokenProvider } from '../../core/token/index';
import { UserDataRepository } from './user-data.repository';

export interface IUserDataCollationService {
    get(token: string, correlationId: string, scopeUuid: string, filter?: any, sort?: any): Promise<IUserDataItemDto[]>;
}
export class UserDataCollationService extends ServiceBase<IUserDataItemDto> implements IUserDataCollationService {
    private userDataRepo: UserDataRepository;

    constructor() {
        super();
        this.userDataRepo = new UserDataRepository();
    }

    // ####################################
    // # DATA READS
    // ####################################

    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuid: string): Promise<IUserDataItemDto>;
    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, filters?: any, sort?: any): Promise<IUserDataItemDto[]>
    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, filters?: any, sort?: any): Promise<IUserDataItemDto | IUserDataItemDto[]> {
        console.log("user-data-collation.service.ts getAction()");
        if (this.isUuidQuery(filters)) {

        } else {
            const map: Map<boolean, () => Promise<IUserDataItemDto[]>> = new Map();

            map.set(!!filters.type, () => this.userDataRepo.getUserDataByDuuzraAndType(scopeUuid, filters.type));

            return this.getResultsFromPrioritizedConditions(map, filters, sort);
        }
    }
}

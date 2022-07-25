import { IUserDataDto, IUserDataItemDto } from '../../duuzra_types/duuzras';
import { CommunicationVerb } from '../../duuzra_types/network';
import { IDuuzraTokenPayload } from '../../duuzra_types/security';
import { ServiceBase } from '../../core/services/index';
import { ITokenProvider } from '../../core/token/index';
import { UserDataRepository } from './user-data.repository';

export interface IUserDataService {
    get(token: string, correlationId: string, scopeUuid: string, filter?: any, sort?: any): Promise<IUserDataDto>;
}
export class UserDataService extends ServiceBase<IUserDataDto> implements IUserDataService {
    private userDataRepo: UserDataRepository;

    constructor() {
        super();
        this.userDataRepo = new UserDataRepository();
    }

    // ####################################
    // # DATA READS
    // ####################################

    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuid: string): Promise<IUserDataDto>;
    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, filters?: any, sort?: any): Promise<IUserDataDto[]>
    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, filters?: any, sort?: any): Promise<IUserDataDto | IUserDataDto[]> {
        console.log("user-data.service.ts GetAction()");
        return await this.userDataRepo.getUserDataByAuthUserAndDuuzra(tokenProvider.payload.uuid, scopeUuid);
    }
}

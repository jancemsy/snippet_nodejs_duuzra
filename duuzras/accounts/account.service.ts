import { IDuuzraAccountDto } from '../../duuzra_types/duuzras';
import { CommunicationVerb } from '../../duuzra_types/network';
import { IDuuzraTokenPayload } from '../../duuzra_types/security';
import { IServiceBase, ServiceBase } from '../../core/services/index';
import { ITokenProvider } from '../../core/token/index';
import { AccountRepository } from './account.repository';

export interface IAccountService {
    get(token: string, correlationId: string, scopeUuid: string, filters?: any, sorts?: any): Promise<IDuuzraAccountDto[]>;
    get(token: string, correlationId: string, scopeUuid: string, uuid: string): Promise<IDuuzraAccountDto>;
    create(token: string, correlationId: string, scopeUuid: string, object: IDuuzraAccountDto): Promise<IDuuzraAccountDto>;
    update(token: string, correlationId: string, scopeUuid: string, object: IDuuzraAccountDto): Promise<IDuuzraAccountDto>;
}
export class AccountService extends ServiceBase<IDuuzraAccountDto> implements IAccountService, IServiceBase<IDuuzraAccountDto> {

    // ####################################
    // # PRIVATE FIELDS
    // ####################################
    private accountRepo: AccountRepository;

    // ####################################
    // # CONSTRUCTOR
    // ####################################
    constructor() {
        super();
        this.accountRepo = new AccountRepository();
    }

    // ####################################
    // # BASE IMPLEMENTATION
    // ####################################
    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuid: string): Promise<IDuuzraAccountDto>;
    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, filters?: any, sort?: any): Promise<IDuuzraAccountDto[]>
    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, filters?: any, sort?: any): Promise<IDuuzraAccountDto | IDuuzraAccountDto[] > {
        if (this.isUuidQuery(filters)) {
            return await this.accountRepo.getAccountByUuid(scopeUuid, filters as string);
        } else {
            const result: IDuuzraAccountDto[] = await this.accountRepo.getAccountsByClient(scopeUuid);
            return this.applyFiltersAndSorts(result, filters, sort);
        }
    }

    public async createAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, object: IDuuzraAccountDto): Promise<IDuuzraAccountDto>;
    public async createAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, object: IDuuzraAccountDto[]): Promise<IDuuzraAccountDto[]>;
    public async createAction(
        tokenProvider: ITokenProvider,
        correlationId: string,
        scopeUuid: string,
        object: IDuuzraAccountDto | IDuuzraAccountDto[]
    ): Promise<IDuuzraAccountDto | IDuuzraAccountDto[]> {
        console.log("account.service.ts createAction()"); 
        return this.implementSingleOnly(CommunicationVerb.POST, object, () => this.accountRepo.createAccount(scopeUuid, object as IDuuzraAccountDto))
    }

    public async updateAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, object: IDuuzraAccountDto): Promise<IDuuzraAccountDto> {
        console.log("account.service.ts updateAction()");
        return this.accountRepo.updateAccount(scopeUuid, object);
    }
}

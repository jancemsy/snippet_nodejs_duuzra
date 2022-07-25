import { ServiceBase } from '../../core/services/index';
import { ITokenProvider } from '../../core/token/index';
import { DateFormatter } from '../../duuzra_types/common';
import { IClientDto } from '../../duuzra_types/duuzras';
import { CommandTypes, CommunicationFactory, CommunicationVerb, ICommunication, ServiceBusQueues, WsChannels } from '../../duuzra_types/network';
import { IDuuzraTokenPayload } from '../../duuzra_types/security';
import { IClientDoc } from '../../models/duuzra-client-doc';
import { System } from '../../shared';
import { ClientMapper } from './duuzra-client.mapper';
import { ClientRepository, IClientRepository } from './duuzra-client.repository';

export interface IClientService {
    get(token: string, correlationId: string, scopeUuid: string, filter: any, sort: any): Promise<IClientDto[]>;
    create(token: string, correlationId: string, scopeUuid: string, object: IClientDto, options?: any): Promise<IClientDto>;
    update(token: string, correlationId: string, scopeUuid: string, object: IClientDto): Promise<IClientDto>;
    delete(token: string, correlationId: string, scopeUuid: string, uuid: string): Promise<IClientDto>;
}

export class ClientService extends ServiceBase<IClientDto> implements IClientService {
    private clientRepo: IClientRepository;

    // ##########################################################################
    // # LIFECYCLE
    // ##########################################################################
    constructor() {
        super();
        this.clientRepo = new ClientRepository();
    }

    // ####################################
    // # DATA READS
    // ####################################
    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuid: string): Promise<IClientDto>;
    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, filters?: any, sort?: any): Promise<IClientDto[]>
    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, filters?: any, sort?: any): Promise<IClientDto | IClientDto[]> {
        console.log("duuzra-client.service.ts getAction()");
        if (this.isUuidQuery(filters)) {
            return await this.clientRepo.getClientByUuid(
                tokenProvider.token,
                correlationId,
                filters as string
            );
        }

        if (this.isUuidQuery(filters)) {
            return await this.clientRepo.getClientByUuid(tokenProvider.token, correlationId, filters as string);
        } else {
            const result: IClientDto[] = await this.clientRepo.getAllUsers();
            return this.applyFiltersAndSorts(result, filters, sort);
        }
    }

    private applyInCodeFiltersAndSorts(dtos, filters, sorts) {
        for (const property in filters) {
            if (property !== 'uuid') {
                dtos = dtos.filter((dto) => {
                    return dto[property] === filters[property] || filters[property].indexOf(dto[property]) > -1;
                })
            }
        }
        // todo - handle sorts
        return dtos;
    }

    // ####################################
    // # DATA CHANGES
    // ####################################

    public async createAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, object: IClientDto): Promise<IClientDto>;
    public async createAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, object: IClientDto[]): Promise<IClientDto[]>;
    public async createAction(
        tokenProvider: ITokenProvider,
        correlationId: string,
        scopeUuid: string,
        object: IClientDto | IClientDto[]
    ): Promise<IClientDto | IClientDto[]> {
        console.log("duuzra-client.repository.ts createAction()");
        return this.implementSingleOnly(CommunicationVerb.POST, object, () => this.clientRepo.createClient(tokenProvider.token, correlationId, object as IClientDto))
    }

    public async updateAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, object: IClientDto): Promise<IClientDto>;
    public async updateAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, object: IClientDto[]): Promise<IClientDto[]>;
    public async updateAction(
        tokenProvider: ITokenProvider,
        correlationId: string,
        scopeUuid: string,
        object: IClientDto | IClientDto[]
    ): Promise<IClientDto | IClientDto[]> { 
        console.log("duuzra-client.repository.ts updateAction()");
        return Promise.reject<IClientDto>(null);
    }

    protected async deleteAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuid: string): Promise<IClientDto>;
    protected async deleteAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuids: string[]): Promise<IClientDto[]>;
    protected async deleteAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuids: string | string[]): Promise<IClientDto | IClientDto[]> { 
        console.log("duuzra-client.repository.ts DeleteAction()");
        return Promise.reject<IClientDto>(null);
    }
}

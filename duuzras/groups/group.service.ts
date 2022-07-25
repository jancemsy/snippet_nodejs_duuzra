import { IAuthClaimDto } from '../../duuzra_types/auth';
import { DateFormatter } from '../../duuzra_types/common';
import { IGroupDto } from '../../duuzra_types/duuzras';
import { CommandTypes, CommunicationFactory, CommunicationVerb, ICommunication, ServiceBusQueues, WsChannels } from '../../duuzra_types/network'
import { IDuuzraTokenPayload } from '../../duuzra_types/security';
import { ServiceBase } from '../../core/services/index';
import { ITokenProvider } from '../../core/token/index';
import { System } from '../../shared';
import { GroupRepository } from './group.repository';

export interface IGroupService {
    get(token: string, correlationId: string, scopeUuid: string, uuid: string): Promise<IGroupDto>;
    get(token: string, correlationId: string, scopeUuid: string, filter?: any, sort?: any): Promise<IGroupDto[]>;
    create(token: string, correlationId: string, scopeUuid: string, object: IGroupDto, options?: any): Promise<IGroupDto>;
    update(token: string, correlationId: string, scopeUuid: string, object: IGroupDto): Promise<IGroupDto>
    delete(token: string, correlationId: string, scopeUuid: string, uuid: string, options?: any): Promise<IGroupDto>;
    delete(token: string, correlationId: string, scopeUuid: string, uuids: string[], options?: any): Promise<IGroupDto[]>;
}
export class GroupService extends ServiceBase<IGroupDto> implements IGroupService {
    private groupRepo: GroupRepository;

    constructor() {
        super();
        this.groupRepo = new GroupRepository();
    }

    // ####################################
    // # DATA READS
    // ####################################

    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuid: string): Promise<IGroupDto>;
    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, filters?: any, sort?: any): Promise<IGroupDto[]>
    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, filters?: any, sort?: any): Promise<IGroupDto | IGroupDto[]> {
        console.log("group.service.ts getAction");
        // TODO: Vital security to be implemented here to ensure no data leakage.
        // We are not currently validating that the snapshot is part of the client.

        if (this.isUuidQuery(filters)) {
            return await this.groupRepo.getGroupByUuid(scopeUuid, filters as string);
        } else {
            const map: Map<boolean, () => Promise<IGroupDto[]>> = new Map();
            map.set(!!scopeUuid, () => this.groupRepo.getGroupsByDuuzra(scopeUuid));
            return this.getResultsFromPrioritizedConditions(map, filters, sort);
        }
    }
 
    public async createAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, object: IGroupDto, options?: any): Promise<IGroupDto>;
    public async createAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, object: IGroupDto[], options?: any): Promise<IGroupDto[]>;
    public async createAction(
        tokenProvider: ITokenProvider,
        correlationId: string,
        scopeUuid: string,
        object: IGroupDto | IGroupDto[],
        options?: any
    ): Promise<IGroupDto | IGroupDto[]> { 
        console.log("group.service.ts createAction");
        if (!this.isMultiple(object)) {
            return this.implementSingleOnly(CommunicationVerb.POST, object, async () => {
                const objectSingle: IGroupDto = object as IGroupDto;
                objectSingle.dateCreated = new DateFormatter().toString();
                objectSingle.createdBy = tokenProvider.payload.uuid;
                return this.groupRepo.createGroup(scopeUuid, objectSingle);
            });
        } else {
            const objects = object as any[];
            return this.groupRepo.createMultipleGroup(scopeUuid, objects, options);
        }
    }

    protected async updateAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, object: IGroupDto): Promise<IGroupDto> { 
        console.log("group.service.ts updateAction");
        // Note - DH - I really don't like this but it the only way I can think to get the client uuid out without new load.
        //           - a cleaner solutions should be found.
        const addAdminPermissionCallback = async (clientUuid, authUuid) => {
            const addAdminClaims: IAuthClaimDto = {
                authUuid: authUuid,
                claims: ['duuzra.role.cms.admin', 'duuzra.client.' + clientUuid]
            }

            const createClaimsParams = {};
            const createClaimsCommand = CommunicationFactory.create<any>(correlationId, null, null, tokenProvider.token, 'Duuzra-Group-Service', createClaimsParams, addAdminClaims, 'post');
            const createClaimsResponse: ICommunication<IAuthClaimDto> = await System.serviceBus.sendToQueue(ServiceBusQueues.authNode.claim, createClaimsCommand);
        }

        const removeAdminPermissionCallback = async (clientUuid, authUuid) => {
            const removeAdminClaims: IAuthClaimDto = {
                authUuid: authUuid,
                claims: ['duuzra.role.cms.admin', 'duuzra.client.' + clientUuid]
            }

            const createClaimsParams = {};
            const createClaimsCommand = CommunicationFactory.create<any>(correlationId, null, null, tokenProvider.token, 'Duuzra-Group-Service', createClaimsParams, removeAdminClaims, 'delete');
            const createClaimsResponse: ICommunication<IAuthClaimDto> = await System.serviceBus.sendToQueue(ServiceBusQueues.authNode.claim, createClaimsCommand);
        }

        return await this.groupRepo.updateGroup(scopeUuid, object, addAdminPermissionCallback, removeAdminPermissionCallback);
    }

    protected async deleteAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuid: string, options?: any): Promise<IGroupDto>;
    protected async deleteAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuids: string[], options?: any): Promise<IGroupDto[]>;
    protected async deleteAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuids: string | any, options?: any): Promise<IGroupDto | IGroupDto[]> {
        console.log("group.service.ts deleteAction");
        if (this.isMultiple(uuids)) {

            return await this.groupRepo.deleteManyGroup(scopeUuid, uuids);
        } else {
            return this.implementSingleOnly(CommunicationVerb.POST, uuids, async () => {
                const uuidSingle: string = uuids;
                return this.groupRepo.deleteGroup(scopeUuid, uuidSingle);
            });
        }

    }
}

import { IAddMultipleUsersDto } from '../../duuzra_types/duuzras';
import { CommunicationVerb } from '../../duuzra_types/network';
import { IDuuzraTokenPayload } from '../../duuzra_types/security';
import { ServiceBase } from '../../core/services/index';
import { ITokenProvider } from '../../core/token/index';
import { DuuzraUserRepository, IDuuzraUserRepository } from './index';

export interface IDuuzraUserService {
    get(token: string, correlationId: string, scopeUuid: string, filter?: any, sort?: any): Promise<any[]>;
    create(token: string, correlationId: string, scopeUuid: string, object: any, options?: any): Promise<any>;
    delete(token: string, correlationId: string, scopeUuid: string, uuidS: string[], options?: any): Promise<any>;
}

export class DuuzraUserService extends ServiceBase<any> implements IDuuzraUserService {

    private duuzraUserRepo: IDuuzraUserRepository;

    // ##########################################################################
    // # LIFECYCLE
    // ##########################################################################

    constructor() {
        super();
        this.duuzraUserRepo = new DuuzraUserRepository();
    }

    // ####################################
    // # DATA READS
    // ####################################

    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuid: string): Promise<any>;
    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, filters?: any, sort?: any): Promise<any[]>
    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, filters?: any, sort?: any): Promise<any | any[]> {
        console.log("duuzra-user.service.ts getAction()");
        let attendeDetails = await this.duuzraUserRepo.getUsersForDuuzra(scopeUuid);
        return attendeDetails; 
    }

    // ####################################
    // # DATA CHANGES
    // ####################################

    public async createAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, object: any, options: any): Promise<any>;
    public async createAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, object: any[], options: any): Promise<any[]>;
    public async createAction(
        tokenProvider: ITokenProvider,
        correlationId: string,
        scopeUuid: string,
        object: any | any[],
        options: any
    ): Promise<any | any[]> {
        console.log("duuzra-user.service.ts createAction()");
        if (!this.isMultiple(object)) { 
            const objectSingle = object as any;
            return this.duuzraUserRepo.addUserToDuuzra(scopeUuid, objectSingle);
        } else { 
            const objects = object as any[];
            if (options){ 
                this.duuzraUserRepo.addMultipleUsersToDuuzra(scopeUuid, objects, options.groups, options.grpAssignment)
            } else { 
                this.duuzraUserRepo.addMultipleUsersToDuuzra(scopeUuid, objects);
            }
        }
    }

    protected async deleteAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuid: string, options?: any): Promise<any>;
    protected async deleteAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuids: string[], options?: any): Promise<any[]>;
    protected async deleteAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuids: string | string[], options?: any): Promise<any | any[]> {
        console.log("duuzra-user.service.ts deleteAction()");
        return this.implementMultipleOnly(CommunicationVerb.DELETE, uuids, async () => {
            const uuidsMultiple: string[] = uuids as string[];
            return await this.duuzraUserRepo.deleteUsersFromDuuzra(scopeUuid, uuidsMultiple)
        });
    }
}

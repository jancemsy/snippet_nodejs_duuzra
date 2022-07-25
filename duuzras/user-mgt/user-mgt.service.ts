import { CommunicationVerb, CommandTypes, CommunicationFactory, ICommunication, ServiceBusQueues, WsChannels } from '../../duuzra_types/network';
import { IDuuzraTokenPayload } from '../../duuzra_types/security';
import { IDuuzraAccountDoc } from '../../models/duuzra-account-doc';
import { IClientDto } from '../../duuzra_types/duuzras';
import { IClientDoc } from '../../models/duuzra-client-doc';
import { IAuthClaimDto, IAuthUserDto } from '../../duuzra_types/auth';
import { DateFormatter } from '../../duuzra_types/common';
import { UserManagementRepository, IUserManagementRepository } from './user-mgt.repository';
import { ServiceBase } from '../../core/services/index';
import { System } from '../../shared';
import { HashHelper } from './helpers/hash.helper';
import { ITokenProvider } from '../../core/token/index';
import { ClaimsService } from '../../shared/claims/claims.service';

export interface IUserManagementService {
    get(token: string, correlationId: string, scopeUuid: string, filter: any, sort: any): Promise<IAuthUserDto[]>;
    create(token: string, correlationId: string, scopeUuid: string, object: IAuthUserDto, options?: any): Promise<IAuthUserDto>;
    update(token: string, correlationId: string, scopeUuid: string, object: IAuthUserDto, options?: any): Promise<IAuthUserDto>;
    delete(token: string, correlationId: string, scopeUuid: string, uuid: string): Promise<IAuthUserDto>;
}

export class UserManagementService extends ServiceBase<IAuthUserDto> implements IUserManagementService {
    private userMgtRepo: IUserManagementRepository; 
    constructor() {
        super();
        this.userMgtRepo = new UserManagementRepository();
    } 
    
    private applyInCodeFiltersAndSorts(dtos, filters, sorts) {
        for (const property in filters) {
            if (property !== 'uuid') {
                dtos = dtos.filter((dto) => {
                    return dto[property] === filters[property] || filters[property].indexOf(dto[property]) > -1;
                })
            }
        } 
        return dtos;
    }
 
    public async createAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, object: IAuthUserDto, options?: any): Promise<IAuthUserDto>;
    public async createAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, object: IAuthUserDto[], options?: any): Promise<IAuthUserDto[]>;
    public async createAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, object: IAuthUserDto | IAuthUserDto[], options?: any): Promise<IAuthUserDto | IAuthUserDto[]> { 
        console.log("user-mgt.service.ts CreateAction()");
        return this.implementSingleOnly(CommunicationVerb.POST, object, async () => {
            const user: IAuthUserDto = object as IAuthUserDto;
            const userWithEmail = await this.userMgtRepo.getUserByEmail(user.email);
            let client; 
            if (!userWithEmail) {
                // Hash the password.
                let encryptedPassword;
                if (user.password) {
                    encryptedPassword = await HashHelper.encrypt(user.password);
                } else {
                    encryptedPassword = await HashHelper.encrypt('duuzra');
                }

                user.password = encryptedPassword;
                user.dateCreated = new DateFormatter().toString();
                user.createdBy = tokenProvider.userId;

                const newClient: IClientDto = {
                    uuid: '',
                    info: {
                        name: object['client']
                    },
                    accounts: [],
                    media: [],
                    duuzras: [],
                    folders: []
                };

                try { 
                } catch (e) {
                    return Promise.reject<IAuthUserDto>(new Error('IAttendeeService - createAttendee - createNewUser - failed: ' + e));
                }
                return this.userMgtRepo.createUser(tokenProvider.token, correlationId, null, scopeUuid, user, client);
            } else {
                return Promise.reject<IAuthUserDto>(new Error('UserManagementService - createUser - failed: email already exists'));
            }
        }) as Promise<IAuthUserDto>;
    }

    public async updateAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, object: IAuthUserDto, options?: any): Promise<IAuthUserDto>;
    public async updateAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, object: IAuthUserDto, options?: any): Promise<IAuthUserDto> { 
        console.log("user-mgt.service.ts UpdateAction()");
        const user: IAuthUserDto = object as IAuthUserDto;
        const userWithEmail = await this.userMgtRepo.getUserByUuid("", "", "", "", user.uuid); 
        user.settings = userWithEmail.settings != null ? userWithEmail.settings : null;
        user.registrationToken = userWithEmail.registrationToken;
        user.createdBy = userWithEmail.createdBy;
        let encryptedPassword;
        if (user.password && user.password !== userWithEmail.password) {
            encryptedPassword = await HashHelper.encrypt(user.password);
        } else {
            encryptedPassword = userWithEmail.password;
        } 
        user.password = encryptedPassword; 
        if (!userWithEmail) { 
            return this.userMgtRepo.updateUser(user);
        } else { 
            if (user.email !== userWithEmail.email) { 
                return this.userMgtRepo.updateUser(user);
            } else { 
                if (typeof userWithEmail.firstname === 'undefined' || typeof userWithEmail.lastname === 'undefined') { 
                    return this.userMgtRepo.updateUser(user);
                } else { 
                    if (user.firstname.toLowerCase() === userWithEmail.firstname.toLowerCase() &&
                        user.lastname.toLowerCase() === userWithEmail.lastname.toLowerCase() &&
                        user.email.toLowerCase() === userWithEmail.email.toLowerCase() && user.password === "") { 
                        return Promise.reject<IAuthUserDto>(new Error('UserManagementService - updateUser - failed: Nothing to update'));
                    } else { 
                        return this.userMgtRepo.updateUser(user);
                    }
                }
            }
        }
    }
    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuid: string): Promise<IAuthUserDto>;
    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, filters?: any, sort?: any): Promise<IAuthUserDto[]>
    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, filters?: any, sort?: any): Promise<IAuthUserDto | IAuthUserDto[]> { 
        console.log("user-mgt.service.ts getAction()");
        if (this.isUuidQuery(filters)) {

            try{
                return await this.userMgtRepo.getUserByUuid(
                    tokenProvider.token,
                    correlationId,
                    null,
                    scopeUuid,
                    filters as string);
            }catch(e){
                return Promise.resolve(null);
            } 
        } else {
            const result: IAuthUserDto[] = await this.userMgtRepo.getAllUsers(
                tokenProvider.token,
                correlationId,
                null
            );
            return result; 
        }
    }

    protected async deleteAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuids: string, options?: any): Promise<IAuthUserDto>;
    protected async deleteAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuids: string[], options?: any): Promise<IAuthUserDto[]>;
    protected async deleteAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuids: string | string[], options?: any): Promise<IAuthUserDto | IAuthUserDto[]>;
    protected async deleteAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuids: string | string[], options?: any): Promise<IAuthUserDto | IAuthUserDto[]> { 
        console.log("user-mgt.service.ts deleteAction()");
        return this.userMgtRepo.deleteUser(uuids);
    }
}

import { IAuthClaimDto, IAuthUserDto } from '../../duuzra_types/auth';
import { IAttendeeDto, IAttendeePermissionsDto } from '../../duuzra_types/duuzras';
import { CommandTypes, CommunicationFactory, CommunicationVerb, ICommunication, ServiceBusQueues, WsChannels } from '../../duuzra_types/network'
import { IDuuzraTokenPayload } from '../../duuzra_types/security';
import { ServiceBase } from '../../core/services/index';
import { System } from '../../shared';
import { AttendeeRepository, IAttendeeRepository } from './attendee.repository'; // fails on barrel ref

import { ITokenProvider } from '../../core/token/index';

export interface IAttendeeService {

    get(
        token: string,
        correlationId: string,
        scopeUuid: string,
        filter: any,
        sort: any
    ): Promise<IAttendeeDto[]>
    create(token: string, correlationId: string, scopeUuid: string, object: IAttendeeDto): Promise<IAttendeeDto>;
    create(token: string, correlationId: string, scopeUuid: string, object: IAttendeeDto[]): Promise<IAttendeeDto[]>;
    createAttendeeForKnownUser(token: string, correlationId: string, scopeUuid: string, object: IAttendeeDto): Promise<IAttendeeDto>;

    update(token: string, correlationId: string, scopeUuid: string, object: IAttendeeDto): Promise<IAttendeeDto>

    delete(token: string, correlationId: string, scopeUuid: string, uuid: string): Promise<IAttendeeDto>;
    delete(token: string, correlationId: string, scopeUuid: string, uuids: string[]): Promise<IAttendeeDto[]>;
}

export class AttendeeService extends ServiceBase<IAttendeeDto> implements IAttendeeService {

    private attendeeRepo: IAttendeeRepository;

    constructor() {
        super();
        this.attendeeRepo = new AttendeeRepository();
    }

    // ####################################
    // # DATA READS
    // ####################################

    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuid: string): Promise<IAttendeeDto>;
    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, filters?: any, sort?: any): Promise<IAttendeeDto[]>
    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, filters?: any, sort?: any): Promise<IAttendeeDto | IAttendeeDto[]> {
        if (this.isUuidQuery(filters)) {
            return await this.attendeeRepo.getAttendeeByUuid(
                tokenProvider.token,
                correlationId,
                null /* TODO: Needs duuzra and client claim tokenProvider.hasClientClaim */,
                scopeUuid,
                filters as string);
        } else  {
            const result: IAttendeeDto[] = await this.attendeeRepo.getAttendeesByDuuzra(
                tokenProvider.token,
                correlationId,
                null
                /* TODO: Needs duuzra and client claim tokenProvider.hasClientClaim */,
                scopeUuid);
            return this.applyFiltersAndSorts(result, filters, sort);
        }
    }

    // ####################################
    // # DATA CHANGES
    // ####################################

    public async createAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, object: IAttendeeDto): Promise<IAttendeeDto>;
    public async createAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, object: IAttendeeDto[]): Promise<IAttendeeDto[]>;
    public async createAction(
        tokenProvider: ITokenProvider,
        correlationId: string,
        scopeUuid: string,
        object: IAttendeeDto | IAttendeeDto[]
    ): Promise<IAttendeeDto | IAttendeeDto[]> { 
        console.log("attendee.service.ts createAction()");
        if (!this.isMultiple(object)) {
            const attendee: IAttendeeDto = object as IAttendeeDto;

            // ##############################################################################
            // # Create or lookup from users if the specified attendee does not have an authUuid
            // ##############################################################################

            // Look for a user with the same email address - this is how the users login and as such is thier username.
            const getUserByEmailParams = {
                filter: {
                    email: attendee.email
                }
            }
            const getUserByEmailCommand = CommunicationFactory.create<any>(correlationId, null, null, tokenProvider.token, 'Duuzra-Attendee-Service', getUserByEmailParams);
            const getUserByEmailResponse: ICommunication<IAuthUserDto[]> = await System.serviceBus.sendToQueue(ServiceBusQueues.authNode.user, getUserByEmailCommand);

            let authUuid = null
            if (getUserByEmailResponse.body && getUserByEmailResponse.body.length === 1) {
                // user is returned
                authUuid = getUserByEmailResponse.body[0].uuid;
            } else {
                // user is not returned
                const newUser: IAuthUserDto = {
                    uuid: null,
                    email: attendee.email,
                    firstname: attendee.firstname,
                    lastname: attendee.lastname,
                    password: 'duuzra', // todo - this should be a generated hash that they have to reset to gain a full password
                    claims: this.identifyCreateClaims(this.tokenProvider.getFirstClientClaim().split('.')[2], attendee.permissions),
                    dateCreated: null,
                    createdBy: null,
                    registrationToken: '',
                    hasRegistered: false,
                    isEmailValidated: false,
                    isAnnonymous: false,
                    isAttendee: attendee.isAttendee,
                    permissions: {
                        canAddUsers: false
                    },
                    settings: null
                };

                try {
                    const createNewUserParams = {}
                    const createNewUserCommand = CommunicationFactory.create<any>(correlationId, null, null, tokenProvider.token, 'Duuzra-Attendee-Service', createNewUserParams, newUser, 'post');
                    const createNewUserResponse: ICommunication<IAuthUserDto> = await System.serviceBus.sendToQueue(ServiceBusQueues.authNode.user, createNewUserCommand);
                    authUuid = createNewUserResponse.body.uuid;
                } catch (e) {
                    return Promise.reject<IAttendeeDto>(new Error('IAttendeeService - createAttendee - createNewUser - failed: ' + e));
                }
            }

            // Apply the auth uuid
            attendee.authUuid = authUuid;

            // ##############################################################################
            // # todo - if the attendee has no permissions set then they should take the
            // #        permissions from the default group.
            // ##############################################################################

            return this.attendeeRepo.createAttendee(tokenProvider.token, correlationId, null /* TODO: Client uuid needs to be passed here clientUuid */, scopeUuid, attendee);
        } else {
            return this.attendeeRepo.createAttendees(tokenProvider.token, correlationId, null /* TODO: Client uuid needs to be passed here clientUuid */, scopeUuid, object as IAttendeeDto[]);
        }
    }

    /**
     * This method creates an attendee based on a known user.
     * However this method is a little redundant as we do not need the auth info to create the attendee nor the email.
     * This method is present as the other create attendee method uses the email address provided to create the user if there isn't one.
     * In this case that is non viable so this seperate method was created. (for adding the creator as an attendee.)
     *
     * @param authToken
     * @param correlationId
     * @param tokenPayload
     * @param duuzraUuid
     * @param attendee
     */
    public async createAttendeeForKnownUser(token: string, correlationId: string, scopeUuid: string, object: IAttendeeDto): Promise<IAttendeeDto> {
        console.log("attendee.service.ts createAttendeeForKnownUser()");
        return this.processBase(
            token,
            this.validateResourcePost(),
            () => this.createAttendeeForKnownUserAction(this.tokenProvider, correlationId, scopeUuid, object)
        ) as Promise<IAttendeeDto>;
    }

    public async createAttendeeForKnownUserAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, object: IAttendeeDto): Promise<IAttendeeDto> {
        console.log("attendee.service.ts createAttendeeForKnownUserAction()");
        const getUserByAuthUuidParams = {
            filter: {
                uuid: object.authUuid
            }
        }
        const getUserByAuthUuidCommand = CommunicationFactory.create<any>(this.tokenProvider.token, null, null, tokenProvider.token, 'Duuzra-Attendee-Service', getUserByAuthUuidParams);
        const getUserByAuthUuidResponse: ICommunication<IAuthUserDto[]> = await System.serviceBus.sendToQueue(ServiceBusQueues.authNode.user, getUserByAuthUuidCommand);

        if (getUserByAuthUuidResponse.body && getUserByAuthUuidResponse.body.length === 1) {
            // user is returned
            const knownUser: IAuthUserDto = getUserByAuthUuidResponse.body[0];

            // We do not need to augment the user with the details. This is done on the reponse.

            return this.attendeeRepo.createAttendee(
                tokenProvider.token,
                correlationId,
                null
                /* TODO: Needs duuzra and client claim tokenProvider.hasClientClaim */,
                scopeUuid, object);
        }
    }

    public async updateAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, object: IAttendeeDto): Promise<IAttendeeDto> {
        console.log("attendee.service.ts updateAction()");
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

        return this.attendeeRepo.updateAttendee(
            tokenProvider.token,
            correlationId,
            null /* TODO: Needs duuzra and client claim tokenProvider.hasClientClaim */,
            scopeUuid,
            object,
            addAdminPermissionCallback,
            removeAdminPermissionCallback
        );
    }

    public async deleteAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuid: string): Promise<IAttendeeDto>;
    public async deleteAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuids: string[]): Promise<IAttendeeDto[]>;
    public async deleteAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuids: string | string[]): Promise<IAttendeeDto | IAttendeeDto[]> {
        if (this.isMultiple(uuids)) {
            return this.attendeeRepo.deleteAttendees(tokenProvider.token, correlationId, null /* TODO: Needs duuzra and client claim tokenProvider.hasClientClaim */, scopeUuid, uuids as string[]);
        } else {
            return this.attendeeRepo.deleteAttendee(tokenProvider.token, correlationId, null /* TODO: Needs duuzra and client claim tokenProvider.hasClientClaim */, scopeUuid, uuids as string);
        }
    }

    private identifyCreateClaims(clientUuid: string, attendeePermissions: IAttendeePermissionsDto): string[] {
        console.log("attendee.service.ts identifyCreateClaims()");
        const claims: string[] = [];
        if (attendeePermissions.cmsAnalyticsEnabled || attendeePermissions.cmsSharingEnabled) {
            claims.push('duuzra.role.cms.admin')
            claims.push('duuzra.client.' + clientUuid)
        } else if (attendeePermissions.cmsEditEnabled) {
            claims.push('duuzra.role.cms.editor')
            claims.push('duuzra.client.' + clientUuid)
        }

        return claims;
    }
}

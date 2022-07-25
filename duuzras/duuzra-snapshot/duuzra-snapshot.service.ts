import { IDuuzraInfoDto, IDuuzraSnapshotDto } from '../../duuzra_types/duuzras';
import { IMessageEnvelope } from '../../duuzra_types/messenger';
import { CommunicationVerb,   CommandTypes,
    CommunicationFactory,
    CommunicationStatuses,
    ICommunication,
    ServiceBusQueues,
    WsChannels } from '../../duuzra_types/network';
import { Session, System } from '../../shared';
const uuid = require('uuid/v1');
import { IDuuzraTokenPayload } from '../../duuzra_types/security';
import { ServiceBase } from '../../core/services/index';
import { ITokenProvider } from '../../core/token/index'; 
import { DuuzraSnapshotRepository, IDuuzraSnapshotRepository } from './duuzra-snapshot.repository'; 
import { DuuzraInfoService } from '../duuzra-info/duuzra-info.service'; 
import uuidGen = require('uuid/v1');
import { ClaimsService } from '../../shared/claims/claims.service';
import { EmailService, IEmailService } from '../../shared/email/email-service';
import { DuuzraPermissions } from '../duuzra.permissions'; 
import { UserService } from '../../shared/index';
import { UserDocument } from '../../shared/user/models/user-document';
import { AttendeeService } from '../attendees/index';
import { IDuuzraInfoService } from '../index';

export interface IDuuzraSnapshotService {
    get(token: string, correlationId: string, scopeUuid: string, uuid: string): Promise<IDuuzraSnapshotDto>;
    get(token: string, correlationId: string, scopeUuid: string, filter?: any, sort?: any): Promise<IDuuzraSnapshotDto[]>;
    create(token: string, correlationId: string, scopeUuid: string, object: IDuuzraSnapshotDto): Promise<IDuuzraSnapshotDto>;
    update(token: string, correlationId: string, scopeUuid: string, object: IDuuzraSnapshotDto): Promise<IDuuzraSnapshotDto>
    delete(token: string, correlationId: string, scopeUuid: string, uuid: string): Promise<IDuuzraSnapshotDto>;

    getSnapshotDelta(token: string, correlationId: string, scopeUuid: string): Promise<any>;
    getNewUniquePinCode(): Promise<string>;
    getNewUniqueUrlToken(): Promise<string>;
}

export class DuuzraSnapshotService extends ServiceBase<IDuuzraSnapshotDto> implements IDuuzraSnapshotService {

    private infoService: IDuuzraInfoService;
    private userService: UserService;
    private snapshotRepo: IDuuzraSnapshotRepository;
    private emailService: IEmailService;

    // ##########################################################################
    // # LIFECYCLE
    // ##########################################################################

    constructor() {
        super();
        this.userService = new UserService();
        this.snapshotRepo = new DuuzraSnapshotRepository();
        this.infoService = new DuuzraInfoService();
        this.emailService = new EmailService();
    }

    // ####################################
    // # DATA READS
    // ####################################


    /* send this null cue to the app that we have an update*/
    public async setContentState(): Promise<{}> { 
           setTimeout(() =>{
                console.log("duuzra-snapshot.service.ts setContentState()");   
                const stateMessage = CommunicationFactory.create(
                            uuid(),
                            CommunicationStatuses.OK,
                            'duuzra_state_synchronization',
                            null,
                            null,
                            null,
                            null
                ); 

                const relayMessage = CommunicationFactory.createGatewayRelayMessage('app',  null, null,null, 'all-users', stateMessage);    
                System.serviceBus.sendToQueue(ServiceBusQueues.gatewayNode.relayMessageToChannel, relayMessage); 
            },500);  
            return Promise.resolve(null);  
    }
    

    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuid: string): Promise<IDuuzraSnapshotDto>;
    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, filters?: any, sort?: any): Promise<IDuuzraSnapshotDto[]>
    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, filters?: any, sort?: any): Promise<IDuuzraSnapshotDto | IDuuzraSnapshotDto[]> {
        console.log("duuzra-snapshot.service.ts getAction()");
        // TODO: Vital security to be implemented here to ensure no data leakage.
        // We are not currently validating that the snapshot is part of the client.
              if (this.isUuidQuery(filters) ) {
            return this.snapshotRepo.getSnapshotByUuid(tokenProvider.payload.uuid, filters as string);
        }
              if (filters.activeOnly == "yes"){
          return  this.snapshotRepo.getSnapshotsCountByDuuzraUuid(tokenProvider.payload.uuid, scopeUuid, filters.activeOnly);
        } else {
            const map: Map<boolean, () => Promise<IDuuzraSnapshotDto[]>> = new Map();
            map.set(!!filters.authUuid, () => this.snapshotRepo.getSnapshotsByAuthUuid(tokenProvider.payload.uuid, filters.authUuid));
            map.set(!!scopeUuid, () => this.snapshotRepo.getSnapshotsByDuuzraUuid(tokenProvider.payload.uuid, scopeUuid, filters.activeOnly));
            return this.getResultsFromPrioritizedConditions(map, filters, sort);
        }
    }

    public async getSnapshotDelta(token: string, correlationId: string, scopeUuid: string): Promise<IDuuzraSnapshotDto> {
        console.log("duuzra-snapshot.service.ts getSnapshotDelta()");
        return this.processBase(
            token,
            this.validateResourceGet(),
            () => this.snapshotRepo.getLatestSnapshotByDuuzraUuid(null, scopeUuid)
        ) as Promise<IDuuzraSnapshotDto>;
    }

    // ####################################
    // # DATA CHANGES
    // ####################################

    public async createAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, object: IDuuzraSnapshotDto): Promise<IDuuzraSnapshotDto>;
    public async createAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, object: IDuuzraSnapshotDto[]): Promise<IDuuzraSnapshotDto[]>;
    public async createAction(
        tokenProvider: ITokenProvider,
        correlationId: string,
        scopeUuid: string,
        object: IDuuzraSnapshotDto | IDuuzraSnapshotDto[]
    ): Promise<IDuuzraSnapshotDto | IDuuzraSnapshotDto[]> {
 

        console.log("duuzra-snapshot.service.ts CreateAction()");
 
        let result = this.implementSingleOnly(CommunicationVerb.POST, object, async () => {
            const objectSingle: IDuuzraSnapshotDto = object as IDuuzraSnapshotDto;
            // TODO: remove null unused clientUuid parameter to repo call
            const draft: IDuuzraSnapshotDto = await this.snapshotRepo.getDraftSnapshotByDuuzraUuid(tokenProvider.payload.uuid, null, objectSingle.duuzraUuid);
            if (draft) {
                return draft;
            }
            return this.snapshotRepo.createSnapshot(tokenProvider.payload.uuid, null, objectSingle );
        });

 
        this.setContentState(); 

        return result; 
    }

    protected async updateAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, object: IDuuzraSnapshotDto): Promise<IDuuzraSnapshotDto> { 
        console.log("duuzra-snapshot.service.ts updateAction()");
        
        const snapShotToUpdate: IDuuzraSnapshotDto = await this.snapshotRepo.getSnapshotByUuid(tokenProvider.payload.uuid, object.uuid);
        if (snapShotToUpdate) { 
            if (!snapShotToUpdate.isDraft &&
                (
                    snapShotToUpdate.security.isSecure !== object.security.isSecure ||
                    snapShotToUpdate.security.pinCode !== object.security.pinCode ||
                    snapShotToUpdate.security.urlToken !== object.security.urlToken
                )
            ) { 
                return Promise.reject<IDuuzraSnapshotDto>(null);
            } 

            const addedUserIds: string[] = object.assignedUsers.filter((userId: string) => {
                return snapShotToUpdate.assignedUsers.indexOf(userId) === -1;
            });

            if (!!addedUserIds && !!addedUserIds.length) { 
                const snapshotDuuzra: IDuuzraInfoDto = (await this.infoService.get(tokenProvider.token, correlationId, scopeUuid, { uuid: object.duuzraUuid }, null))[0];
                for (const addedUserId of addedUserIds) {
                    const attendeeUser: UserDocument = await this.userService.getUserById(`auth-user_${addedUserId}`);
                    attendeeUser.registrationToken = uuidGen();
                    await this.userService.updateUsersRegistrationToken(attendeeUser);
                    this.emailService.sendAttendeeEmail(
                        attendeeUser.email,
                        snapshotDuuzra.name,
                        tokenProvider.payload.email,
                        attendeeUser.registrationToken,
                        `${attendeeUser.firstname} ${attendeeUser.lastname}`);
                }
            } 
            let result = this.snapshotRepo.updateSnapshot(tokenProvider.payload.uuid, null, object); 
            this.setContentState();

            return result; 
        } else { 
            return Promise.reject<IDuuzraSnapshotDto>(null);
        }
    }

    protected async deleteAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuid: string, isDeleted?: boolean): Promise<IDuuzraSnapshotDto>;
    protected async deleteAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuids: string[], isDeleted?: boolean): Promise<IDuuzraSnapshotDto[]>;
    protected async deleteAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuids: string | string[], isDeleted?: boolean): Promise<IDuuzraSnapshotDto | IDuuzraSnapshotDto[]> { 
        console.log("duuzra-snapshot.service.ts deleteAction()");
        let result = this.implementSingleOnly(CommunicationVerb.POST, uuids, async () => {
                        const uuidSingle: string = uuids as string;
                        return this.snapshotRepo.deleteSnapshot(tokenProvider.payload.uuid, null, uuidSingle);
        }); 
        this.setContentState(); 
        return result; 
    }

    // ####################################
    // # MISC
    // ####################################

    /**
     * This function generates and then checks if a token is unique.
     * If the token is not unique it continues to generate new tokens until a unique one is found.
     * Uniqueness is determined by no other snapshot having the same pin.
     * TESTED: 2017 07 26 - Both success and failure cases work as expected.
     */
    public async getNewUniquePinCode(): Promise<string> {
        console.log("duuzra-snapshot.service.ts getNewUniquePinCode()");
        try {

            // Test is pin is unique
            let pinUnique = false;
            let pin = '';
            while (!pinUnique) {
                pin = this.randomString(4);
                pinUnique = await this.testPinCodeUniqueness(pin);
            }

            // Return the unique token
            return Promise.resolve(pin);

        } catch (e) {
            console.error('ERROR:', e);
            return Promise.reject<string>(new Error('Unknown Error - getNewUniquePinCode()'));
        }
    }

    /**
     * This function generates and then checks if a token is unique.
     * If the token is not unique it continues to generate new tokens until a unique one is found.
     * Uniqueness is determined by no other snapshot having the same pin.
     * TESTED: 2017 07 26 - Both success and failure cases work as expected.
     */
    public async getNewUniqueUrlToken(): Promise<string> {
        console.log("duuzra-snapshot.service.ts getNewUniqueURLToken()");
        try {
            // Test is token is unique
            let tokenUnique = false;
            let token = '';
            while (!tokenUnique) {
                token = this.randomString(10);
                tokenUnique = await this.testUrlTokenUniqueness(token);
            }

            // Return the unique token
            return Promise.resolve(token);

        } catch (e) {
            console.error('ERROR:', e);
            return Promise.reject<string>(new Error('Unknown Error - getNewUniquePinCode()'));
        }
    }

    private randomString(length: number) {
        let text = '';
        const possible: string = 'abcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < length; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }

    private async testPinCodeUniqueness(pinCode: string): Promise<boolean> {
        console.log("duuzra-snapshot.service.ts testPinCodeUniquenes()");
        return await this.snapshotRepo.isPinCodeUnique(pinCode)
    }

    private async testUrlTokenUniqueness(urlToken: string): Promise<boolean> {
        console.log("duuzra-snapshot.service.ts testUrlTokenUniqueness()");
        return await this.snapshotRepo.isUrlTokenUnique(urlToken);
    }
}

import { IDuuzraDto } from '../../duuzra_types/duuzras';
import { IDuuzraTokenPayload } from '../../duuzra_types/security';
import { DuuzraPollClickRepository, IDuuzraPollClickRepository } from './duuzra-poll-click.repository';
import { DuuzraPollClickLog, IDuuzraPollClickDto } from './model/index';

import { ITokenProvider } from '../../core/token/index';
import { CommandTypes, CommunicationFactory, CommunicationStatuses, CommunicationVerb, ICommunication, ServiceBusQueues } from '../../duuzra_types/network';
import { ClaimsService } from '../../shared/claims/claims.service';
import { DuuzraPermissions } from '../duuzra.permissions';

import { ServiceBase } from '../../core/services/index';
import { Session, System } from '../../shared';

const uuid = require('uuid/v1');

export interface IDuuzraPollClickService {
    get(token: string, correlationId: string, scopeUuid: string, uuid: string): Promise<IDuuzraPollClickDto>;
    get(token: string, correlationId: string, scopeUuid: string, filter?: any, sort?: any): Promise<IDuuzraPollClickDto[]>;
    create(token: string, correlationId: string, scopeUuid: string, object: IDuuzraPollClickDto): Promise<IDuuzraPollClickDto>;
    create(token: string, correlationId: string, scopeUuid: string, object: IDuuzraPollClickDto[]): Promise<IDuuzraPollClickDto[]>;
}

export class DuuzraPollClickService extends ServiceBase<IDuuzraPollClickDto> implements IDuuzraPollClickService {
    private pollclickrepo: IDuuzraPollClickRepository; 
    constructor() {
        super();
        this.pollclickrepo = new DuuzraPollClickRepository();
    } 

    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuid: string): Promise<IDuuzraPollClickDto>;
    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, filters?: any, sort?: any): Promise<IDuuzraPollClickDto[]>
    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, filters?: any, sort?: any): Promise<IDuuzraPollClickDto | IDuuzraPollClickDto[]> { 
        console.log("duuzra-poll.click.service.ts GetAction()");
        return await this.pollclickrepo.get(filters);
    }

    public async createAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, object: IDuuzraPollClickDto): Promise<IDuuzraPollClickDto>;
    public async createAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, object: IDuuzraPollClickDto[]): Promise<IDuuzraPollClickDto[]>;
    public async createAction(
        tokenProvider: ITokenProvider,
        correlationId: string,
        scopeUuid: string,
        object: IDuuzraPollClickDto | IDuuzraPollClickDto[]
    ): Promise<IDuuzraPollClickDto | IDuuzraPollClickDto[]> { 
        console.log("duuzra-poll.click.service.ts createAction()");
        return null;
    }
 

    public async setNavigationState(correlationId: string, object: IDuuzraPollClickDto, communication: ICommunication<any>): Promise<IDuuzraPollClickDto> {
        console.log("duuzra-poll.click.service.ts setNavigationState()");
        try { 
            const objectSingle: IDuuzraPollClickDto = object as IDuuzraPollClickDto; 
            let result = await this.pollclickrepo.create(objectSingle); 
            const stateMessage = CommunicationFactory.create(
                uuid(),
                CommunicationStatuses.OK,
                CommandTypes.app.duuzra_poll_coordinate,
                null,
                null,
                null,
                result
            );
             
            const relayMessage = CommunicationFactory.createGatewayRelayMessage('app', objectSingle.duuzraUuid, null, null, null, stateMessage);
            await System.serviceBus.sendToQueue(ServiceBusQueues.gatewayNode.relayMessageToChannel, relayMessage);
            return result;
        }catch (err){ 
        }

    }
}

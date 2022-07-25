import { IDuuzraContentLockPush, IDuuzraState, IStateData } from '../../duuzra_types/duuzras';
import {
    CommandTypes,
    CommunicationFactory,
    CommunicationHandler,
    CommunicationStatuses,
    ICommunication
} from '../../duuzra_types/network';
import { HandlerBaseUserScope } from '../../core/handlers/index';
import { StateLogEntry, StateLogService } from '../state-log';

export class DuuzraSetContentLockStateHandler extends HandlerBaseUserScope<any> {

    protected service: StateLogService;

    constructor() {
        super(new StateLogService());
    }

    public async processVerb(
        communication: ICommunication<IDuuzraContentLockPush>,
        correlationId: string,
        scopeUuid: string,
        uuid?: string,
        object?: IDuuzraContentLockPush,
        filters?: any,
        sort?: any): Promise<ICommunication<IDuuzraContentLockPush>> {

    console.log("set-content-lock-state.handler.ts processVerb");

        // process the content lock
        const state = await this.service.logContentLockStateChange(
            communication.body.duuzraUuid,
            communication.body.contentUuid,
            communication.body.locked
        );

        // build the response

        return Promise.resolve(
            CommunicationFactory.createResponse(communication, CommunicationStatuses.OK, null, {
                    duuzraStateDelta: state,
                    messageLogDelta: null,
                    messageNotificationDelta: null
                } as IStateData as any)
        );
    }
}

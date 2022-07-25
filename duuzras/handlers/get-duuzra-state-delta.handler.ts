import { IDuuzraNavigationPush, IDuuzraState } from '../../duuzra_types/duuzras';
import {
    CommandTypes,
    CommunicationFactory,
    CommunicationHandler,
    CommunicationStatuses,
    ICommunication,
} from '../../duuzra_types/network';
import { HandlerBaseClientScope } from '../../core/handlers/index';
import { StateDeltaService } from '../state-delta/state-delta.service';

export class GetDuuzraStateDeltaHandler extends HandlerBaseClientScope<any> {
    constructor() {
        super(new StateDeltaService());
    }
}

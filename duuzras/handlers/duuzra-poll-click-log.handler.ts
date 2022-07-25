import {
    CommunicationHandler,
    ICommunication,
    CommunicationStatuses,
    CommandTypes,
    CommunicationFactory
} from '../../duuzra_types/network';
import { DuuzraPollClickService, IDuuzraPollClickService } from '../duuzra-poll-click/duuzra-poll-click.service';
import { IDuuzraNavigationPush } from '../../duuzra_types/duuzras'
import { IDuuzraPollClickDto } from '../duuzra-poll-click/model/index';
import { HandlerBaseClientScope } from '../../core/handlers/index';
import { System, SessionService, } from '../../shared';

export class DuuzraPollClickLogHandler implements CommunicationHandler {
    private masterCtrl: DuuzraPollClickService;
    private sessionCtrl: SessionService;

    constructor() {
        this.masterCtrl = new DuuzraPollClickService();
        this.sessionCtrl = new SessionService();
    }

    public async processCommunication(communication: ICommunication<IDuuzraPollClickDto>): Promise<ICommunication<any>> {         
        console.log("duuzra-poll-click-log.handler.ts processCommunication");
        try{ 
            const state = await this.masterCtrl.setNavigationState(
                communication.head.correlationId,
                communication.body,
                communication
            ); 
            return Promise.resolve(null);
        }catch (err){ 
        }

    }
}

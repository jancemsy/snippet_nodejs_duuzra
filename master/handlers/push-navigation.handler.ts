import {
    CommunicationHandler,
    ICommunication,
    CommunicationStatuses,
    CommandTypes,
    CommunicationFactory
} from '../../duuzra_types/network';
import { IDuuzraNavigationPush } from '../../duuzra_types/duuzras'
import { System, SessionService, } from '../../shared';
import { MasterService } from '../master.service';
import { stringify } from 'querystring';

export class PushNavigationHandler implements CommunicationHandler {
    private masterCtrl: MasterService;
    private sessionCtrl: SessionService;

    constructor() {
        this.masterCtrl = new MasterService();
        this.sessionCtrl = new SessionService();
    }

    public async processCommunication(communication: ICommunication<IDuuzraNavigationPush>): Promise<ICommunication<any>> { 
        console.log("push-navigation.handler.ts getSessionFromMessage");
        try{ 
            let session = await this.sessionCtrl.getSessionFromMessage(communication); 
            const state = await this.masterCtrl.setNavigationState(
                communication.head.correlationId,
                communication.body,
                communication
            ); 
            return Promise.resolve(null);
        }catch (err){ 
            return Promise.resolve(null);
        }

    }
}

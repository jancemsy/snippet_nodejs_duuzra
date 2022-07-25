import {
    CommunicationHandler,
    ICommunication,
    CommunicationStatuses,
    CommandTypes,
    CommunicationFactory
} from '../../duuzra_types/network';
import { IDuuzraContentLockPush } from '../../duuzra_types/duuzras'
import { System, SessionService,  } from '../../shared';
import { MasterService } from '../master.service';

export class PushContentLockHandler implements CommunicationHandler {
    private masterCtrl: MasterService;
    private sessionCtrl: SessionService; 
    constructor() {
        this.masterCtrl = new MasterService();
        this.sessionCtrl = new SessionService();
    }

    public async processCommunication(communication: ICommunication<IDuuzraContentLockPush>): Promise<ICommunication<any>> { 
        console.log("push-content-lock.handler.ts getSessionFromMessage");
        try{
        let session = await this.sessionCtrl.getSessionFromMessage(communication); 
        let state = await this.masterCtrl.setContentLockedState(
            communication.head.correlationId,
            session,
            communication.body,
            communication
        ); 
        return Promise.resolve(null);
        }catch(e){
            return Promise.reject<ICommunication<any>>(e); 
        }
    }
}

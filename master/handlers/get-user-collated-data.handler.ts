import {
    CommunicationHandler,
    ICommunication,
    CommunicationStatuses,
    CommandTypes,
    CommunicationFactory
} from '../../duuzra_types/network';
import { IDuuzraNavigationPush } from '../../duuzra_types/duuzras'
import { System, SessionService,  } from '../../shared';
import { MasterService } from '../master.service';

export class GetUserCollatedDataHandler implements CommunicationHandler {
    private masterCtrl: MasterService;
    private sessionCtrl: SessionService;

    constructor() {
        this.masterCtrl = new MasterService();
        this.sessionCtrl = new SessionService();
    }

    public async processCommunication(communication: ICommunication<any>): Promise<ICommunication<any>> { 
        console.log("get-user-collated-data.handler.ts getSessionFromMessage");
        try{
            let session = await this.sessionCtrl.getSessionFromMessage(communication);  
            const allSubmissionsOfType = await this.masterCtrl.getUserCollatedData(
                communication.head.correlationId,
                communication.head.authToken,
                session,
                communication.head.parameters.duuzraUuid,
                communication.head.parameters.filter.type,
            ); 
            return Promise.resolve(allSubmissionsOfType);
        }catch(e){
           return Promise.reject<ICommunication<any>>(e); 
        }
    }
}

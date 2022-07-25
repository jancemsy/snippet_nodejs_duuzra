import {
    ICommunication,
    CommunicationStatuses,
    CommandTypes,
    CommunicationHandler
} from '../../duuzra_types/network';
import { GatewayService } from '../gateway.service';

export class HandshakeHandler implements CommunicationHandler {
    private gatewayCtrl: GatewayService;

    constructor() {
        this.gatewayCtrl = new GatewayService();
    }

    public async processCommunication(communication: ICommunication<any>): Promise<ICommunication<void>> {
        console.log("handshak.handler.ts processcommunication()");
        try{
            // connect the user session
           this.gatewayCtrl.connectUserSession(communication);
        }catch(e){ 
        }

        // send a simple response to the client
        return Promise.resolve(null);
    }
}

import { ServiceBaseHandler } from '../../core';
import {
    ICommunication,
    CommunicationStatuses,
    CommunicationHandler,
    CommunicationFactory,
    CommandVerbs
} from '../../duuzra_types/network';
import { IMediaDocumentDetails, IGetMediaDocument } from '../../duuzra_types/media';
import { MediaService } from "../../duuzras/index";

export class DeleteMediaHandler extends ServiceBaseHandler<any> {
    private mediaService: MediaService;

    constructor() {
        super();
        this.mediaService = new MediaService();
    }
    public async processCommunication(communication: ICommunication<any>): Promise<ICommunication<any>> {
        console.log("delete-media.handler.ts ProcessCommunication()");
        let response: any;
        let status: CommunicationStatuses;

        try {
            await this.verifyToken(communication.head.authToken);
        } catch (e) {
            console.error('ERROR:', e);
            return Promise.reject<ICommunication<any>>(
                CommunicationFactory.createResponse(communication, CommunicationStatuses.Forbidden, null, e.message)
            );
        }

        try {
            switch (communication.head.verb) {
                case CommandVerbs.post:
                case CommandVerbs.put:
                    response = await this.mediaService.delete(communication.head.authToken, communication.head.correlationId, communication.body, communication.head.parameters['uuid']);
                    break;
                default:
                    break;
            }
        } catch (err) {
            return Promise.reject<ICommunication<any>>(
                CommunicationFactory.createResponse(communication, CommunicationStatuses.Error, null, err)
            );
        }

        // fire the results down the pipe to the client
        return Promise.resolve(
            CommunicationFactory.createResponse(communication, status, null, true)
        );
    }
}

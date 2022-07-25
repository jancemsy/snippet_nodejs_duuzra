import {
    ICommunication,
    CommunicationStatuses,
    CommunicationHandler,
    CommunicationFactory,
    CommandVerbs
} from '../../duuzra_types/network';
import { DocumentService } from "../document/document.service";

export class GetDocumentsHandler implements CommunicationHandler {
    private documentService: DocumentService;

    constructor() {
        this.documentService = new DocumentService();
    }

    public async processCommunication(communication: ICommunication<any>): Promise<ICommunication<any>> {
        console.log("get-document.handler.ts ProcessCommunication()");
        let response: any;
        let status: CommunicationStatuses;

        try {
            switch (communication.head.verb) {
                case CommandVerbs.get:
                    // response = await this.documentService.getDocuments(communication.body);
                    break;
                default:
                    break;
            }
        } catch (err) {
            return Promise.reject<ICommunication<any>>(
                CommunicationFactory.createResponse(communication, CommunicationStatuses.Error, null, err.message)
            );
        }

        // fire the results down the pipe to the client
        return Promise.resolve(
            CommunicationFactory.createResponse(communication, status, null, response)
        );
    }
}

import {
    ICommunication,
    CommunicationStatuses,
    CommunicationHandler,
    CommunicationFactory,
    CommandVerbs
} from '../../duuzra_types/network';
import { DocumentService } from '../document/document.service';
import { ServiceBaseHandler } from '../../core';

export class CSVDocumentHandler extends ServiceBaseHandler<any> {
    private documentService: DocumentService;

    constructor() {
        super();
        this.documentService = new DocumentService();
    }

    public async processCommunication(communication: ICommunication<any>): Promise<ICommunication<any>> {
        console.log("csv-user.handler.ts ProcessCommunication()");

        let body = communication.body;
        let response: any;
        let status: CommunicationStatuses;
        let token = '';

        if (communication.head.verb === CommandVerbs.post) {
            token = communication.body.token;
        } else {
            token = communication.head.authToken;
        }

        try {
            await this.verifyToken(token);
            let userId = super.extractTokenUserId();
        } catch (e) {
            console.error('ERROR:', e);
            return Promise.resolve(
                CommunicationFactory.createResponse(communication, CommunicationStatuses.Forbidden, null, [])
            );
        }

        try {
            switch (communication.head.verb) {
                case CommandVerbs.post:
                case CommandVerbs.put:
                    response = await this.documentService.uploadCsvForUsers(token, null, this.myExtractedToken.sub, body.duuzraId, body.file, this.myExtractedToken.sub.email);
                    break;
                case CommandVerbs.get:
                    response = await this.documentService.getExampleCsv();
                    break;
                default:
                    break;
            }
        } catch (err) {
            return Promise.resolve(
                CommunicationFactory.createResponse(communication, CommunicationStatuses.Error, null, [])
            );
        }

        // fire the results down the pipe to the client
        return Promise.resolve(
            CommunicationFactory.createResponse(communication, status, null, response)
        );
    }
}

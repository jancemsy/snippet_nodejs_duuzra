import { ServiceBaseHandler } from '../../core';
import {
    ICommunication,
    CommunicationStatuses,
    CommunicationHandler,
    CommunicationFactory,
    CommandVerbs
} from '../../duuzra_types/network';
import { IMediaDocumentDetails, IGetMediaDocument } from '../../duuzra_types/media';
import { DocumentService } from '../../media/document/document.service';

export class DocumentHandler extends ServiceBaseHandler<any> {
    private documentService: DocumentService;

    constructor() {
        super();
        this.documentService = new DocumentService();
    }
    public async processCommunication(communication: ICommunication<any>): Promise<ICommunication<any>> {
        console.log("document.handler.ts ProcessCommunication()");
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
                    response = await this.documentService.saveDocument(
                        communication.head.authToken,
                        communication.head.correlationId,
                        this.myExtractedToken.sub,
                        communication.body.duuzraUuid,
                        communication.body.media as IMediaDocumentDetails,
                        communication.body.isAdHoc);
                    break;
                case CommandVerbs.get:
                    response = await this.documentService.getDocument(communication.body as IGetMediaDocument);
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
            CommunicationFactory.createResponse(communication, status, null, response)
        );
    }
}

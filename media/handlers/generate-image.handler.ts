import { ServiceBaseHandler } from '../../core';
import {
    ICommunication,
    CommunicationStatuses,
    CommunicationHandler,
    CommunicationFactory,
    CommandVerbs
} from '../../duuzra_types/network';
import { IMediaDocumentDetails, IGetMediaDocument } from '../../duuzra_types/media';

import { ImageService } from "../index";

export class GenerateImageHandler extends ServiceBaseHandler<any> {
    private imageService: ImageService;

    constructor() {
        super();
        this.imageService = new ImageService();
    }

    public async processCommunication(communication: ICommunication<any>): Promise<ICommunication<any>> {
        console.log("generate-image.handler.ts ProcessCommunication()");
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
                    response = await this.imageService.generateImages(
                        communication.head.authToken,
                        communication.head.correlationId,
                        this.myExtractedToken.sub,
                        communication.body.duuzraUuid,
                        communication.body.media,
                        communication.body.croppedImage,
                        communication.body.autoCrop,
                        communication.body.isAdHoc
                    );
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
            CommunicationFactory.createResponse(communication, status, null, response)
        );
    }
}

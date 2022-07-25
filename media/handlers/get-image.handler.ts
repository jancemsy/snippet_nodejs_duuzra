import { ServiceBaseHandler } from '../../core';
import {
    ICommunication,
    CommunicationStatuses,
    CommunicationHandler,
    CommunicationFactory,
    CommandVerbs
} from '../../duuzra_types/network';
import { ImageService } from '../../media/image/image.service';

export class GetImageHandler extends ServiceBaseHandler<any> {
    private imageService: ImageService;

    constructor() {
        super();
        this.imageService = new ImageService();
    }

    public async processCommunication(communication: ICommunication<any>): Promise<ICommunication<any>> {
        console.log("get-image.handler.ts ProcessCommunication()");
        let response: any;
        let status: CommunicationStatuses;

        try {
            await this.verifyToken(communication.head.authToken);
        } catch (e) {
            console.error('ERROR:', e);
            return Promise.resolve<ICommunication<any>>(
                CommunicationFactory.createResponse(communication, CommunicationStatuses.Forbidden, null, e.message)
            );
        }

        try {
            switch (communication.head.verb) {
                case CommandVerbs.post:
                    response = await this.imageService.getConvertedImage(communication.body);
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

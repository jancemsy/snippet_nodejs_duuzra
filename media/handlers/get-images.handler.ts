import {
    ICommunication,
    CommunicationStatuses,
    CommunicationHandler,
    CommunicationFactory,
    CommandVerbs
} from '../../duuzra_types/network';
import { ImageService } from '../../media/image/image.service';

export class GetImagesHandler implements CommunicationHandler {
    private imageService: ImageService;

    constructor() {
        this.imageService = new ImageService();
    }

    public async processCommunication(communication: ICommunication<any>): Promise<ICommunication<any>> {
        console.log("get-images.handler.ts ProcessCommunication()");
        let response: any;
        let status: CommunicationStatuses;

        try {
            switch (communication.head.verb) {
                case CommandVerbs.get:
                    // response = await this.imageService.getImages(communication.body);
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

import {
    ICommunication,
    CommunicationStatuses,
    CommunicationHandler,
    CommunicationFactory,
    CommandVerbs
} from '../../duuzra_types/network';
import { VideoService } from '../../media/video/video.service';

export class GetVideoHandler implements CommunicationHandler {
    private videoService: VideoService;

    constructor() {
        this.videoService = new VideoService();
    }

    public async processCommunication(communication: ICommunication<any>): Promise<ICommunication<any>> {
        console.log("get-video.handler.ts ProcessCommunication()");
        let response: any;
        let status: CommunicationStatuses;

        try {
            switch (communication.head.verb) {
                case CommandVerbs.post:
                    response = await this.videoService.getVideo(communication.body.docId);
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

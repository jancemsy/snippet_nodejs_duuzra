import {
    ICommunication,
    CommunicationStatuses,
    CommunicationHandler,
    CommunicationFactory,
    CommandVerbs
} from '../../duuzra_types/network';
import { VideoService } from "../video/video.service";

export class GetVideosHandler implements CommunicationHandler {
    private videoService: VideoService;

    constructor() {
        this.videoService = new VideoService();
    }

    public async processCommunication(communication: ICommunication<any>): Promise<ICommunication<any>> {
        console.log("get-videos.handler.ts ProcessCommunication()");
        let response: any;
        let status: CommunicationStatuses;

        try {
            switch (communication.head.verb) {
                case CommandVerbs.get:
                    // response = await this.videoService.getVideos(communication.body);
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

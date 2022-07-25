import { ServiceBaseHandler } from '../../core';
import {
    ICommunication,
    CommunicationStatuses,
    CommunicationHandler,
    CommunicationFactory,
    CommandVerbs
} from '../../duuzra_types/network';
import { IMediaDocumentDetails, IGetMediaDocument } from '../../duuzra_types/media';
import { VideoService } from '../../media/video/video.service';

export class GenerateVideoHandler extends ServiceBaseHandler<any> {
    private videoService: VideoService;

    constructor() {
        super();
        this.videoService = new VideoService();
    }

    public async processCommunication(communication: ICommunication<any>): Promise<ICommunication<any>> {
        console.log("generate-video.handler.ts ProcessCommunication()");
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
                    response = await this.videoService.generateVideo(
                        communication.head.authToken,
                        communication.head.correlationId,
                        this.myExtractedToken.sub,
                        communication.body.duuzraUuid,
                        communication.body.media as IMediaDocumentDetails,
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

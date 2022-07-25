import { IServiceBusNode, ServiceBus, ServiceBusQueues } from '../duuzra_types/network';
import { GenerateImageHandler } from './handlers/generate-image.handler';
import { GenerateVideoHandler } from './handlers/generate-video.handler';
import { GetImageHandler } from './handlers/get-image.handler';
import { GetVideoHandler } from './handlers/get-video.handler';
import { PresentationHandler } from './handlers/presentation.handler';
import { DocumentHandler } from './handlers/document.handler';
import { CSVDocumentHandler } from './handlers/csv-user.handler';
import { DeleteMediaHandler } from "./handlers/delete-media.handler";

export class MediaNode implements IServiceBusNode {
    /**
     * Gets the name of this service node
     */
    public readonly name = 'media';

    /**
     * Allows the node to configure any subscriptions it might need
     */
    public registerSubscriptions(bus: ServiceBus): void {
        // register the queue handlers

        // image
        // TODO: Change generateImages to uploadImage
        bus.subscribe(ServiceBusQueues.mediaNode.generateImages, new GenerateImageHandler());
        bus.subscribe(ServiceBusQueues.mediaNode.getImageSize, new GetImageHandler());

        bus.subscribe(ServiceBusQueues.mediaNode.generateVideos, new GenerateVideoHandler());
        bus.subscribe(ServiceBusQueues.mediaNode.getVideoSize, new GetVideoHandler());

        // document
        bus.subscribe(ServiceBusQueues.mediaNode.uploadPresentation, new PresentationHandler());
        bus.subscribe(ServiceBusQueues.mediaNode.getPresentation, new PresentationHandler());

        bus.subscribe(ServiceBusQueues.mediaNode.uploadDocument, new DocumentHandler());
        bus.subscribe(ServiceBusQueues.mediaNode.getDocument, new DocumentHandler());

        bus.subscribe(ServiceBusQueues.mediaNode.uploadCsv, new CSVDocumentHandler());
        bus.subscribe(ServiceBusQueues.mediaNode.downloadExampleCsv, new CSVDocumentHandler());
        bus.subscribe(ServiceBusQueues.mediaNode.deleteMedia, new DeleteMediaHandler());
    }
}

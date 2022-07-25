
import * as express from 'express';
import * as path from 'path';
import {
    CommandTypes,
    ICommunication,
    ServiceBusQueues,
    CommunicationStatuses,
    CommunicationFactory,
    CommandVerbs,
} from '../duuzra_types/network';
import { System } from '../shared';
import { DuuzraRouteHandler } from '../shared/security/route.handler';
import { HttpChannelController } from './http-channel.controller';
import { CommunicationMapper } from '../shared/network/communication.mapper';
import { IGetMediaImage, IMediaDocumentDetails, IGetMediaDocument, IGetMediaVideo, ICroppedImage } from '../duuzra_types/media';

/**
 * This acts as a central router for incoming web socket requests on the master channel.
 * The requests will ultimately be handled by specific controllers and session handlers.
 */
export class MediaChannelController extends HttpChannelController {

    private readonly presentationFileTypes: string[] = [
        '.gslides',
        '.odp',
        '.pptx',
        '.ppt'
    ];

    private readonly documentFileTypes: string[] = [
        '.pdf',
        '.doc',
        '.docx',
        '.odt',
        '.xlk',
        '.xls',
        '.xlsb',
        '.xlsm',
        '.xlsx',
        '.xlsb',
        '.xlsm',
        '.xlsx',
        '.xlr',
        '.xlt',
        '.xlm',
        '.xlw',
        '.txt'
    ];

    constructor(routeHandler: DuuzraRouteHandler) {
        // configure the base class
        super('media', routeHandler.router);

        this.router.post(`/${this.channel}/uploadFile`, this.uploadFile);
        this.router.post(`/${this.channel}/deleteMedia`, this.deleteMedia);

        this.router.post(`/${this.channel}/uploadImage`, this.uploadImage);
        this.router.get(`/${this.channel}/getImage/:imageId/:resolution`, this.getImage);

        this.router.post(`/${this.channel}/uploadVideo`, this.uploadVideo);
        this.router.get(`/${this.channel}/getVideo/:videoId`, this.getVideo);

        this.router.post(`/${this.channel}/uploadPresentation`, this.uploadPresentation);
        this.router.post(`/${this.channel}/uploadDocument`, this.uploadDocument);

        this.router.get(`/${this.channel}/getDocument/:documentId`, this.getDocument);
        this.router.get(`/${this.channel}/getPresentation/:presentationId`, this.getPresentation);

        this.router.post(`/${this.channel}/uploadCsv`, this.uploadCsv);
        this.router.get(`/${this.channel}/downloadExampleCsv`, this.downloadExampleCsv);
    }

    /**
     * Processes an inbound communication on the cms channel
     */
    protected async processCommunication(/*stream: CommunicationsStream<any>,*/ communication: ICommunication<any>): Promise<ICommunication<any>> {  
        console.log("media-channel.controller",communication.head.command); 
        let response: ICommunication<any>; 
        let command: CommandTypes = communication.head.command as CommandTypes;

        // push the command to the relevant queue
        switch (command) {

            case CommandTypes.media.generateImages:
                response = await System.serviceBus.sendToQueue(ServiceBusQueues.mediaNode.generateImages, communication);
                break;
            case CommandTypes.media.generateVideos:
                response = await System.serviceBus.sendToQueue(ServiceBusQueues.mediaNode.generateVideos, communication);
                break;
            case CommandTypes.media.getImageSize:
                response = await System.serviceBus.sendToQueue(ServiceBusQueues.mediaNode.getImageSize, communication);
                break;
            case CommandTypes.media.getVideoSize:
                response = await System.serviceBus.sendToQueue(ServiceBusQueues.mediaNode.getVideoSize, communication);
                break;
            case CommandTypes.media.uploadPresentation:
                response = await System.serviceBus.sendToQueue(ServiceBusQueues.mediaNode.uploadPresentation, communication);
                break;
            case CommandTypes.media.uploadDocument:
                response = await System.serviceBus.sendToQueue(ServiceBusQueues.mediaNode.uploadDocument, communication);
                break;
            case CommandTypes.media.getDocument:
                response = await System.serviceBus.sendToQueue(ServiceBusQueues.mediaNode.getDocument, communication);
                break;
            case CommandTypes.media.getPresentation:
                response = await System.serviceBus.sendToQueue(ServiceBusQueues.mediaNode.getPresentation, communication);
                break;
            case CommandTypes.media.uploadCsv:
                response = await System.serviceBus.sendToQueue(ServiceBusQueues.mediaNode.uploadCsv, communication);
                break;
            case CommandTypes.media.downloadExampleCsv:
                response = await System.serviceBus.sendToQueue(ServiceBusQueues.mediaNode.downloadExampleCsv, communication);
                break;
            case CommandTypes.media.getImages:
                response = await System.serviceBus.sendToQueue(ServiceBusQueues.mediaNode.getImages, communication);
                break;
            case CommandTypes.media.getVideos:
                response = await System.serviceBus.sendToQueue(ServiceBusQueues.mediaNode.getVideos, communication);
                break;
            case CommandTypes.media.getDocuments:
                response = await System.serviceBus.sendToQueue(ServiceBusQueues.mediaNode.getDocuments, communication);
                break;
            case CommandTypes.media.getPresentations:
                response = await System.serviceBus.sendToQueue(ServiceBusQueues.mediaNode.getDocuments, communication);
                break;
            case CommandTypes.media.deleteMedia:
                response = await System.serviceBus.sendToQueue(ServiceBusQueues.mediaNode.deleteMedia, communication);
                break;
            default:
                response = CommunicationFactory.createResponse(communication, CommunicationStatuses.UnknownCommand);
                break;

        }

        return Promise.resolve(response);
    }

    public uploadFile = (req: express.Request, res: express.Response) => {
        if (req.file && req.file.path && req.file.originalname) {
            let mediaType = this.mapReqToMediaType(req); 
            if (!mediaType) {
                return res
                    .status(500)
                    .json('The provided file type is not supported.');
            }
            switch (mediaType) {
                case 'image':
                    return this.uploadImage(req, res);
                case 'video':
                    return this.uploadVideo(req, res);
                case 'document':
                    return this.uploadDocument(req, res);
                case 'presentation':
                default:
                    return this.uploadPresentation(req, res);
            }
        }
        return res
            .status(500)
            .json('The uploaded file was not received.');
    };

    private mapReqToMediaType(req: express.Request) {
        let file = req.file;
        let fileMimeType = req.file.mimetype;
        let fileExt = path.extname(req.file.originalname); 

        if (fileMimeType.indexOf('video') !== -1) { 
            return 'video';
        } else if (fileMimeType.indexOf('image') !== -1) { 
            return 'image';
        } else if (this.presentationFileTypes.indexOf(fileExt) !== -1) { 
            return 'presentation';
        } else if (this.documentFileTypes.indexOf(fileExt) !== -1) { 
            return 'document';
        }

        return null;
    }

    public uploadImage = (req: express.Request, res: express.Response) => {
        let auth: string = '';
        let duuzraUuid: string = '';
        let autoCrop: boolean = false;
        let deviceId: string = '';
        let isAdHoc: boolean = false;
        let mediaDetails: IMediaDocumentDetails = this.mapBodyToMediaDetails(req);

        if (mediaDetails && mediaDetails.path) {
            auth = req.body.auth;
            duuzraUuid = req.body.duuzraUuid;
            isAdHoc = req.body.isAdHoc;
            autoCrop = req.body.autoCrop;
            let croppedImageDetails: ICroppedImage = {
                croppedZoomLevel: req.body.croppedImageZoomLevel,
                croppedHeight: req.body.croppedImageHeight,
                croppedWidth: req.body.croppedImageWidth,
                croppedOffsetX: req.body.croppedImageOffsetX,
                croppedOffsetY: req.body.croppedImageOffsetY
            };

            let communication: ICommunication<any>
                = CommunicationMapper.mapToObj(deviceId, auth, CommandTypes.media.generateImages, {
                    autoCrop,
                    duuzraUuid,
                    media: mediaDetails,
                    isAdHoc: isAdHoc,
                    croppedImage: croppedImageDetails
                }, CommandVerbs.post);

            this.processHttp(communication).then((response: ICommunication<any>) => {
                res
                    .status(201)
                    .json(response);
            }).catch((err) => {
                res
                    .status(500)
                    .json(err);
            });
        }
    };

    public deleteMedia = (req: express.Request, res: express.Response) => {
        let auth: string = '';
        let deviceId: string = '';
        let mediaUuid = req.body.mediaUuid;

        if (mediaUuid) {
            auth = req.body.auth;

            let communication: ICommunication<any>
                = CommunicationMapper.mapToObj(deviceId, auth, CommandTypes.media.deleteMedia, mediaUuid, CommandVerbs.post);

            this.processHttp(communication).then((response: ICommunication<any>) => {
                res
                    .status(201)
                    .json(response);
            }).catch((err) => {
                res
                    .status(500)
                    .json(err);
            });
        }
    };

    private mapBodyToMediaDetails(req: express.Request): IMediaDocumentDetails {
        if (req.file && req.file.path && req.file.originalname) {

            let file_path: string = req.file.path;
            let file_originalName: string = req.file.originalname;

            let provided_name: string = req.body.name;
            let provided_description: string = req.body.description;

            let mediaDetails: IMediaDocumentDetails = {
                description: provided_description,
                name: provided_name,
                originalName: file_originalName,
                path: file_path
            };
            return mediaDetails;
        }
        return null;
    }

    public getImage = (req: express.Request, res: express.Response) => {
        let auth: string = '';
        let deviceId: string = '';

        if (req.params.imageId && req.params.resolution !== null) {
            let body: IGetMediaImage = {
                docId: req.params.imageId,
                resolution: req.params.resolution,
            };
            auth = req.headers['x-auth'] ? req.headers['x-auth'].toString() : null;

            // TODO: Need to change this to get type
            let communication: ICommunication<any>
                = CommunicationMapper.mapToObj(deviceId, auth, CommandTypes.media.getImageSize, body, CommandVerbs.post);

            this.processHttp(communication).then((response: ICommunication<any>) => {
                res
                    .status(200)
                    .json(response);
            }).catch((err) => {
                res
                    .status(500)
                    .json(err);
            });
        }
    };

    public getVideo = (req: express.Request, res: express.Response) => {
        let auth: string = '';
        let deviceId: string = '';
        let mediaUuid: string = req.params.videoId;
        if (mediaUuid) {
            auth = req.headers['x-auth'] ? req.headers['x-auth'].toString() : null;
            let body: IGetMediaVideo = {
                docId: mediaUuid,
                videoType: parseInt(req.body.videoType, null),
            };

            // TODO: Need to change this to get type
            let communication: ICommunication<any>
                = CommunicationMapper.mapToObj(deviceId, auth, CommandTypes.media.getVideoSize, body, CommandVerbs.post);

            this.processHttp(communication).then((response: ICommunication<any>) => {
                res
                    .status(200)
                    .json(response);
            }).catch((err) => {
                res
                    .status(500)
                    .json(err);
            });
        }
    };

    public uploadVideo = (req: express.Request, res: express.Response) => {
        let auth: string = '';
        let deviceId: string = '';
        let duuzraUuid: string;
        let isAdHoc: boolean = false;
        let mediaDetails: IMediaDocumentDetails = this.mapBodyToMediaDetails(req);

        if (mediaDetails && mediaDetails.path) {
            auth = req.body.auth;
            duuzraUuid = req.body.duuzraUuid;
            isAdHoc = req.body.isAdHoc;
            let communication: ICommunication<any>
                = CommunicationMapper.mapToObj(deviceId, auth, CommandTypes.media.generateVideos, {
                    media: mediaDetails,
                    duuzraUuid: duuzraUuid,
                    isAdHoc: isAdHoc,
                }, CommandVerbs.post);

            this.processHttp(communication).then((response: ICommunication<any>) => {
                res
                    .status(201)
                    .json(response);
            }).catch((err) => {
                res
                    .status(500)
                    .json(err);
            });
        }
    };

    public uploadDocument = (req: express.Request, res: express.Response) => {
        let auth: string = '';
        let deviceId: string = '';
        let duuzraUuid: string = '';
        let isAdHoc: boolean = false;
        let mediaDetails: IMediaDocumentDetails = this.mapBodyToMediaDetails(req);

        if (mediaDetails && mediaDetails.path) {
            auth = req.body.auth;
            duuzraUuid = req.body.duuzraUuid;
            isAdHoc = req.body.isAdHoc;
            let communication: ICommunication<any> =
                CommunicationMapper.mapToObj(deviceId, auth, CommandTypes.media.uploadDocument, {
                    media: mediaDetails,
                    duuzraUuid: duuzraUuid,
                    isAdHoc: isAdHoc,
                }, CommandVerbs.post);

            this.processHttp(communication).then((response: ICommunication<any>) => {
                res
                    .status(201)
                    .json(response);
            }).catch((err) => {
                res
                    .status(500)
                    .json(err);
            });
        }
    }

    public getPresentation = (req: express.Request, res: express.Response) => {
        let auth: string = '';
        let deviceId: string = '';
        let mediaUuid: string = req.params.presentationId;
        if (mediaUuid) {
            auth = req.headers['x-auth'] ? req.headers['x-auth'].toString() : null;
            let body: IGetMediaDocument = {
                docId: mediaUuid
            };

            let communication: ICommunication<any> =
                CommunicationMapper.mapToObj(deviceId, auth, CommandTypes.media.getPresentation, body, CommandVerbs.get);

            this.processHttp(communication).then((response: ICommunication<any>) => {
                res
                    .status(201)
                    .json(response);
            }).catch((err) => {
                res
                    .status(500)
                    .json(err);
            });
        } else {
            res.json({
                message: 'Please check params for getPresentation',
            });
        }
    }

    public uploadPresentation = (req: express.Request, res: express.Response) => {
        let auth: string = '';
        let deviceId: string = '';
        let isAdHoc: boolean = false;
        let mediaDetails: IMediaDocumentDetails = this.mapBodyToMediaDetails(req);
        let duuzraUuid: string;
        if (mediaDetails && mediaDetails.path) {
            auth = req.body.auth;
            duuzraUuid = req.body.duuzraUuid;
            isAdHoc = req.body.isAdHoc;
            let communication: ICommunication<any>
                = CommunicationMapper.mapToObj(deviceId, auth, CommandTypes.media.uploadPresentation, {
                    media: mediaDetails,
                    duuzraUuid: duuzraUuid,
                    isAdHoc: isAdHoc,
                }, CommandVerbs.post);

            this.processHttp(communication).then((response: ICommunication<any>) => {
                res
                    .status(201)
                    .json(response);
            }).catch((err) => {
                res
                    .status(500)
                    .json(err);
            });
        }
    }

    public getDocument = (req: express.Request, res: express.Response) => {
        let auth: string = '';
        let deviceId: string = '';
        let mediaUuid: string = req.params.documentId;
        if (mediaUuid) {
            auth = req.headers['x-auth'] ? req.headers['x-auth'].toString() : null;
            let body: IGetMediaDocument = {
                docId: mediaUuid
            };

            let communication: ICommunication<any> =
                CommunicationMapper.mapToObj(deviceId, auth, CommandTypes.media.getDocument, body, CommandVerbs.get);

            this.processHttp(communication).then((response: ICommunication<any>) => {
                res
                    .status(201)
                    .json(response);
            }).catch((err) => {
                res
                    .status(500)
                    .json(err);
            });
        } else {
            res.json({
                message: 'Please check params for getDocument',
            });
        }
    }

    public uploadCsv = (req: express.Request, res: express.Response) => {
        let auth: string = '';
        let deviceId: string = '';

        if (req.query.duuzraId && req.query.token && req.file) {
            let model = {
                duuzraId: req.query.duuzraId,
                token: req.query.token,
                file: req.file,
            };

            let communication: ICommunication<any> =
                CommunicationMapper.mapToObj(deviceId, auth, CommandTypes.media.uploadCsv, model, CommandVerbs.post);

            this.processHttp(communication).then((response: ICommunication<any>) => {
                res
                    .status(201)
                    .json(response);
            }).catch((err) => {
                res
                    .status(500)
                    .json(err);
            });
        } else {
            res.json({
                message: 'Please check params for uploadCsv',
            });
        }
    }

    public downloadExampleCsv = (req: express.Request, res: express.Response) => {
        let auth: string = req.header('x-auth');
        let deviceId: string = '';

        let communication: ICommunication<any> =
            CommunicationMapper.mapToObj(deviceId, auth, CommandTypes.media.downloadExampleCsv, null, CommandVerbs.get);

        this.processHttp(communication).then((response: ICommunication<any>) => {
            res
                .status(201)
                .json(response);
        }).catch((err) => {
            res
                .status(500)
                .json(err);
        });

    }
}

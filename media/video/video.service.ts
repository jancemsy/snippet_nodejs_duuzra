import * as gm from 'gm';
import { VideoRepository } from './video.repository';
import {
    IMediaDetails,
    IMediaDimensions,
    MediaOrientation,
} from '../../duuzra_types/media';
import * as fs from 'fs';
import uuid = require('uuid/v1');
import { IMediaStorageDetail, IMediaResponse, IGetMediaImage, ResolutionFilter, IOptimizeVideo, IGetMediaVideo, IMediaDocumentDetails, IMediaVideoStorageDetail, IGenerateMedia, MediaVideoDto } from '../../duuzra_types/media';
import { IKeyValuePair } from '../../duuzra_types/common';
import { IMediaVideoDoc } from '../../models/media-video-doc';
import { MediaVideoMapper } from './mappers/video.mapper';
import * as ffmpeg from 'fluent-ffmpeg';
import { IMediaService, MediaService } from "../../duuzras/index";
import { IDuuzraMediaDto } from '../../duuzra_types/duuzras';
import { IDuuzraTokenPayload } from '../../duuzra_types/security';
import { IMediaImageDoc } from '../../models/media-image-doc';
import { MediaServiceBase } from '../../shared/index';
import { DocumentConfig } from "../../document.config";

export abstract class IVideoService {
}

export class VideoService extends MediaServiceBase implements IVideoService {
    private videoRepo: VideoRepository;
    private fileSavePath: string = 'uploads/';
    private mediaService: IMediaService;

    constructor() {
        super();
        this.videoRepo = new VideoRepository();
        this.mediaService = new MediaService();

        if (DocumentConfig.ffmpegPath !== '') {
            (ffmpeg as any).setFfmpegPath(DocumentConfig.ffmpegPath);
        }
        if (DocumentConfig.ffprobePath !== '') {
            (ffmpeg as any).setFfprobePath(DocumentConfig.ffprobePath);
        }
    }

    public async getVideo(mediaUuid: uuid): Promise<IMediaVideoDoc> {
        console.log("video.service.ts getVideo()");
        let mediaDoc;

        await this.videoRepo.getVideoById(mediaUuid).then((videoDoc: IMediaVideoDoc) => {
            mediaDoc = videoDoc;
        });

        return mediaDoc;
    }

    public async getConvertedVideo(model: IGetMediaVideo): Promise<IMediaStorageDetail> {
        console.log("video.service.ts getConvertedVideo()");
        let convertedImage;

        await this.videoRepo.getVideoById(model.docId).then((videoDoc: IMediaVideoDoc) => {
            convertedImage = this.getConvertedSize(videoDoc, model.videoType);
        });

        return convertedImage;
    }

    private getConvertedSize(doc: IMediaVideoDoc, filter: ResolutionFilter): IMediaStorageDetail {
        console.log("video.service.ts getConvertedSize()");
        let array: IMediaStorageDetail[] = [];
        let resolutions: IMediaDimensions = this.getResolutions(filter);

        for (let property in doc.converted) {
            if (doc.converted.hasOwnProperty(property)) {
                array.push(doc.converted[property]);
            }
        }

        let getConvertVideo = array.filter((media: IMediaDimensions) => {
            return resolutions.height === media.height && resolutions.width === media.width;
        });

        if (getConvertVideo && getConvertVideo.length >= 1) {
            return getConvertVideo[0];
        } else {

            let getClosesImage = array.filter((media: IMediaDimensions) => {
                return media.height > resolutions.height && media.width > resolutions.width;
            });

            if (getClosesImage.length > 0) {
                return getClosesImage[0];
            } else {
                return doc.original;
            }
        }
    }

    public optimizeVideo(inputFilePath: string, format: string, filter?: ResolutionFilter): Promise<IOptimizeVideo> {
        console.log("video.service.ts optimizeVideo()");
        return new Promise<IOptimizeVideo>((resolve, reject) => {
            const filename: string = this.fileSavePath + uuid();
            const screenshotPath: string = `${filename}.jpg`;
            const outputFilePath: string = `${filename}.mp4`;
            const inputFullFilePath: string = this.getAbsoluteFilePath(inputFilePath);
            const screenshotFullPath: string = this.getAbsoluteFilePath(screenshotPath);
            const outputFullFilePath: string = this.getAbsoluteFilePath(outputFilePath);
            try {
                ffmpeg(inputFullFilePath)
                    .videoCodec('libx264')
                    .on('error', (err) => {
                        // Couldn't convert, use source file
                        reject(err);
                    })
                    .on('end', () => {
                        ffmpeg(outputFullFilePath)
                            .screenshots({
                                count: 1,
                                filename: screenshotPath
                            })
                            .on('end', () => {
                                resolve({
                                    videoFilePath: outputFilePath,
                                    thumbnailFilePath: screenshotPath
                                });
                            })
                            .on('error', (err) => {
                                reject(err);
                            });
                    })
                    .save(outputFullFilePath);
            } catch (err) {
                reject(err);
            }
        });
    }

    public async convertToResolution(inputFilePath: string, filter: ResolutionFilter, details: IMediaDetails): Promise<IOptimizeVideo> {
        console.log("video.service.ts convertToResolution()");
        return new Promise<IOptimizeVideo>((resolve, reject) => {
            let filename = this.fileSavePath + uuid();
            let outputFilePath = filename + '.mp4';
            let fullOutputFilePath = this.getAbsoluteFilePath(outputFilePath);
            let thumbnailFilePath = filename + '.jpg';
            let dimensions = this.getResolutions(filter, details);
            let outputResolution = dimensions.width + 'x' + dimensions.height;
            let fullFilePath = this.getAbsoluteFilePath(inputFilePath);
            try {
                if (details.height > dimensions.height && details.width > dimensions.width) {
                    ffmpeg(fullFilePath)
                        .screenshots({
                            count: 1,
                            filename: thumbnailFilePath,
                            size: outputResolution,
                        })
                        .size(outputResolution)
                        .on('progress', (val) => { 
                        })
                        .on('end', () => {
                            resolve({
                                videoFilePath: outputFilePath,
                                thumbnailFilePath: thumbnailFilePath
                            });
                        })
                        .on('error', (err) => {
                            reject(err);
                        })
                        .save(fullOutputFilePath);
                } else {
                    reject('Source video resolution is lower than the provided resolution filter.');
                }
            } catch (err) {
                reject('image is too small for this size. ' + filter.toString());
            }
        });
    }

    private getResolutions(filter: ResolutionFilter, details?: IMediaDetails): IMediaDimensions {

        let width;
        let height;
        let resolutionFilter: ResolutionFilter = filter as ResolutionFilter;
        switch (filter) {
            case ResolutionFilter.SmallPhone:
                width = 1080;
                height = 1920;
                break;
            case ResolutionFilter.LargePhone:
                width = 1536;
                height = 2048;
                break;
            case ResolutionFilter.SmallTablet:
                width = 768;
                height = 1024;
                break;
            case ResolutionFilter.LargeTablet:
                width = 1536;
                height = 2048;
                break;
            case ResolutionFilter.LargeDesktop:
                width = 3840;
                height = 2160;
                break;
            default:
                break;
        }
        if (details) {
            if (details.orientation === MediaOrientation.Landscape) {
                let currentHeight = height;
                let currentWidth = width;

                height = currentHeight;
                width = currentWidth;
            }
        }

        return {
            height: height,
            width: width,
        };
    }

    private async renameWithExtension(uploadedFilePath: string, originalFileName: string): Promise<string> {
        console.log("video.service.ts renameWithExtension()");
        return new Promise<string>((resolve, reject) => {
            const fragments: string[] = originalFileName.split('.');
            const originalFileExtension: string = fragments[fragments.length - 1];
            const renameTo: string = `${uploadedFilePath}.${originalFileExtension}`;
            fs.rename(uploadedFilePath, renameTo, (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(renameTo);
            });
        });
    }

    public async generateVideo(token: string, correlationId: string, tokenPayload: IDuuzraTokenPayload, duuzraUuid: string, model: IMediaDocumentDetails, isAdHoc: boolean): Promise<MediaVideoDto> {
        console.log("video.service.ts generateVideo()");
        let mediaDetails: IMediaDetails;
        model.path = await this.renameWithExtension(model.path, model.originalName);
        let details: IMediaDetails = await this.getVideoMediaDetails(model.path).catch((err) => {
            console.error(err);
            return Promise.reject(err);
        });
        mediaDetails = details;

        let optimizedVideoPath: string;
        let optimizedThumbnailPath: string;
        let resolutionVideoConversions: IKeyValuePair<IMediaVideoStorageDetail> = {};
        let mediaVideoDto: MediaVideoDto;
        let videoId: string;

        let optimizedVideoResult: IOptimizeVideo = await this.optimizeVideo(model.path, mediaDetails.format).catch((err) => {
            console.error(err);
            return Promise.reject(err);
        });
        optimizedVideoPath = optimizedVideoResult.videoFilePath;
        optimizedThumbnailPath = optimizedVideoResult.thumbnailFilePath;

        for (let i = 0; i <= 6; i++) {
            let resolutionSize: ResolutionFilter = i as ResolutionFilter;
            let failed: boolean = false;
            let convertedFileResult: IOptimizeVideo = await this.convertToResolution(optimizedVideoPath, resolutionSize, mediaDetails).catch((err) => { 
                failed = true;
            });
            if (failed) {
                continue;
            }
            let imageDetails: IMediaDetails = await this.getVideoMediaDetails(convertedFileResult.videoFilePath).catch((err) => {
                console.error(err);
                failed = true;
            });
            if (failed) {
                continue;
            }
            let size: any = this.getResolutions(resolutionSize, mediaDetails);
            let resolution = size.height + 'x' + size.width;

            resolutionVideoConversions[resolution] = {
                height: size.height,
                path: convertedFileResult.videoFilePath,
                width: size.width,
                thumbnailPath: convertedFileResult.thumbnailFilePath,
                isAdHoc: isAdHoc
            };
        }

        let doc: IMediaVideoDoc = MediaVideoMapper.map(resolutionVideoConversions, {
            height: mediaDetails.height,
            path: optimizedVideoPath,
            width: mediaDetails.width,
            thumbnailPath: optimizedThumbnailPath,
            isAdHoc: isAdHoc
        }, mediaDetails.format, model.description, model.name, model.originalName, null, isAdHoc);

        let videoSaved: IMediaVideoDoc = await this.videoRepo.save(doc).catch((failed) => {
            console.error(failed);
            return Promise.reject(failed);
        });

        videoId = videoSaved._id;

        const duuzraMediaDto: IDuuzraMediaDto = {
            mediaType: 'video',
            mediaUuid: videoSaved._id,
            duuzraUuid,
            uuid: null,
            dateDeleted: null,
            isAdHoc: isAdHoc
        };
        const clientUuid = tokenPayload.claims.filter((claim) => {
            return claim.indexOf('duuzra.client') !== -1;
        })[0].split('.')[2];
        const media: IDuuzraMediaDto = await this.mediaService.create(token, correlationId, clientUuid, duuzraMediaDto).catch((err) => {
            console.error(err);
            return Promise.reject(err);
        });
        let flag = this.getBoolean(isAdHoc);
        if (flag) {
            let duuzraDuuzra = await this.mediaService.saveAdHocFiles(duuzraMediaDto.duuzraUuid, duuzraMediaDto.mediaUuid, duuzraMediaDto.mediaType, doc).catch((err) => {
                console.error(err);
                return Promise.reject(err);
            });
        }
        mediaVideoDto = (await this.mediaService.getMediaDtoFromDuuzraMediaDto(media).catch((err) => {
            console.error(err);
            return Promise.reject(err);
        })) as MediaVideoDto;

        if (mediaVideoDto) {
            return Promise.resolve<MediaVideoDto>(mediaVideoDto);
        } else {
            return Promise.reject<MediaVideoDto>(mediaVideoDto);
        }
    }

    public getImageResolution(path: string): Promise<number[]> {
        console.log("video.service.ts getImageResolution()");
        return new Promise((resolve, reject) => {
            let fullFilePath = this.getAbsoluteFilePath(path);
            gm(fullFilePath).size((err, val) => {
                if (err) {
                    reject(err);
                }
                let width: number = val.width;
                let height: number = val.height;

                resolve([width, height]);
            });
        });
    };

    public getVideoMediaDetails(path: string): Promise<IMediaDetails> {
        console.log("video.service.ts getVideoMediaDetails()");
        return new Promise((resolve, reject) => {
            let fullFilePath = this.getAbsoluteFilePath(path);
            ffmpeg(fullFilePath)
                .ffprobe((err, metadata) => {
                    if (err) {
                        reject(err);
                    }
                    let videoStream;
                    let videoStreamHeight;
                    let videoStreamWidth;
                    let videoStreamName;
                    let videoFileSize;
                    if (metadata && metadata.streams && metadata.streams.length && metadata.format) {
                        videoStream = metadata.streams[0];
                        const videoStreamWithResolutions: any[] = metadata.streams.filter((i) => !!i.coded_height && !!i.coded_width);
                        let videoStreamWithResolution: any;
                        if (!!videoStreamWithResolutions && !!videoStreamWithResolutions.length) {
                            videoStreamWithResolution = videoStreamWithResolutions[0];
                            videoStreamHeight = videoStreamWithResolution.coded_height;
                            videoStreamWidth = videoStreamWithResolution.coded_width;
                        }
                        videoStreamName = videoStream.codec_name;
                        videoFileSize = metadata.format.size;
                    }
                    if (metadata && videoStream && videoStreamHeight && videoStreamWidth && videoFileSize && videoStreamName) {

                        let filesize = videoFileSize / 1024;

                        let mediaDetails: IMediaDetails = {
                            format: videoStreamName,
                            height: videoStreamHeight,
                            orientation: videoStreamHeight > videoStreamWidth ? MediaOrientation.Landscape : MediaOrientation.Portrait,
                            width: videoStreamWidth,
                            filesize: filesize ? filesize.toString() : '0'
                        }

                        resolve(mediaDetails);

                    } else {
                        reject('Could not retrieve valid metadata from this video file.');
                    }
                });
        });
    }
    public getBoolean(value) {
        switch (value) {
            case true:
            case "true":
                return true;
            default:
                return false;
        }
    }
}

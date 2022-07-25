
import * as graphicsMajick from 'gm';
import * as im from 'imagemagick';
import { ImageRepository } from './image.repository';
import {
    IMediaDetails,
    IMediaDimensions,
    MediaOrientation,
} from '../../duuzra_types/media';
import uuid = require('uuid/v1');
import { IMediaStorageDetail, IMediaResponse, IGetMediaImage, ResolutionFilter, IOptimizeImage, IMediaDocumentDetails, ICroppedImage, IGenerateMedia, MediaImageDto, IAutoCroppedOptimizeImage } from '../../duuzra_types/media';
import { IKeyValuePair } from '../../duuzra_types/common';
import { IMediaImageDoc } from '../../models/media-image-doc';
import { MediaImageMapper } from './mappers/image.mapper';
import { MediaService, DuuzraService } from "../../duuzras/index";
import { IDuuzraTokenPayload } from '../../duuzra_types/security';
import { IDuuzraMediaDto } from '../../duuzra_types/duuzras';
import { MediaServiceBase } from '../../shared/index';

export class ImageService extends MediaServiceBase {
    private imageRepo: ImageRepository;
    private mediaService: MediaService;
    private duuzraService: DuuzraService;
    private fileSavePath: string = 'uploads/';
    private gm = graphicsMajick.subClass({ imageMagick: true });

    constructor() {
        super();
        this.imageRepo = new ImageRepository();
        this.mediaService = new MediaService();
    }

    public async getConvertedImage(model: IGetMediaImage): Promise<IMediaStorageDetail> {
        console.log("image.service.ts getConvertedImage()");

        let convertedImage;
        await this.imageRepo.getImageById(model.docId).then((imageDoc: IMediaImageDoc) => {
            convertedImage = this.getConvertedSize(imageDoc, model.resolution);
        });

        return convertedImage;
    }

    public async getImage(mediaUuid: uuid): Promise<IMediaImageDoc> {
        console.log("image.service.ts getImage()");
        let mediaDoc: IMediaImageDoc;
        await this.imageRepo.getImageById(mediaUuid).then((imageDoc: IMediaImageDoc) => {
            mediaDoc = imageDoc;
        });

        return mediaDoc;
    }

    // public async getImages(): Promise<IMediaStorageDetail> {
    //     let convertedImage;

    //     await this.imageRepo.getImageById(model.docId).then((imageDoc: IMediaImageDoc) => {
    //         convertedImage = this.getConvertedSize(imageDoc, model.resolution);
    //     });

    //     return convertedImage;
    // }

    private getConvertedSize(doc: IMediaImageDoc, resolution: string): IMediaStorageDetail {
        console.log("image.service.ts getConvertedSize()");
        // let array: IMediaStorageDetail[] = [];
        // let resolutions: IMediaDimensions = this.getResolutions(filter);

        // for (let property in doc.converted) {
        //     if (doc.converted.hasOwnProperty(property)) {
        //         array.push(doc.converted[property]);
        //     }
        // }

        // let getConvertImage = array.filter((media: IMediaDimensions) => {
        //     return resolutions.height === media.height && resolutions.width === media.width;
        // });

        // if (getConvertImage && getConvertImage.length >= 1) {
        //     return getConvertImage[0];
        // } else {

        //     let getClosesImage = array.filter((media: IMediaDimensions) => {
        //         return media.height > resolutions.height && media.width > resolutions.width;
        //     });

        //     if (getClosesImage.length > 0) {
        //         return getClosesImage[0];
        //     } else {
        //         return doc.original;
        //     }
        // }

        if (!!doc.converted && !!doc.converted[resolution]) {
            return doc.converted[resolution];
        }
        console.warn(`Resolution ${resolution} was requested but was not found on the document.`);
        return doc.original;
    }

    public optimizeImage(filePath: string, format: string, filter?: ResolutionFilter, outputPath?: string): Promise<IOptimizeImage> {
        console.log("image.service.ts optimizeImage()");
        return new Promise<IOptimizeImage>((resolve, reject) => {
            let filename = uuid();
            let path = outputPath ? outputPath : this.fileSavePath + filename.toString() + '.' + format.toLowerCase();

            let fullInputFilePath = this.getAbsoluteFilePath(filePath);
            let fullOutputFilePath = this.getAbsoluteFilePath(path);

            this.gm(fullInputFilePath).type('Optimize').write(fullOutputFilePath, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        originalPath: filePath,
                        path: path,
                        result: true,
                    });
                }
            });
        });
    }

    public async resize(filePath: string, format: string, width: number, height: number): Promise<IOptimizeImage> {
        console.log("image.service.ts resize()");
        return new Promise<IOptimizeImage>((resolve, reject) => {
            const filename: string = uuid();
            let path: string = this.fileSavePath + filename + '.' + format.toLowerCase();
            this.gm(filePath).resize(width, height).write(path, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        originalPath: filePath,
                        path,
                        result: true,
                    });
                }
            });

        });
    }

    private async getSize(filePath: string): Promise<IMediaDimensions> {
        console.log("image.service.ts getSize()");
        return new Promise<IMediaDimensions>((resolve, reject) => {
            this.gm(filePath).size(function (err, size) {
                if (!err) {
                    resolve({
                        width: size.width,
                        height: size.height
                    });
                }
            });
        });

    }

    public cropImage(filePath: string, format: string, cropWidth: number, cropHeight: number, cropOffsetX: number, cropOffsetY: number): Promise<IOptimizeImage> {
        console.log("image.service.ts CropImage()");
        return new Promise<IOptimizeImage>((resolve, reject) => {
            let filename = uuid();
            let path = this.fileSavePath + filename + '.' + format.toLowerCase();
            let fullFilePath = this.getAbsoluteFilePath(filePath);

            this.gm(fullFilePath).crop(cropWidth, cropHeight, cropOffsetX, cropOffsetY).write(path, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        originalPath: filePath,
                        path: path,
                        result: true,
                    });
                }
            });
        });
    }

    public zoomImage(filePath: string, format: string, zoomLevel: number): Promise<IOptimizeImage> {
        console.log("image.service.ts zoomImage()");
        return new Promise<IOptimizeImage>((resolve, reject) => {
            let filename = uuid();
            let path = this.fileSavePath + filename + '.' + format.toLowerCase();
            let fullFilePath = this.getAbsoluteFilePath(filePath);
            this.gm(fullFilePath).resize(zoomLevel, zoomLevel, '%').write(path, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        originalPath: filePath,
                        path: path,
                        result: true,
                    });
                }
            });

        });
    }

    private async cropToAspectRatio(filePath: string, format: string, width: number, height: number): Promise<IAutoCroppedOptimizeImage> {
        console.log("image.service.ts cropToAspectRation()");
        return new Promise<IAutoCroppedOptimizeImage>((resolve, reject) => {
            const filename: string = uuid();
            const path: string = this.fileSavePath + filename + '.' + format.toLowerCase();
            const targetAspectRatio: number = 1.333;
            let targetWidth: number = width;
            let targetCropStartX: number = 0;
            let targetCropStartY: number = 0;
            let targetHeight: number = height;
            const whAspectRatio: number = +((width / height).toPrecision(3));

            if (whAspectRatio !== targetAspectRatio) {
                if (whAspectRatio > targetAspectRatio) {
                    targetWidth = height * targetAspectRatio;
                    targetCropStartX = (width - targetWidth) / 2;
                } else if (whAspectRatio < targetAspectRatio) {
                    targetHeight = width / targetAspectRatio;
                    targetCropStartY = (height - targetHeight) / 2;
                }
            }

            this.gm(filePath)
                .crop(targetWidth, targetHeight, targetCropStartX, targetCropStartY)
                .write(path, (err) => {
                    if (!!err) {
                        reject(err);
                    } else {
                        resolve({
                            originalPath: filePath,
                            path,
                            result: true,
                            resultWidth: targetWidth,
                            resultHeight: targetHeight
                        });
                    }
                });
        });
    }

    private getResolutions(filter: ResolutionFilter, details?: IMediaDetails): IMediaDimensions {
        console.log("image.service.ts getResolutions()");
        let width;
        let height;

        // Code below is wrong, shouldn't use resolutions based on device, should be a set of common resolutions instead

        switch (filter as ResolutionFilter) {
            case ResolutionFilter.Thumbnail:
                width = 120;
                height = 90;
                break;
            // case ResolutionFilter.SmallPhone:
            //     width = 1080;
            //     height = 1920;
            //     break;
            // case ResolutionFilter.LargePhone:
            //     width = 1536;
            //     height = 2048;
            //     break;
            // case ResolutionFilter.SmallTablet:
            //     width = 1024;
            //     height = 768;
            //     break;
            // case ResolutionFilter.LargeTablet:
            //     width = 1536;
            //     height = 2048;
            //     break;
            // case ResolutionFilter.LargeDesktop:
            //     width = 3840;
            //     height = 2160;
            //     break;
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

    // tslint:disable-next-line:max-line-length
    public async generateImages(token: string, correlationId: string, tokenPayload: IDuuzraTokenPayload, duuzraUuid: string, model: IMediaDocumentDetails, croppedImage: ICroppedImage, autoCrop: boolean, isAdHoc: boolean): Promise<MediaImageDto> { 
        console.log("image.service.ts generateImages()");
        let mediaDetails: IMediaDetails;
        var fs = require('fs');

        mediaDetails = await this.checkImageDetails(model.path).catch((err) => {
            console.error(err);
            return Promise.reject(err);
        }); 

        let optimizedImagePath;
        let convertImages: IKeyValuePair<IMediaStorageDetail> = {};

        let imageId: string;
        let mediaImageDto: MediaImageDto;

        await this.optimizeImage(model.path, mediaDetails.format).then((imageOptimized: any) => {
            if (imageOptimized.path) {
                optimizedImagePath = imageOptimized.path;
            }
        }).catch((err) => {
            return Promise.reject(err);
        });

        if (croppedImage.croppedZoomLevel && croppedImage.croppedZoomLevel !== 100) {
            await this.zoomImage(optimizedImagePath, mediaDetails.format, croppedImage.croppedZoomLevel).then((imageOptimized: any) => {
                if (imageOptimized.path) {
                    optimizedImagePath = imageOptimized.path;
                }
            }).catch((err) => {
                console.error(err);
                Promise.reject(err);
            });
        }

        if (croppedImage.croppedWidth && croppedImage.croppedHeight) {
            let imageOptimized: any = await this.cropImage(optimizedImagePath, mediaDetails.format, croppedImage.croppedWidth, croppedImage.croppedHeight, croppedImage.croppedOffsetX, croppedImage.croppedOffsetY).catch((err) => {
                console.error(err);
                return Promise.reject(err);
            });
            if (imageOptimized.path) {
                optimizedImagePath = imageOptimized.path;
            }
        }

        for (let i = 0; i <= 7; i++) {
            let resolutionSize: ResolutionFilter = i as ResolutionFilter;
            let changed: any;

            changed = await this.changeSize(optimizedImagePath, resolutionSize, mediaDetails).catch((err) => {
                console.error(err);
            });

            if (changed.result) {
                let size: any = this.getResolutions(resolutionSize, mediaDetails);
                if (changed.result) {
                    let resolution = `${size.width} x ${size.height}`;
                    convertImages[resolution] = {
                        height: size.height,
                        path: changed.path,
                        width: size.width
                    };
                }
            }
        }
        let formatImage = 'jpg';
        if (mediaDetails.format === 'GIF') {
            formatImage = 'gif';
        }
        if (formatImage !== 'gif') {
            if (autoCrop) {
                try {
                    const autoCroppedPath: IAutoCroppedOptimizeImage = await this.cropToAspectRatio(optimizedImagePath, mediaDetails.format, mediaDetails.width, mediaDetails.height);
                    convertImages['4:3'] = {
                        height: autoCroppedPath.resultHeight,
                        path: autoCroppedPath.path,
                        width: autoCroppedPath.resultWidth
                    };
                    const resizedPath = await this.resize(autoCroppedPath.path, formatImage, 1024, 768);
                    convertImages['1024 x 768'] = {
                        height: 1024,
                        path: resizedPath.path,
                        width: 768
                    };
                    // this will also include icon size
                    const resizedPath2 = await this.resize(autoCroppedPath.path, formatImage, 300, 300);
                    convertImages['300 x 300'] = {
                        height: 300,
                        path: resizedPath2.path,
                        width: 300
                    };

                } catch (err) {
                    console.error(err);
                }
            } else {
                const resizedPath = await this.resize(optimizedImagePath, formatImage, 1024, 768);
                convertImages['1024 x 768'] = {
                    height: 1024,
                    path: resizedPath.path,
                    width: 768
                };
                // this will also include icon size
                const resizedPath2 = await this.resize(optimizedImagePath, formatImage, 300, 300);
                convertImages['300 x 300'] = {
                    height: 300,
                    path: resizedPath2.path,
                    width: 300
                };
            }
        }
        // DV-378
        let orinalImage = null;

        mediaDetails.height = mediaDetails.height > 1000 ? 1000 : mediaDetails.height;
        mediaDetails.width = mediaDetails.width > 1000 ? 1000 : mediaDetails.height;

        const originalPath = await this.resize(optimizedImagePath, formatImage, mediaDetails.height, mediaDetails.width);
        const originalPathSize = await this.getSize(originalPath.path);

        orinalImage = {
            height: originalPathSize.height,
            path: originalPath.path,
            width: originalPathSize.width
        };

        const doc: IMediaImageDoc = MediaImageMapper.map(convertImages, orinalImage, mediaDetails.format, model.description, model.name, model.originalName, null, isAdHoc);
        /* const doc: IMediaImageDoc = MediaImageMapper.map(convertImages, {
            height: mediaDetails.height,
            path: optimizedImagePath,
            width: mediaDetails.width
        }, mediaDetails.format, model.description, model.name, model.originalName, null);
 */

        await this.imageRepo.save(doc)
            .then(async (imageSaved: IMediaImageDoc) => {

                const duuzraMediaDto: IDuuzraMediaDto = {
                    mediaType: 'image',
                    mediaUuid: imageSaved._id,
                    duuzraUuid,
                    uuid: null,
                    dateDeleted: null,
                    isAdHoc: isAdHoc
                };
                const clientUuid = tokenPayload.claims.filter((claim) => {
                    return claim.indexOf('duuzra.client') !== -1;
                })[0].split('.')[2];
                let media: IDuuzraMediaDto = await this.mediaService.create(token, correlationId, clientUuid, duuzraMediaDto).catch((err) => {
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
                mediaImageDto = await this.mediaService.getMediaDtoFromDuuzraMediaDto(media).catch((err) => {
                    console.error(err);
                    return Promise.reject(err);
                }) as MediaImageDto;
            })
            .catch((failed) => {
                console.error(failed);
                return Promise.reject(failed);
            });

        if (mediaImageDto) {
            return Promise.resolve(mediaImageDto);
        } else {
            return Promise.reject<MediaImageDto>(mediaImageDto);
        }
    }

    public async changeSize(filePath: string, filter: ResolutionFilter, details: IMediaDetails) {
        console.log("image.service.ts changeSize()");
        return new Promise((resolve, reject) => {
            let filename = uuid();
            let dimensions = this.getResolutions(filter, details);
            let fullInputFilePath = this.getAbsoluteFilePath(filePath);
            let fullOutputFilePath = this.getAbsoluteFilePath(this.fileSavePath) + filename + '.' + details.format.toLocaleLowerCase();

            let resizeCommand = `${dimensions.width} x ${dimensions.height} \!`;

            if (!!dimensions.height && !!dimensions.width) {
                im.convert([fullInputFilePath, '-resize', resizeCommand, fullOutputFilePath], (err, val) => {
                    if (err) {
                        resolve({
                            result: false,
                        });
                    } else {
                        resolve({
                            path: this.fileSavePath + filename + '.' + details.format.toLocaleLowerCase(),
                            result: true,
                            filename: filename,
                        });
                    }
                });

            } else {
                resolve({
                    message: 'image is too small for this size. ' + filter.toString(),
                    result: false,
                });
            }
        });
    }

    public checkImageDetails(path: string): Promise<IMediaDetails> {
        console.log("image.service.ts CheckImageDetails()");
        return new Promise((resolve, reject) => {
            let fullFilePath = this.getAbsoluteFilePath(path);
            this.gm(fullFilePath).size((err, value) => {
                if (err) {
                    reject(err);
                }
                if (value) {
                    this.getImageDetails(path, value.height, value.width).then((imageDetails) => {
                        resolve(imageDetails);
                    });
                } else {
                    this.getImageDetails(path).then((imageDetails) => {
                        resolve(imageDetails);
                    });
                }
            });
        });
    }

    public getImageDetails(path: string, height?: number, width?: number): Promise<IMediaDetails> {
        console.log("image.service.ts getImageDetails()");
        return new Promise<IMediaDetails>((resolve, reject) => {
            let fullFilePath = this.getAbsoluteFilePath(path);
            this.gm(fullFilePath).identify((err, val) => {
                if (err) {
                    return reject(err);
                }
                if (Array.isArray(val.Filesize)) {
                    val.Filesize = val.Filesize[0];
                }
                let filesize = this.parseFilesize(val.Filesize);

                if (height > width) {

                    let mediaDetails: IMediaDetails = {
                        format: val.format,
                        height: height,
                        orientation: MediaOrientation.Landscape,
                        width: width,
                        filesize: filesize ? filesize.toString() : '0'
                    }

                    resolve(mediaDetails);
                } else {
                    let mediaDetails: IMediaDetails = {
                        format: val.format,
                        height: height,
                        orientation: MediaOrientation.Portrait,
                        width: width,
                        filesize: filesize ? filesize.toString() : '0'
                    }

                    resolve(mediaDetails);
                }
            });
        });
    };

    private parseFilesize(filesize: string): number {
        console.log("image.service.ts parseFileSize()");
        if (filesize) {
            if (filesize.includes('M')) {
                let filesizeSplit = filesize.split('M');

                let sizeInMb = parseFloat(filesizeSplit[0]) * 1024;
                return parseInt(sizeInMb.toString(), null);
            } else if (filesize.includes('K')) {
                let sizeInKb = filesize.split('K');

                if (sizeInKb.length > 1) {
                    return parseInt(sizeInKb[0], null);
                }
            } else if (filesize.includes('B')) {
                var sizeInKb = filesize.split('B');
                if (sizeInKb.length > 1) {
                    return parseInt(sizeInKb[0], null) * 0.001;
                }
            }
        }
 
        return 0;

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

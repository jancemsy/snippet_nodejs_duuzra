import * as express from 'express';
import { System } from '../shared/system';
import { DuuzraRouteHandler } from '../shared/security/route.handler';
import { ImageRepository, VideoRepository } from "../media/index";
import { IMediaImageDoc } from '../models/media-image-doc';
import { IMediaVideoDoc } from '../models/media-video-doc';
import path = require("path");
import fs = require("fs");
import { json } from 'web-request';

/**
 * Controller functions for media services (REST)
 *
 * @export
 * @class AttachmentController
 * @deprecated This controller is to be fully replaced by a web socket route
 */
export class MediaController {

    /**
     * References the Express Router
     *
     * @private
     * @type {express.Router}
     */
    private router: express.Router;
    private imageRepo: ImageRepository;
    private videoRepo: VideoRepository;

    /**
     * Creates an instance of ApplicationController.
     *
     * @param {express.Router} router The application router
     */
    constructor(routeHandler: DuuzraRouteHandler) {
        this.router = routeHandler.router;

        this.imageRepo = new ImageRepository();
        this.videoRepo = new VideoRepository();

        this.router.get('/getMediaImageStream/:mediaUuid', this.readImage);
        this.router.get('/readHigherQualityImages/:mediaUuid', this.readHigherQualityImage);
        this.router.get('/getMediaImageInfo/:mediaUuid', this.getMediaImageInfo);
        this.router.get('/getMediaVideoStream/:mediaUuid', this.readVideo);

    }

    /**
     * Reads image from the system
     *
     * @param {express.Request} req The API request
     * @param {express.Response} res The API response
     */
    public readImage = (req: express.Request, res: express.Response): any => {

        if (req.params.mediaUuid) {
            
            this.imageRepo.getImageById(req.params.mediaUuid).then((imageDoc: IMediaImageDoc) => {
                let rootPath = imageDoc.original.path; 
                console.log("media.controller.ts media download " + rootPath);  

                return new Promise((resolve, reject) => { 
                     res.download(rootPath, req.params.mediaUuid, function(err) { 
                        if (err) {  
                            console.log('media download error'); 
                            //throwing this error will result a nodejs to stop with the error "NodeError: Cannot set headers after they are sent to the client "
                            //return res.status(500).json(err);
                            reject("error found");
                        }else{
                            resolve(true);
                        }
                    });
                });
 

            }).catch(e=>{
                return false; 
            });

        } else { 
            return false;  
            /*//throwing this error will result a nodejs to stop with the error "NodeError: Cannot set headers after they are sent to the client "
             return res.status(400).json({
                 message: 'Media UUID not provided',
              }); 
              */
        }

    };

    /*
    Read origianl image with higher resolution

    */

    public readHigherQualityImage = (req: express.Request, res: express.Response): any => {  
        if (req.params.mediaUuid) {
            let resolution = "1024 x 768";
            this.imageRepo.getHigherQualityImageById(req.params.mediaUuid).then((imageDoc: IMediaImageDoc) => { 
                    let rootPath = imageDoc.converted[resolution].path;   
                    
                    return new Promise((resolve, reject) => { 
                            return res.download(rootPath, req.params.mediaUuid, function(err) {
                                if (err) {  
                                    console.log('media download error'); 
                                    //throwing this error will result a nodejs to stop with the error "NodeError: Cannot set headers after they are sent to the client "
                                    //return res.status(500).json(err);
                                    reject("error found");
                                }else{
                                    resolve(true);
                                }
                            }); 
                        });
            }).catch(e=>{
                   return false; 
            });
        } else {
            return res.status(400).json({
                  message: 'Media UUID not provided',
            }); 
        }
    };

    /**
     * Reads video from the system
     *
     * @param {express.Request} req The API request
     * @param {express.Response} res The API response
     */
    public readVideo = (req: express.Request, res: express.Response): any => {

        if (req.params.mediaUuid) {
            this.videoRepo.getVideoById(req.params.mediaUuid).then((videoDoc: IMediaVideoDoc) => {
                let rootPath = videoDoc.original.path;

                var file = path.resolve(rootPath);
                fs.stat(file, function(err, stats) {
                    if (err) {
                        if (err.code === 'ENOENT') { 
                            console.log('video not found');
                            return false;
                        }
                        res.end(err);
                    }
                    var range: any = req.headers.range ? req.headers.range : "bytes=0-";

                    if (!range) { 
                        res.download(rootPath, req.params.mediaUuid, function(err) {
                            if (err) { 
                               return false; 
                            }
                        });
                    }

                    var positions = range.replace(/bytes=/, "").split("-");
                    var start = parseInt(positions[0], 10);
                    var total = stats.size;
                    var end = positions[1] ? parseInt(positions[1], 10) : total - 1;
                    var chunksize = (end - start) + 1;

                    res.writeHead(206, {
                        "Content-Range": "bytes " + start + "-" + end + "/" + total,
                        "Accept-Ranges": "bytes",
                        "Content-Length": chunksize,
                        "Content-Type": "video/mp4"
                    });

                    var stream = fs.createReadStream(file, { start: start, end: end } as any)
                        .on("open", function() {
                            stream.pipe(res);
                        }).on("error", function(err) {
                            res.end(err);
                        });
                });

                return false; 

            }).catch(e=>{
                return false; 
            })
        } else {
            return false;
        }
    };

    /**
     * Gets media image info
     *
     * @param {express.Request} req The API request
     * @param {express.Response} res The API response
     */
    public getMediaImageInfo = (req: express.Request, res: express.Response): any => {
        if (req.params.mediaUuid) {
            return this.imageRepo.getImageById(req.params.mediaUuid).then((imageDoc: IMediaImageDoc) => {
                res.json(imageDoc);
            }).catch(e=>{
                return false; 
            }); 
        } else {
            console.log( 'Media UUID not provided');
            return  false; 
        }
    };
}

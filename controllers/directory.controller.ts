import * as express from 'express';
import * as bodyParser from 'body-parser';
import { Directory } from '../directory/directory.repository';
import { FilterField } from '../directory/filter-field';
import { DuuzraRouteHandler } from '../shared/security/route.handler';

/**
 * Controller functions for the directory List
 *
 * @export
 * @class DirectoryController
 * @deprecated This controller is to be fully replaced by a web socket route
 */
export class DirectoryController {

    /**
     * References the Express Router
     *
     * @private
     * @type {express.Router}
     */
    private router: express.Router;

    /**
     * Creates an instance of DirectoryController.
     *
     * @param {express.Router} router The application router
     */
     constructor(routeHandler: DuuzraRouteHandler) {
        this.router = routeHandler.router;

        this.router.get('/:eventId/directory', this.read);
        this.router.get('/:eventId/directory/:partial', this.read);
        this.router.get('/directory/details/:directoryId', this.read);
        this.router.get('/directory/details/:directoryId/:partial', this.read);
        this.router.get('/directory/:directoryListId', this.read);
        this.router.get('/directory/:directoryListId/:partial', this.read);
        this.router.post('/directory', this.create);
        this.router.put('/directory', this.update);
        this.router.patch('/directory', this.updatePartial);
        this.router.delete('/directory', this.delete);
    }

    /**
     * Reads directory items from the system
     *
     * @param {express.Request} req The API request
     * @param {express.Response} res The API response
     */
    public read = (req: express.Request, res: express.Response): void => {
        let partial = req.params.partial !== undefined && req.params.partial === 'full' ? false : true;
        let filterField = FilterField.NONE;
        let id = undefined;

        if (req.params.eventId !== undefined) {
            filterField = FilterField.EVENT;
            id = req.params.eventId;
        } else if (req.params.directoryListId !== undefined) {
            filterField = FilterField.DIRECTORYLIST;
            id = req.params.directoryListId;
        } else if (req.params.directoryId !== undefined) {
            filterField = FilterField.DIRECTORY;
            id = req.params.directoryId;
        }

        new Directory(null, null, null, null).get(id, filterField, partial)
            .then((resp) => {
                res.json(resp);
            })
            .catch((err) => {
                res.json(err);
            });
    };

    /**
     * Creates a directory item
     *
     * @param {express.Request} req The API request
     * @param {express.Response} res The API response
     */
    public create = (req: express.Request, res: express.Response): void => {
        let doc = new Directory(null, null, null, null)

        doc.eventId = req.body.eventId;
        doc.directoryListId = req.body.directoryListId;
        doc.title = req.body.title;
        doc.summary = req.body.summary;
        doc.description = req.body.description;
        doc.contentLinks = req.body.contentLinks;

        doc.save()
            .then((resp) => {
                res.json(resp);
            })
            .catch((err) => {
                res.json(err);
            });
    };

    /**
     * Updates a directory item
     *
     * @param {express.Request} req The API request
     * @param {express.Response} res The API response
     */
    public updatePartial = (req: express.Request, res: express.Response): void => {
        new Directory(null, null, null, null).getRaw(req.body._id)
            .then((resp) => {
                // Update only changed values
                let doc = resp['docs'][0];

                doc._rev = req.body._rev;

                if (req.body.eventId !== undefined) {
                    doc.eventId = req.body.eventId;
                }

                if (req.body.directoryListId !== undefined) {
                    doc.directoryListId = req.body.directoryListId;
                }

                if (req.body.title !== undefined) {
                    doc.title = req.body.title;
                }

                if (req.body.summary !== undefined) {
                    doc.summary = req.body.summary;
                }

                if (req.body.description !== undefined) {
                    doc.description = req.body.description;
                }

                if (req.body.contentLinks !== undefined) {
                    doc.contentLinks = req.body.contentLinks;
                }

                new Directory(null, null, null, null).save(doc)
                    .then((resp2) => {
                        res.json(resp2);
                    })
                    .catch((err) => {
                        res.json(err);
                    });
            })
            .catch((err) => {
                res.json(err);
            });
    };

    /**
     * Updates a directory item
     *
     * @param {express.Request} req The API request
     * @param {express.Response} res The API response
     */
    public update = (req: express.Request, res: express.Response): void => {
        let doc = new Directory(req.body._id, req.body._rev, null, null);

        doc.eventId = req.body.eventId;
        doc.directoryListId = req.body.directoryListId;
        doc.title = req.body.title;
        doc.summary = req.body.summary;
        doc.description = req.body.description;
        doc.contentLinks = req.body.contentLinks;

        doc.save()
            .then((resp) => {
                res.json(resp);
            })
            .catch((err) => {
                res.json(err);
            });
    };

    /**
     * Deletes a directory item
     *
     * @param {express.Request} req The API request
     * @param {express.Response} res The API response
     */
    public delete = (req: express.Request, res: express.Response): void => {
        let doc = new Directory(req.body._id, req.body._rev, null, null);

        doc.delete()
            .then((resp) => {
                res.json(resp);
            })
            .catch((err) => {
                res.json(err);
            });
    };

    /**
     * Return the routes generated by the directory controller
     */
    public getRoutes = (): express.Router => {
        return this.router;
    };
}

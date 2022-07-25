import * as request from 'request-promise';
import { IDB, IDbConfig, IDbModel } from '../models/database/index';
import { IKeyValuePair } from '../models/database/index';

/**
 * The Couch DB manager
 *
 * @export
 * @class DB
 */
export class CouchDb implements IDB {

    /**
     * The CouchDb URL
     *
     * @private
     * @type {string}
     */
    private url: string;

    /**
     * The DB name
     *
     * @private
     * @type {string}
     */
    private dbName: string;

    /**
     * Creates an instance of the CouchDb.
     *
     * @param {IDBConfig} config DB configuration values
     */
    constructor(config: IDbConfig) {
        this.dbName = config.dbName;
        this.url = config.username ? this.buildCouchUrl(config) : config.location;
    };

    private buildCouchUrl(config: IDbConfig): string {
        // e.g. http://localhost:5984 or https://localhost:5984

        let indexOfProtocolEnd = config.location.indexOf('/') + 1;
        let protocol = config.location.substr(0, indexOfProtocolEnd + 1);
        let url = config.location.substr(indexOfProtocolEnd + 1);
        let auth = config.username + ':' + config.password
        return protocol + auth + '@' + url;
    }

    /**
     * Get passed in document's revision ID if one exists
     */
    public getRevision = (id: string): Promise<string> => {
        return new Promise<string>((resolve, reject) => {
            request.head({
                url: this.url + '/' + this.dbName + '/' + id,
            })
                .then((response) => {

                    // Clean up etag
                    resolve(this.decode(response.etag));
                })
                .catch((err) => {
                    reject(err);
                });
        });
    };

    /**
     * Get documents using the passed in document type and view
     */
    public get = (type: string, view?: string, key?: string, options?: IKeyValuePair<any>): Promise<{}> => {
        let filter = '';

        if (!view) {
            view = 'all';
        }

        if (key) {
            filter = `?key="${key}"`;
        }
        if (options) {
            filter += key ? '&' : '?';
            Object.keys(options).forEach((prop) => filter += `${prop}=${JSON.stringify(options[prop])}&`);
        }

        return new Promise((resolve, reject) => {
            request({
                json: true,
                url: this.url + '/' + this.dbName + '/_design/' + type + '/_view/' + view + filter,
            })
                .then((body) => {
                    if (body) {
                        let result = { docs: [] };

                        if (body.rows.length > 0) {
                            for (let doc of body.rows) {
                                result.docs.push(doc.value);
                            }
                        }
                        resolve(result);
                    }

                    reject('Unable to retrieve documents');
                })
                .catch((err) => {
                    reject(err);
                });
        });
    };

    /**
     * Gets a file from the passed in document
     */
    /*
    public getFile = (doc: IAttachmentModel): Promise<{}> => {
        return new Promise((resolve, reject) => {
            request.get({
                encoding: null,
                resolveWithFullResponse: true,
                url: this.url + '/' + this.dbName + '/' + doc._id + '/' + doc.name,
            })
                .then((response) => {
                    if (response.body) {
                        doc.buffer = response.body;
                        doc.contentLength = response.headers['content-length'];
                        doc.contentType = response.headers['content-type'];
                        doc._rev = response.headers['etag'];

                        resolve(doc);
                    }

                    reject('Unable to retrieve documents');
                })
                .catch((err) => {
                    reject(err);
                });
        });
    };*/

    /**
     * Save a document to the document DB
     */
    public save = (doc: IDbModel): Promise<{}> => {
        return new Promise((resolve, reject) => {

            /*
            if (_rev empty) {
                do a load based on docId
                replace in object _rev
            }
            */

            request.put({
                body: doc,
                json: true,
                url: this.url + '/' + this.dbName + '/' + doc._id,
            })
                .then((body) => {
                    if (body.ok) {
                        doc._rev = body.rev;
                        resolve(doc);
                    }

                    reject('Unable to save the document');
                })
                .catch((err) => {
                    reject(err);
                });
        });
    };

    /**
     * Save an attachment to the document DB
     */
    /*
    public saveFile = (doc: IAttachmentModel): Promise<{}> => {
        return new Promise((resolve, reject) => {
            request.put({
                body: doc.buffer,
                headers: {
                    'Content-Length': doc.contentLength,
                    'Content-Type': doc.contentType,
                },
                url: this.url + '/' +
                this.dbName + '/' +
                doc._id + '/' +
                this.decode(doc.name) +
                '?rev=' + doc._rev,
            })
                .then((body) => {
                    let jsonBody = JSON.parse(body);
                    if (jsonBody.ok) {
                        let response = {
                            _id: doc._id,
                            _rev: jsonBody.rev,
                        };

                        resolve(response);
                    }

                    reject('Unable to save the file');
                })
                .catch((err) => {
                    reject(err);
                });
        });
    };*/

    /**
     * Delete a document from the DB
     */
    public delete = (doc: IDbModel): Promise<{}> => {
        return new Promise((resolve, reject) => {
            request.del({
                body: doc,
                json: true,
                url: this.url + '/' + this.dbName + '/' + doc._id + '?rev=' + doc._rev,
            })
                .then((body) => {
                    if (body.ok) {
                        doc._rev = body.rev;
                        resolve(doc);
                    }

                    reject('Unable to delete the document');
                })
                .catch((err) => {
                    reject(err);
                });
        });
    };

    /**
     * Delete an attachment from the document DB
     *//*
    public deleteFile = (doc: IAttachmentModel): Promise<{}> => {
        return new Promise((resolve, reject) => {
            request.del({
                body: doc,
                json: true,
                url: this.url + '/' + this.dbName + '/' + doc._id + '/' + doc.name + '?rev=' + doc._rev,
            })
                .then((body) => {
                    if (body.ok) {
                        doc._rev = body.rev;
                        resolve(doc);
                    }

                    reject('Unable to delete the file');
                })
                .catch((err) => {
                    reject(err);
                });
        });
    };*/

    /**
     * Strip quotes from URL strings
     *
     * @private
     */
    private decode = (text: string) => {
        return (text).replace(/['"]+/g, '');
    };
}

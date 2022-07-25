import { IDbModel } from './db-model';
import { IKeyValuePair } from './key-value-pair';

/**
 * The DB interface
 *
 * @interface IDB
 */
export interface IDB {

  /**
   * Return items from the DB
   *
   * @param {string} type Type of item being stored
   * @param {string} [view] Optional View to query
   * @param {string} [options] Optional options
   * @returns {Promise<{}>}
   */
  get(type: string, view?: string, key?: string, options?: IKeyValuePair<any>): Promise<{}>;

  /**
   * Returns a file from the DB
   *
   * @param {IDbModel} doc Attachment to retrieve from the DB
   * @returns {Promise<{}>}
   */
  /*getFile(doc: IDbModel): Promise<{}>;*/

  /**
   * Save item in DB
   *
   * @param {IDbModel} doc Document being stored in the DB
   * @returns {Promise<{}>}
   */
  save(doc: IDbModel): Promise<{}>;

  /**
   * Save a file to the DB
   *
   * @param {IDbModel} doc Attachment being stored in the DB
   * @returns {Promise<{}>}
   */
  /*saveFile(doc: IDbModel): Promise<{}>;*/

  /**
   * Delete item from DB
   *
   * @param {IDbModel} doc Document deleted from the DB
   * @returns {Promise<{}>}
   */
  delete(doc: IDbModel): Promise<{}>;

  /**
   * Delete attachment from DB
   *
   * @param {IDbModel} doc Attachment being deleted from the DB
   * @returns {Promise<{}>}
   */
  /*deleteFile(doc: IDbModel): Promise<{}>;*/

  /**
   * Get the Revision ID of the item from DB
   *
   * @param {string} id ID of item in the DB
   * @param {string} [options] Optional options
   * @returns {Promise<string>}
   */
  getRevision(id: string, options?: string): Promise<string>;
}

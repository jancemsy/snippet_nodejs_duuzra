/**
 * The DB Config Interface
 *
 * @interface IDBConfig
 */
export interface IDbConfig {

  /**
   * Name of DB
   *
   * @type {string}
   */
  dbName: string;

  /**
   * Location of the DB, either URL or Server Location
   *
   * @type {string}
   */
  location: string;

  /**
   * Username for DB
   *
   * @type {string}
   */
  username?: string;

  /**
   * Password for DB
   *
   * @type {string}
   */
  password?: string;
}

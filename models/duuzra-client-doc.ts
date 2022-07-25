import { IDbModel } from '../duuzra_types/database';

export interface IClientDoc extends IDbModel {
    uuid: string,
    info: {}
    accounts: {},
    media: {},
    duuzras: {}
    folders: {},
    email?: string
}

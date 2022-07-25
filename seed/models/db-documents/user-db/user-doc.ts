import { IDbModel } from '../../database/index';

export interface IUserDoc extends IDbModel {
    email: string;
    password: string[];
    createdBy: string | null;
}

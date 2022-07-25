import { IDbModel } from '../../database/index';

export interface IClaimDoc extends IDbModel {
    userId: string; // reference to the user doc
    claims: string[];
}

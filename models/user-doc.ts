import { IDbModel } from '../duuzra_types/database';
import { IUserPermissionsDoc } from './user-permissions-doc';

export interface IUserDoc extends IDbModel{
    password: string;
    claims: string[];
    email: string;
    createdBy: string | null;
    firstname: string;
    lastname: string;
    dateCreated: string;
    isAttendee: boolean;
    permissions: IUserPermissionsDoc
}

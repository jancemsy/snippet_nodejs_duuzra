import {IDbModel} from '../duuzra_types/database';
import { IUserPermissionsDoc } from './user-permissions-doc';

export interface IAuthUserDoc extends IDbModel  {
    password: string;
    claims: string[];
    email: string;
    createdBy: string | null;
    firstname: string;
    lastname: string;
    dateCreated: string;
    hasRegistered: boolean;
    registrationToken: string;
    isEmailValidated: boolean;
    isAnnonymous: boolean;
    isAttendee: boolean;
    permissions: IUserPermissionsDoc;
    settings: null
}

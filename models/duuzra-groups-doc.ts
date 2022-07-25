import {IDbModel} from '../duuzra_types/database';

export interface IDuuzraGroupsDoc {
    groupName: string;
    users: string[];
    createdBy: string;
    dateCreated: Date;
}

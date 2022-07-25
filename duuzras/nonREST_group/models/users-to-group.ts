import { IGroupMember } from './group-member';
export interface IUsersToGroupsDto {
    groupName: string;
    users: IGroupMember[];
    dateCreated: Date;
    createdBy: string;
}

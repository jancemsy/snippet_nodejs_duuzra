
import { IAuthUserDto } from '../../duuzra_types/auth';
import { DateFormatter } from '../../duuzra_types/common';
import { IDuuzraTokenPayload } from '../../duuzra_types/security';
import { AuthUserRepository, IAuthUserRepository } from './user.repository';

/* Cross Service Communication */
/* The RPC mechanism needs to be considered before any split for this item */
import { ClaimsService } from '../../shared/claims/claims.service';

import { HashHelper } from '../';

export abstract class IAuthUserService {

    // Used to deliver information out through the api.
    public abstract async getUsers(tokenPayload: IDuuzraTokenPayload, filter: any /*ISocketFilter*/, sort: any /*ISocketSort*/): Promise<IAuthUserDto[]>
    public abstract async createUser(tokenPayload: IDuuzraTokenPayload, authUser: IAuthUserDto): Promise<IAuthUserDto>;
    public abstract async updateUser(tokenPayload: IDuuzraTokenPayload, authUser: IAuthUserDto): Promise<IAuthUserDto>;
    public abstract async deleteUser(tokenPayload: IDuuzraTokenPayload, authUserUuid: string): Promise<IAuthUserDto>;
}

export class AuthUserService implements IAuthUserService {
    private userRepo: IAuthUserRepository;

    // ##########################################################################
    // # LIFECYCLE
    // ##########################################################################

    constructor() {
        this.userRepo = new AuthUserRepository();
    }

    // ####################################
    // # DATA READS
    // ####################################

    public async getUsers(tokenPayload: IDuuzraTokenPayload, filters: any /*ISocketFilter*/, sorts: any /*ISocketSort*/): Promise<IAuthUserDto[]> {
        console.log("user.service.ts getUsers()"); 
        try {
            const clientClaim = tokenPayload.claims.filter((c) => c.startsWith('duuzra.client.'))[0]
            const clientUuid = clientClaim.replace('duuzra.client.', '');

            if (!clientUuid) {
                return Promise.reject<IAuthUserDto[]>(new Error('No client defined on token'));
            }

            // filters to apply in decreacing significance - relating to couch views
            const uuidFilterSet = filters && filters.uuid ? true : false;
            const administratorFilterSet = tokenPayload.uuid && (tokenPayload.claims.indexOf('duuzra.role.cms.admin') > -1) ? true : false;

            if (!administratorFilterSet) { 
                return Promise.reject<IAuthUserDto[]>(new Error('You cannot make a getUsers call if you are not an adminsitrator'));
            }

            let authUsers: IAuthUserDto[] = [];
            let couchQueryRun = false;

            if (!couchQueryRun && uuidFilterSet) {

                const userDto = await this.userRepo.getUserByUuid(filters.uuid).catch((error) => { console.error(error); });
                authUsers.push(userDto);
                couchQueryRun = true;
            }

            // Apply any additional property filters on the filter
            authUsers = this.applyInCodeFiltersAndSorts(authUsers, filters, sorts)

            return Promise.resolve(authUsers);

        } catch (e) {
            console.error('ERROR:', e);
            return Promise.reject<IAuthUserDto[]>(new Error('Unknown Error'));
        }
    }

    private applyInCodeFiltersAndSorts(dtos, filters, sorts) {
        for (const property in filters) {
            if (property !== 'uuid') {
                dtos = dtos.filter((dto) => {
                    return dto[property] === filters[property] || filters[property].indexOf(dto[property]) > -1;
                })
            }
        }
        // todo - handle sorts

        return dtos;
    }

    // ####################################
    // # DATA CHANGES
    // ####################################

    public async createUser(tokenPayload: IDuuzraTokenPayload, authUser: IAuthUserDto): Promise<IAuthUserDto> {
        console.log("user.service.ts createUsers()"); 
        // Validate no duplicate
        const userWithEmail = await this.userRepo.getUserByEmail(authUser.email);
        if (!userWithEmail) {
            // Hash the password.
            const encryptedPassword = await HashHelper.encrypt(authUser.password);
            authUser.password = encryptedPassword;

            // Augment with Dates
            authUser.dateCreated = new DateFormatter().toString();
            authUser.createdBy = tokenPayload.uuid;
            return this.userRepo.createUser(authUser);
        } else {

            // ####################################################################
            // # DH - If we call create user with an email that is already in use
            // # we are going to return the user already in exisitance. I currently
            // # percieve this to be a valid mechanism. There are no scenarios where
            // # I can see this being a problem at this time. A valid user is still
            // # returned. It might be the case where we disable a user in the future
            // # in this case this mechanism may need reviewing.
            // ####################################################################

            // Update the existing user with any new claims from the create.
            // if (!(userWithEmail.claims === authUser.claims)) {
            //     authUser.claims.forEach((newClaim) => {
            //         if (userWithEmail.claims.indexOf(newClaim) === -1) {
            //             userWithEmail.claims.push(newClaim);
            //         }
            //     })
            //     return await this.userRepo.updateUser(userWithEmail);
            // }

            return userWithEmail;
        }
    }

    public async updateUser(tokenPayload: IDuuzraTokenPayload, info: IAuthUserDto): Promise<IAuthUserDto> { 
        console.log("user.service.ts updateUsers()"); 
        return Promise.reject<IAuthUserDto>(new Error('UserService - Update User Not Implemented'));
    }

    public async deleteUser(tokenPayload: IDuuzraTokenPayload, infoUuid: string): Promise<IAuthUserDto> {
        console.log("user.service.ts deleteUsers()"); 
        return Promise.reject<IAuthUserDto>(new Error('UserService - Delete User Not Implemented')); 
    }
}

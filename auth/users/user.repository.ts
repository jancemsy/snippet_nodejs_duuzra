import { System } from '../../shared';
import { IAuthUserDto } from '../../duuzra_types/auth';
import { AuthUserMapper } from './user.mapper';
import { IAuthUserDoc } from '../../models/auth-user-doc';

export abstract class IAuthUserRepository {
    public abstract async getUserByUuid(authUserUuid: string): Promise<IAuthUserDto>;
    public abstract async getUserByEmail(email: string): Promise<IAuthUserDto>;
    public abstract async createUser(userDto: IAuthUserDto): Promise<IAuthUserDto>;
    public abstract async deleteUser(authUserUuid: string): Promise<IAuthUserDto>;
    public abstract async updateUser(userDto: IAuthUserDto): Promise<IAuthUserDto>;
}

export class AuthUserRepository implements IAuthUserRepository {
    private readonly objectName = AuthUserMapper.getViewType();

    // ####################################
    // # DATA READS
    // ####################################

    /**
     * Gets user by id
     */
    public async getUserByUuid(authUserUuid: string): Promise<IAuthUserDto> {
        console.log("user.repository.ts getUserByUuid()"); 
        try {
            let docId = 'auth-user_' + authUserUuid;
            let rawUsers = await System.DB.get(this.objectName, 'id', docId) as any;
            if (rawUsers && rawUsers.docs.length === 1) {
                return Promise.resolve(
                    AuthUserMapper.mapToObj(rawUsers.docs[0])
                );
            } else {
                return Promise.resolve(null);
            }
        } catch (err) { 
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
            //return Promise.reject<IAuthUserDto>(err); //james-new
        }
    }

    public async getUserByEmail(email: string): Promise<IAuthUserDto> {
        console.log("user.repository.ts getUserByEmail()"); 
        try {
            const rawUsers = await System.DB.get(this.objectName, 'email', email.toLowerCase()) as any;
            if (rawUsers && rawUsers.docs.length === 1) {
                return Promise.resolve(
                    AuthUserMapper.mapToObj(rawUsers.docs[0])
                );
            } else {
                return Promise.resolve(null);
            }
        } catch (err) { 
            return Promise.reject<IAuthUserDto>(err);
        }
    }

    // ####################################
    // # DATA CHANGES
    // ####################################

    /**
     * Saves the specified account
     */
    public async createUser(authUserDto: IAuthUserDto): Promise<IAuthUserDto> {
        console.log("user.repository.ts createUser()"); 
        try {
            // convert dto to doc
            let authUserDoc = AuthUserMapper.mapToDoc(authUserDto);

            // load the client doc
            let couchGet = await System.DB.get('authUser', 'id', authUserDoc._id) as any;

            // add the item
            if (couchGet.docs.length === 0) {

                // Create the user
                let couchResponse = await System.DB.save(authUserDoc);

            } else { 
                return Promise.reject<IAuthUserDto>(null);
            }

            // resolve with the created item
            return Promise.resolve(AuthUserMapper.mapToObj(authUserDoc));
        } catch (err) { 
            return Promise.reject<IAuthUserDto>(err);
        }
    }

    public async deleteUser(authUserUuid: string): Promise<IAuthUserDto> { 
        console.log("user.repository.ts deleteUser()"); 
        return Promise.reject<IAuthUserDto>(null);
    }

    public async updateUser(authUser: IAuthUserDto): Promise<IAuthUserDto> {
        console.log("user.repository.ts updateUser()"); 
        return new Promise<IAuthUserDto>(async (resolve, reject) => {
            try{
                // load the doc
                let couchGet = await System.DB.get('authUser', 'id', 'auth-user_' + authUser.uuid) as any;

                // add the item
                if (couchGet.docs.length === 1) {

                    // Update the user
                    const dbAuthUserDoc: IAuthUserDoc = couchGet.docs[0];
                    const authUserDoc = AuthUserMapper.mapToDoc(authUser);
                    authUserDoc._rev = dbAuthUserDoc._rev;

                    System.DB.save(authUserDoc)
                    .then((updatedDoc: any) => {
                        resolve(updatedDoc);
                    })
                    .catch((err: string) => {
                        reject(err);
                    });
                }
            } catch (err){
                return Promise.reject<IAuthUserDto>(err);
            }

        });
    }
}

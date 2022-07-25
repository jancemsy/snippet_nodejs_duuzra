import { System } from '../../shared';
import { UserManagementMapper } from './user-mgt.mapper';
import { DateFormatter } from '../../duuzra_types/common';
import { IAuthClaimDto, IAuthUserDto } from '../../duuzra_types/auth';
import { IAuthUserDoc } from '../../models/auth-user-doc';
import { IClientDto } from '../../duuzra_types/duuzras';
import { IUserDoc } from '../../models/user-doc';
import { IDuuzraAccountDoc } from '../../models/duuzra-account-doc';


export abstract class IUserManagementRepository { 
    public abstract async createUser(authToken: string, correlationId: string, clientUuid: string, userUuid: string, user: IAuthUserDto, client: IClientDto): Promise<IAuthUserDto>;
    public abstract async deleteUser(userUuid: any): Promise<IAuthUserDto>;
    public abstract async updateUser(userDto: IAuthUserDto): Promise<IAuthUserDto>;
    public abstract async getAllUsers(authToken: string, correlationId, stringClientUuid): Promise<IAuthUserDto[]>
    public abstract async getUserByUuid(authToken: string, correlationId: string, clientUuid: string, duuzraUuid: string, userUuid): Promise<IAuthUserDto>;
    public abstract async getUserByEmail(email: string): Promise<IAuthUserDto>;
}

export class UserManagementRepository implements IUserManagementRepository {
    private readonly objectName = UserManagementMapper.getViewType();

    public async updateUser(userDto: IAuthUserDto): Promise<IAuthUserDto> {
        console.log("user-mgt.repository.ts UpdateUser()");
        return new Promise<IAuthUserDto>(async (resolve, reject) => {
            try{
                let couchGet = await System.DB.get(this.objectName, 'id', 'auth-user_' + userDto.uuid) as any;
                if (couchGet.docs.length === 1) {
                    const dbUserDoc: IUserDoc = couchGet.docs[0];
                    if (userDto.password === '') {
                                        userDto.password = dbUserDoc.password;
                    }

                    if (userDto.claims === undefined) {
                                        let abcclaims = [ 'duuzra.role.cms.admin', 'duuzra.client.' + userDto["client"] ];
                                        userDto.claims = abcclaims; 
                    }else if (userDto.claims === null || userDto.claims.length === 0) { 
                        userDto.claims = dbUserDoc.claims
                    }

                    const userDoc = UserManagementMapper.mapToDoc(userDto);
                    userDoc._rev = dbUserDoc._rev;

                    System.DB.save(userDoc)
                    .then((updateDoc: any) => {
                        resolve(updateDoc);
                    })
                    .catch((err: string) => {
                        reject(err);
                    });
                }
            }catch (err){
                return Promise.reject<IAuthUserDto>(err);

            }

        });
    }

    public async getAllUsers(authToken: string, correlationId, stringClientUuid): Promise<IAuthUserDto[]> {
        console.log("user-mgt.repository.ts getAllUsers()");
        try {
            let rawUsers = await System.DB.get(this.objectName, 'all') as any;

            if (rawUsers && rawUsers.docs.length > 0) {
                const userPromises = [];

                if (rawUsers.docs) {
                    rawUsers.docs.forEach((userDoc: IAuthUserDoc) => {
                        userPromises.push(UserManagementMapper.mapToObj(userDoc));
                    });
                }
                return Promise.all(userPromises);
            } else {
                return Promise.resolve(null);
            }
        }catch (err) { 
            return Promise.reject<IAuthUserDto[]>(err);
        }
    }

    public async getUserByUuid(authToken: string, correlationId: string, clientUuid: string, duuzraUuid: string, userUuid): Promise<IAuthUserDto> {
        console.log("user-mgt.repository.ts getUserByUuid()");
        let docId = 'auth-user_' + userUuid;

        try{
            let rawUsers = await System.DB.get(this.objectName, 'id', docId) as any;

            console.log('search for docId result here 1');
            if (rawUsers && rawUsers.docs.length === 1) {
                console.log('search for docId result here 2');
                return Promise.resolve(
                    UserManagementMapper.mapToObj(rawUsers.docs[0])
                );
            } else {
                console.log('search for docId result here 3');
                return Promise.resolve(null);
            }
        }catch(err){
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
            //return Promise.resolve<IAuthUserDto>(null);
        }
 
    }

    public async getUserByEmail(email: string): Promise<IAuthUserDto> {
        console.log("user-mgt.repository.ts getUserByEmail()");
        try {
            const rawUsers = await System.DB.get(this.objectName, 'email', email.toLowerCase()) as any;
            if (rawUsers && rawUsers.docs.length === 1) {
                return Promise.resolve(
                    UserManagementMapper.mapToObj(rawUsers.docs[0])
                );
            } else {
                return Promise.resolve(null);
            }
        } catch (err) { 
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
            //return Promise.reject<IAuthUserDto>(err);
        }
    }
 

    public async createUser(authToken: string, correlationId: string, clientUuid: string, userUuid: string, user: IAuthUserDto, client: IClientDto): Promise<IAuthUserDto> {
        console.log("user-mgt.repository.ts createUser()");
        try { 
            user.claims = [ 'duuzra.role.cms.admin', 'duuzra.client.' + user["client"] ];
            let userDoc = UserManagementMapper.mapToDoc(user);

            let couchGet = await System.DB.get(this.objectName, 'id', userDoc._id) as any;

            if (couchGet.docs.length === 0) { 
                let couchResponse = await System.DB.save(userDoc);
            } else { 
                return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
                //return Promise.reject<IAuthUserDto>(null);
            }

            return Promise.resolve(UserManagementMapper.mapToObj(userDoc));
        }catch (err) { 
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
            //return Promise.reject<IAuthUserDto>(err);
        }
    }

    public async deleteUser(userUuid: string): Promise<IAuthUserDto> {
        console.log("user-mgt.repository.ts DeleteUser()");
        try {
            let couchGet = await System.DB.get(this.objectName, 'id', 'auth-user_' + userUuid) as any; 

            if (couchGet.docs.length === 1) {
                let userDoc = couchGet.docs[0];
                userDoc._deleted = true;  
                let couchResponse = await System.DB.save(userDoc); 
                return Promise.resolve(await UserManagementMapper.mapToObj(userDoc));
            } else { 
                return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
                //return Promise.reject<IAuthUserDto>(null);
            }
        }catch (err) { 
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
            //return Promise.reject<IAuthUserDto>(err);
        }
    }

    
}

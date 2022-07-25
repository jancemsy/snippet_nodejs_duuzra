import { IDuuzraAccountDto } from '../../duuzra_types/duuzras';
import { IDuuzraAccountDoc } from '../../models/duuzra-account-doc';
import { System } from '../../shared';
import { DuuzraAccountMapper } from './account.mapper';
import { SessionRepository } from '../../shared/session/session.repository';

export abstract class IAccountRepository {
    public abstract async getAccountsByClient(clientId: string): Promise<IDuuzraAccountDto[]>;
    public abstract async getAccountByUuid(clientId: string, uuid: string): Promise<IDuuzraAccountDto>;
    public abstract async createAccount(clientId: string, account: IDuuzraAccountDto): Promise<IDuuzraAccountDto>;
    public abstract async deleteAccount(clientId: string, uuid: string): Promise<IDuuzraAccountDto>;
    public abstract async updateAccount(clientId: string, account: IDuuzraAccountDto): Promise<IDuuzraAccountDto>;
}

export class AccountRepository implements IAccountRepository {
    private readonly objectName = DuuzraAccountMapper.getViewType();

    // ####################################
    // # DATA READS
    // ####################################

    public async getAccountsByClient(clientUuid: string): Promise<IDuuzraAccountDto[]> {
        console.log("account.repository.ts getAccountsByClient()"); 
        try {
            let clientDocId = 'duuzra-client_' + clientUuid;
            let rawAccounts = await System.DB.get(this.objectName, 'clientId', clientDocId) as any;

            if (rawAccounts && rawAccounts.docs.length > 0) {
                let sortedAccount = (rawAccounts.docs as any[]).map((x) => DuuzraAccountMapper.mapToObj(x));
                sortedAccount.sort((leftAccount, rightAccount): number => {
                    if (leftAccount.name > rightAccount.name) {return 1};
                    if (leftAccount.name < rightAccount.name) {return -1};
                    return 0;
                });

                return Promise.resolve(sortedAccount);
            } else {
                return Promise.resolve(null);
            }
        } catch (err) { 
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
        }
    } 

    public async getAccountByUuid(clientId: string, accountUuid: string): Promise<IDuuzraAccountDto> {
        console.log("account.repository.ts getAccountsByUuid()"); 
        try { 
            let repo =   new SessionRepository();
            if (repo.validateDevice(clientId)) {
                let rawAccounts = await System.DB.get(this.objectName, 'uuid', accountUuid) as any;
                if (rawAccounts && rawAccounts.docs.length === 1) {
                    return Promise.resolve(
                        DuuzraAccountMapper.mapToObj(rawAccounts.docs[0])
                    );
                } else {
                    return Promise.resolve(null);
                }    
            }  
        } catch (err) { 
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
            //return Promise.reject<IDuuzraAccountDto>(err);
        }
    }

    
    
    public async deleteAccount(clientUuid: string, accountUuid: string): Promise<IDuuzraAccountDto> {
        console.log("account.repository.ts deleteAccount()"); 
        try { 
            let deletedArr = null; 
            let couchGet = await System.DB.get('duuzraClient', 'id', 'duuzra-client_' + clientUuid) as any; 
            if (couchGet.docs.length === 1) { 
                let clientDoc = couchGet.docs[0];
                let found = clientDoc.accounts.find((x, i, arr) => {
                    if (x.uuid === accountUuid) {
                        deletedArr = clientDoc.accounts.splice(i, 1);
                        return true;
                    } else {
                        return false;
                    }
                });

                if (found) { 
                    let couchResponse = await System.DB.save(clientDoc); 
                    return Promise.resolve(DuuzraAccountMapper.mapToObj(deletedArr[0]));
                } else { 
                    return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
                    //return Promise.reject<IDuuzraAccountDto>(null);
                }

            } else { 
                return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
                //return Promise.reject<IDuuzraAccountDto>(null);
            }

        } catch (err) { 
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
            //return Promise.reject<IDuuzraAccountDto>(err);
        }
    }
 
    public async updateAccount(clientUuid: string, account: IDuuzraAccountDto): Promise<IDuuzraAccountDto> { 
        console.log("account.repository.ts updateAccount()"); 
        try { 
            let accountDoc = DuuzraAccountMapper.mapToDoc(account); 
            let couchGet = await System.DB.get('duuzraClient', 'id', 'duuzra-client_' + clientUuid) as any; 

            if (couchGet.docs.length === 1) { 
                let clientDoc = couchGet.docs[0];
                let found = clientDoc.accounts.find((x, i, arr) => {
                    if (x.uuid === account.uuid) {
                        clientDoc.accounts.splice(i, 1, accountDoc);
                        return true;
                    } else {
                        return false;
                    }
                });

                if (found) { 
                    let couchResponse = await System.DB.save(clientDoc); 
                    return Promise.resolve(DuuzraAccountMapper.mapToObj(accountDoc));
                } else { 
                    return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
                    //return Promise.reject<IDuuzraAccountDto>(null);
                }
            } else { 
                return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
                //return Promise.reject<IDuuzraAccountDto>(null);
            }
        } catch (err) { 
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
            //return Promise.reject<IDuuzraAccountDto>(err);
        }
    }

    public async createAccount(clientUuid: string, account: IDuuzraAccountDto): Promise<IDuuzraAccountDto> {
        console.log("account.repository.ts createAccount()"); 
        try { 
            let accountDoc = DuuzraAccountMapper.mapToDoc(account); 
            let couchGet = await System.DB.get('duuzraClient', 'id', 'duuzra-client_' + clientUuid) as any; 
            if (couchGet.docs.length === 1) {

                let clientDoc = couchGet.docs[0];
                if (clientDoc.accounts) {
                    clientDoc.accounts.push(accountDoc); // todo - check for conflict
                } else {
                    clientDoc.accounts = [accountDoc];
                } 
                let couchResponse = await System.DB.save(clientDoc);
            } else { 
                return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
                //return Promise.reject<IDuuzraAccountDto>(null);
            }
 
            return Promise.resolve(DuuzraAccountMapper.mapToObj(accountDoc));
        } catch (err) { 
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
            //return Promise.reject<IDuuzraAccountDto>(err);
        }
    }

}

import { DateFormatter } from '../../duuzra_types/common';
import { IDuuzraFolderDto } from '../../duuzra_types/duuzras';
import { IDuuzraFolderDoc } from '../../models/duuzra-folder-doc';
import { System } from '../../shared';
import { DuuzraFolderMapper } from './folder.mapper';

export abstract class IFolderRepository {
    public abstract async getFoldersByClient(clientUuid: string): Promise<IDuuzraFolderDto[]>
    public abstract async getFoldersByAccount(clientUuid: string, accountUuid: string): Promise<IDuuzraFolderDto[]>;
    public abstract async getFolderByUuid(clientUuid: string, id: string): Promise<IDuuzraFolderDto>;
    public abstract async createFolder(clientUuid: string, folder: IDuuzraFolderDto): Promise<IDuuzraFolderDto>;
    public abstract async deleteFolder(clientUuid: string, uuid: string, deleteFolderContents: boolean): Promise<IDuuzraFolderDto>;
    public abstract async updateFolder(clientUuid: string, folder: IDuuzraFolderDto): Promise<IDuuzraFolderDto>;
    public abstract async batchUpdateFolders(clientUuid: string, folders: IDuuzraFolderDto[]): Promise<void>;
} 

export class FolderRepository implements IFolderRepository {
    private readonly objectName = DuuzraFolderMapper.getViewType();  
 
    public async getFoldersByAccount(clientUuid: string, accountUuid: string): Promise<IDuuzraFolderDto[]> { 
        console.log("folder.repository.ts getFoldersByAccount()");
        try {
            const rawFolders = await System.DB.get(this.objectName, 'accountUuid', accountUuid) as any;
            if (rawFolders && rawFolders.docs.length > 0) {
                return Promise.resolve(
                    (rawFolders.docs as any[]).map((x) => DuuzraFolderMapper.mapToObj(x))
                );
            } else {
                return Promise.resolve(null);
            }
        } catch (err) { 
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
            //return Promise.reject<IDuuzraFolderDto[]>(err);
        }
    }
 
    public async getFoldersByParentUuid(clientUuid: string, parentUuid: string): Promise<IDuuzraFolderDto[]> { 
        console.log("folder.repository.ts getFoldersByParentUuid()");
        try {
            const rawFolders = await System.DB.get(this.objectName, 'parentUuid', parentUuid) as any;
            if (rawFolders && rawFolders.docs.length > 0) {
                return Promise.resolve(
                    (rawFolders.docs as any[]).map((x) => DuuzraFolderMapper.mapToObj(x))
                );
            } else {
                return Promise.resolve(null);
            }
        } catch (err) { 
            return Promise.reject<IDuuzraFolderDto[]>(err);
        }
    }
 
    public async getFolderByUuid(clientUuid: string, folderUuid: string): Promise<IDuuzraFolderDto> {
        console.log("folder.repository.ts getFolderByUuid()");
        try {
            const rawFolders = await System.DB.get(this.objectName, 'uuid', folderUuid) as any;
            if (rawFolders && rawFolders.docs.length === 1) {
                return Promise.resolve(DuuzraFolderMapper.mapToObj(rawFolders.docs[0]));
            } else {
                return Promise.resolve(null);
            }
        } catch (err) { 
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
            //return Promise.reject<IDuuzraFolderDto>(err);
        }
    } 

    public async createFolder(clientUuid: string, folder: IDuuzraFolderDto): Promise<IDuuzraFolderDto> {
        console.log("folder.repository.ts createFolder()");
        try { 
            const folderDoc = DuuzraFolderMapper.mapToDoc(folder); 
            const couchGet = await System.DB.get('duuzraClient', 'id', 'duuzra-client_' + clientUuid) as any; 
            if (couchGet.docs.length === 1) { 
                const clientDoc = couchGet.docs[0]; 
                if (clientDoc.folders) {
                    clientDoc.folders.push(folderDoc); 
                } else {
                    clientDoc.folders = [folderDoc];
                } 
                const couchResponse = await System.DB.save(clientDoc);
            } else { 
                return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
                //return Promise.reject<IDuuzraFolderDto>(null);
            } 
            return Promise.resolve(DuuzraFolderMapper.mapToObj(folderDoc));
        } catch (err) { 
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
            //return Promise.reject<IDuuzraFolderDto>(err);
        }
    }

    public async updateFolder(clientUuid: string, folder: IDuuzraFolderDto): Promise<IDuuzraFolderDto> { 
        console.log("folder.repository.ts updateFolder()");
        try { 
            const folderDoc = DuuzraFolderMapper.mapToDoc(folder); 
            const couchGet = await System.DB.get('duuzraClient', 'id', 'duuzra-client_' + clientUuid) as any; 
            if (couchGet.docs.length === 1) { 
                const clientDoc = couchGet.docs[0];
                const found = clientDoc.folders.find((x, i, arr) => {
                    if (x.uuid === folder.uuid) {
                        clientDoc.folders.splice(i, 1, folderDoc);
                        return true;
                    } else {
                        return false;
                    }
                }); 
                if (found) { 
                    const couchResponse = await System.DB.save(clientDoc); 
                    return Promise.resolve(DuuzraFolderMapper.mapToObj(folderDoc));
                } else { 
                    return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
                    //return Promise.reject<IDuuzraFolderDto>(null);
                }
            } else { 
                return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
                //return Promise.reject<IDuuzraFolderDto>(null);
            }
        } catch (err) { 
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
            //return Promise.reject<IDuuzraFolderDto>(err);
        }
    }


    public async deleteFolder(clientUuid: string, folderUuid: string|string[]): Promise<IDuuzraFolderDto> {
        console.log("folder.repository.ts deleteFolder()");
        try {
            let deletedArr = null; 
            const couchGet = await System.DB.get('duuzraClient', 'id', 'duuzra-client_' + clientUuid) as any; 
            if (couchGet.docs.length === 1) { 
                const clientDoc = couchGet.docs[0];
                const found = clientDoc.folders.find((x, i, arr) => {
                    if (x.uuid === folderUuid) {
                        deletedArr = clientDoc.folders.splice(i, 1);
                        return true;
                    } else {
                        return false;
                    }
                });

                if (found) { 
                     const couchResponse = await System.DB.save(clientDoc); 
                     return Promise.resolve(DuuzraFolderMapper.mapToObj(deletedArr[0]));
                } else { 
                    return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
                    //return Promise.reject<IDuuzraFolderDto>(null); 
                } 
            } else { 
                return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
                //return Promise.reject<IDuuzraFolderDto>(null);
            } 
        } catch (err) { 
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
            //return Promise.reject<IDuuzraFolderDto>(err);
        }
    }
 
 
    public async batchUpdateFolders(clientUuid: string, folders: IDuuzraFolderDto[]): Promise<void> { 
        console.log("folder.repository.ts BatchUpdateFOlders()");
        try { 
            const couchGet = await System.DB.get('duuzraClient', 'id', 'duuzra-client_' + clientUuid) as any;             if (couchGet.docs.length === 1) { 
                const clientDoc = couchGet.docs[0];
                let hasChanges = false;
                folders.forEach((folder) => { 
                    const found = clientDoc.folders.find((x, i, arr) => {
                        if (x.uuid === folder.uuid) {
                            const folderDoc = DuuzraFolderMapper.mapToDoc(folder);
                            clientDoc.folders.splice(i, 1, folderDoc);
                            return true;
                        } else {
                            return false;
                        }
                    });

                    hasChanges = hasChanges || found;
                });

                if (hasChanges) {
                    const couchResponse = await System.DB.save(clientDoc);
                } 
                return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
                //return Promise.resolve<void>(null); 
            } else { 
                return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
                //return Promise.reject<void>(null);
            } 
        } catch (err) { 
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
            //return Promise.reject<void>(err);
        }
    }

    public async getFoldersByClient(clientUuid: string): Promise<IDuuzraFolderDto[]> { 
        console.log("folder.repository.ts getFoldersByClients()");
        try {
            const clientDocId = 'duuzra-client_' + clientUuid;
            const rawFolders = await System.DB.get(this.objectName, 'clientId', clientDocId) as any;
            if (rawFolders && rawFolders.docs.length > 0) {
                return Promise.resolve(
                    (rawFolders.docs as any[]).map((x) => DuuzraFolderMapper.mapToObj(x))
                );
            } else {
                return Promise.resolve(null);
            }
        } catch (err) { 
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
            //return Promise.reject<IDuuzraFolderDto[]>(err);
        }
    }
}

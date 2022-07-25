import { ServiceBase } from '../../core/services/index';
import { ITokenProvider } from '../../core/token/index';
import { DateFormatter } from '../../duuzra_types/common';
import { IDuuzraFolderDto } from '../../duuzra_types/duuzras';
import { CommunicationVerb } from '../../duuzra_types/network';
import { IDuuzraTokenPayload } from '../../duuzra_types/security';
import { FolderRepository } from './folder.repository';

export interface IFolderService {
    get(token: string, correlationId: string, scopeUuid: string, uuid: string): Promise<IDuuzraFolderDto>;
    get(token: string, correlationId: string, scopeUuid: string, filter?: any, sort?: any): Promise<IDuuzraFolderDto[]>;
    create(token: string, correlationId: string, scopeUuid: string, object: IDuuzraFolderDto): Promise<IDuuzraFolderDto>;
    update(token: string, correlationId: string, scopeUuid: string, object: IDuuzraFolderDto): Promise<IDuuzraFolderDto>
    delete(token: string, correlationId: string, scopeUuid: string, uuid: string, options?: any): Promise<IDuuzraFolderDto>;
}
export class FolderService extends ServiceBase<IDuuzraFolderDto> implements IFolderService {
    private folderRepo: FolderRepository;

    constructor() {
        super();
        this.folderRepo = new FolderRepository();
    }

    // ####################################
    // # DATA READS
    // ####################################

    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuid: string): Promise<IDuuzraFolderDto>;
    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, filters?: any, sort?: any): Promise<IDuuzraFolderDto[]>
    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, filters?: any, sort?: any): Promise<IDuuzraFolderDto | IDuuzraFolderDto[]> {
        console.log("folder.service.ts getAction()");
        // TODO: Vital security to be implemented here to ensure no data leakage.
        // We are not currently validating that the snapshot is part of the client.
        if (this.isUuidQuery(filters)) {
            return await this.folderRepo.getFolderByUuid(scopeUuid, filters as string);
        } else {
            const map: Map<boolean, () => Promise<IDuuzraFolderDto[]>> = new Map();

            // These will be exclusive. Doesn't require more than 1. Adding to a map is erroneous.
            // therefore the aggragate is erroneous
            if (filters && filters.accountUuid) {
                map.set(!!filters.accountUuid, () => this.folderRepo.getFoldersByAccount(scopeUuid, filters.accountUuid));
            } else {
                map.set(!!scopeUuid, () => this.folderRepo.getFoldersByClient(scopeUuid));
            }

            return this.getResultsFromPrioritizedConditions(map, filters, sort);
        }
    }

    // ####################################
    // # DATA CHANGES
    // ####################################

    public async createAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, object: IDuuzraFolderDto): Promise<IDuuzraFolderDto>;
    public async createAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, object: IDuuzraFolderDto[]): Promise<IDuuzraFolderDto[]>;
    public async createAction(
        tokenProvider: ITokenProvider,
        correlationId: string,
        scopeUuid: string,
        object: IDuuzraFolderDto | IDuuzraFolderDto[]
    ): Promise<IDuuzraFolderDto | IDuuzraFolderDto[]> {
        console.log("folder.service.ts createAction()");
        return this.implementSingleOnly(CommunicationVerb.POST, object, async () => {
            const objectSingle: IDuuzraFolderDto = object as IDuuzraFolderDto;
            return this.folderRepo.createFolder(scopeUuid, objectSingle);
        });
    }

    protected async updateAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, object: IDuuzraFolderDto): Promise<IDuuzraFolderDto> {
        return this.folderRepo.updateFolder(scopeUuid, object);
    }

    protected async deleteAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuid: string, options?: any): Promise<IDuuzraFolderDto>;
    protected async deleteAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuids: string[], options?: any): Promise<IDuuzraFolderDto[]>;
    protected async deleteAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuids: string | string[], options?: any): Promise<IDuuzraFolderDto | IDuuzraFolderDto[]> {
        console.log("folder.service.ts deleteAction()");
        return this.implementSingleOnly(CommunicationVerb.POST, uuids, async () => {
               if (options["isDeletedPermanently"] == true) {
                  if (uuids){
                const deleteResponse = await this.folderRepo.deleteFolder(scopeUuid, uuids);
                return deleteResponse; }
            } else {
                const uuidSingle: string = uuids as string;
                const dateDeletedStr = new DateFormatter(null).toString();
                const folderToDelete = await this.folderRepo.getFolderByUuid(scopeUuid, uuidSingle);
                const folderToDeleteChildren = await this.folderRepo.getFoldersByParentUuid(scopeUuid, folderToDelete.uuid);
                const folderToDeleteDuuzras = folderToDelete.duuzraUuids;
                folderToDelete.dateDeleted = dateDeletedStr;

                if (!!options && !options.cascadeDelete) {
                    folderToDelete.duuzraUuids = [];
                }

                let foldersBatchUpdate = [folderToDelete];

                // Handle Child Folders - Folders
                if (folderToDeleteChildren && folderToDeleteChildren.length > 0) {
                    folderToDeleteChildren.forEach((childFolder: IDuuzraFolderDto) => {
                        if (!!options && options.cascadeDelete) {
                            // Set Folder Deleted
                            childFolder.dateDeleted = dateDeletedStr;
                        } else {
                            // Move folders to parent
                            childFolder.parentUuid = '';
                        }
                    });

                    foldersBatchUpdate = foldersBatchUpdate.concat(folderToDeleteChildren);
                }

                // Handle Parent Folder - Duuzras
                if (folderToDelete.parentUuid && folderToDelete.parentUuid !== '') {
                    const parentFolder = await this.folderRepo.getFolderByUuid(scopeUuid, folderToDelete.parentUuid);

                    /* Duuzras will be deallocated from the folder and moved to the parent if possible*/
                    parentFolder.duuzraUuids = parentFolder.duuzraUuids.concat(folderToDeleteDuuzras);

                    foldersBatchUpdate = foldersBatchUpdate.concat(parentFolder);
                }
                await this.folderRepo.batchUpdateFolders(scopeUuid, foldersBatchUpdate);
                return folderToDelete;
                }
        }) as Promise<IDuuzraFolderDto>;
    }

    // #####################################
    // # PRIVATE
    // #####################################

    /**
     * Takes to full object that is about to be deleted and updates it's child folders to be children of the parent.
     * note - this is the behaviour implemented in the interface.
     * @param folderToDelete
     */
    /*
    private applyFolderDeleteToOthers(folderToDelete: IDuuzraFolderDto) {
        // Any child folder now become children of the deleted parent (or root)
        this.folderRepo.getFoldersByParentUuid(folderToDelete.uuid).then((childFolders: IDuuzraFolderDto[]) => {
            if (childFolders && childFolders.length) {
                childFolders.forEach((childFolder: IDuuzraFolderDto) => {
                    childFolder.parentUuid = folderToDelete.parentUuid;
                    this.folderRepo.updateFolder(childFolder);
                });
            }
        });

        // Any child duuzra now become children of the deleted parent (or root)
        if (folderToDelete.parentUuid && folderToDelete.parentUuid !== '') {
            this.folderRepo.getFolderByUuid(folderToDelete.parentUuid).then((folderToDeleteParent: IDuuzraFolderDto) => {
                if (folderToDeleteParent && folderToDeleteParent.duuzraUuids && folderToDeleteParent.duuzraUuids.length > 0) {
                    folderToDelete.duuzraUuids.forEach((duuzraUuid: string) => {
                        folderToDelete.duuzraUuids.push(duuzraUuid);
                    });
                } else {
                    folderToDeleteParent.duuzraUuids = folderToDelete.duuzraUuids;
                }
                this.folderRepo.updateFolder(folderToDeleteParent);
            });
        }
    }*/
}

import { IDuuzraContentDto } from '../../duuzra_types/duuzras';
import { CommunicationVerb } from '../../duuzra_types/network';
import { IDuuzraTokenPayload } from '../../duuzra_types/security';
import { ServiceBase } from '../../core/services/index';
import { ITokenProvider } from '../../core/token/index';
import { ContentRepository } from './content.repository';
import { filter } from '../../../node_modules/@types/minimatch';

export interface IContentService {
    get(token: string, correlationId: string, scopeUuid: string, filter?: any, sort?: any): Promise<IDuuzraContentDto[]>;
    create(token: string, correlationId: string, scopeUuid: string, object: IDuuzraContentDto): Promise<IDuuzraContentDto>;
    update(token: string, correlationId: string, scopeUuid: string, object: any): Promise<any>
    delete(token: string, correlationId: string, scopeUuid: string, uuid: string): Promise<IDuuzraContentDto>;
}
export class ContentService extends ServiceBase<IDuuzraContentDto> implements IContentService {
    private contentRepo: ContentRepository;

    constructor() {
        super();
        this.contentRepo = new ContentRepository();
    }

    // ####################################
    // # DATA READS
    // ####################################

    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuid: string): Promise<IDuuzraContentDto>;
    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, filters?: any, sort?: any): Promise<IDuuzraContentDto[]>; 
    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, filters?: any, sort?: any  ): Promise<IDuuzraContentDto | IDuuzraContentDto[]   > { 


 

        if (filters) {
            if (filters.duplicate !== undefined && filters.duplicate !== null) {
                if (filters.duplicate){
                    const result = await this.contentRepo.DuplicateDuuzraContent(scopeUuid, filters.targetUuid);
                    return result;
                }
            } else {
                if (this.isUuidQuery(filters)) {
                    return await this.contentRepo.getContentByUuid(null, scopeUuid, filters as string);
                } else {
                    const result: IDuuzraContentDto[] = await this.contentRepo.getContentsByDuuzra(scopeUuid);
                    return this.applyFiltersAndSorts(result, filters, sort);
                }
            }
        } else {
            const result: IDuuzraContentDto[] = await this.contentRepo.getContentsByDuuzra(scopeUuid);
            return this.applyFiltersAndSorts(result, filters, sort);
        }

    }

    // ####################################
    // # DATA CHANGES
    // ####################################

    public async createAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, object: IDuuzraContentDto, flag: boolean, heightAndWidth: any): Promise<IDuuzraContentDto>;
    public async createAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, object: IDuuzraContentDto[], flag: boolean, heightAndWidth: any): Promise<IDuuzraContentDto[]>;
    public async createAction(
        tokenProvider: ITokenProvider,
        correlationId: string,
        scopeUuid: string,
        object: IDuuzraContentDto | IDuuzraContentDto[],
        flag: boolean,
        heightAndWidth: object
    ): Promise<IDuuzraContentDto | IDuuzraContentDto[]> {
        console.log("content.service.ts CreateAction()");

        return this.implementSingleOnly(CommunicationVerb.POST, object, async () => { 
            const objectSingle: IDuuzraContentDto = object as IDuuzraContentDto;
            if (objectSingle.contentType === 'Agenda') {
                // This doesn't work
                const contentType = await this.contentRepo.checkContent(null, scopeUuid, 'Agenda') as any;
                if (contentType) {
                    return this.contentRepo.createContent(null, scopeUuid, objectSingle, flag, heightAndWidth)
                } else {
                    Promise.reject(new Error('There is already an agenda.'));
                }
            } else {
                return this.contentRepo.createContent(null, scopeUuid, objectSingle, flag, heightAndWidth)
            }
        });
    }
 
    protected async updateAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, object: any): Promise<any> {    
        console.log("content.service.ts UpdateAction()");
        if (object.api_action && object.api_action == 'attendee-visibility-update') { //custom cue variable to trigger if it is for  snapshot slide visibility.   
            await this.contentRepo.updateDuuzraSnapshotSlideVisibility(object.duuzraUuid, object.contentUuid, object.slideUuid, object.isVisibleToAttendees);    
            return true;
        }else if (object.api_action && object.api_action == 'attendee-visibility-get') {    
            return new Promise<any>(resolve => {
                this.contentRepo.getContentAttachmentVisibility(object.duuzraUuid, object.contentUuid, object.slideUuid).then(res => { 
                    resolve(res);
                }); 
            });    
             
        } else {
            return this.contentRepo.updateContent(null, scopeUuid, object);    
        }
        
    }

    protected async deleteAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuid: string): Promise<IDuuzraContentDto>;
    protected async deleteAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuids: string[]): Promise<IDuuzraContentDto[]>;
    protected async deleteAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuids: string | string[]): Promise<IDuuzraContentDto | IDuuzraContentDto[]> {
        console.log("content.service.ts DeteteAction()");
        return this.implementSingleOnly(CommunicationVerb.POST, uuids, () => {
            const uuidSingle: string = uuids as string;
            return this.contentRepo.deleteContent(null, scopeUuid, uuidSingle);
        });
    }
}

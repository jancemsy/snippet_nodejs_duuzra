import { ServiceBase } from '../../core/services/index';
import { ITokenProvider } from '../../core/token/index';
import { IDuuzraContentTypeTemplateDto } from '../../duuzra_types/duuzras';
import { CommunicationVerb } from '../../duuzra_types/network';
import { DuuzraInfoService, IDuuzraInfoService } from '../duuzra-info/duuzra-info.service';
import { DuuzraContentTypeTemplateRepository, IDuuzraContentTypeTemplateRepository } from './duuzra-contenttypetemplate.repository';

export interface IDuuzraContentTypeTemplateService {
    get(token: string, correlationId: string, scopeUuid: string, filter?: any, sort?: any): Promise<IDuuzraContentTypeTemplateDto[]>;
    create(token: string, correlationId: string, scopeUuid: string, object: IDuuzraContentTypeTemplateDto): Promise<IDuuzraContentTypeTemplateDto>;
}
export class DuuzraContentTypeTemplateService extends ServiceBase<IDuuzraContentTypeTemplateDto> implements IDuuzraContentTypeTemplateService {

    private infoService: IDuuzraInfoService;
    private contentTypeTemplateRepo: IDuuzraContentTypeTemplateRepository;

    // ##########################################################################
    // # LIFECYCLE
    // ##########################################################################

    constructor() {
        super();
        this.contentTypeTemplateRepo = new DuuzraContentTypeTemplateRepository();
        this.infoService = new DuuzraInfoService();
    }

    // ####################################
    // # DATA READS
    // ####################################

    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuid: string): Promise<IDuuzraContentTypeTemplateDto>;
    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, filters?: any, sort?: any): Promise<IDuuzraContentTypeTemplateDto[]>
    public async getAction(
        tokenProvider: ITokenProvider,
        correlationId: string,
        scopeUuid: string,
        filters?: any,
        sort?: any
    ): Promise<IDuuzraContentTypeTemplateDto | IDuuzraContentTypeTemplateDto[]> {
        console.log("duuzra-contenttemplate.service.ts getAction()");
        if (this.isUuidQuery(filters)) { // TODO: Content types needs a duuzraUuid but it's scope is user. Ideally come up with a mechanism so that we don't have to use filters.duuzraUuid
            return await this.contentTypeTemplateRepo.getContentTypeTemplateByUuid(null, filters.duuzraUuid, filters as string) as IDuuzraContentTypeTemplateDto;
        } else if (!!filters && !!filters.duuzraUuid) {
            const result: IDuuzraContentTypeTemplateDto[] = await this.contentTypeTemplateRepo.getContentTypeTemplatesByDuuzraUuid(null, filters.duuzraUuid);
            return this.applyFiltersAndSorts(result, filters, sort);
        }
    }

    // ####################################
    // # DATA CHANGES
    // ####################################

    public async createAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, object: IDuuzraContentTypeTemplateDto): Promise<IDuuzraContentTypeTemplateDto>;
    public async createAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, object: IDuuzraContentTypeTemplateDto[]): Promise<IDuuzraContentTypeTemplateDto[]>;
    public async createAction(
        tokenProvider: ITokenProvider,
        correlationId: string,
        scopeUuid: string,
        object: IDuuzraContentTypeTemplateDto | IDuuzraContentTypeTemplateDto[]
    ): Promise<IDuuzraContentTypeTemplateDto | IDuuzraContentTypeTemplateDto[]> {
        console.log("duuzra-contenttemplate.service.ts createAction()");
        return this.implementSingleOnly(
            CommunicationVerb.POST,
            object,
            async () => {
                const objectSingle: IDuuzraContentTypeTemplateDto = object as IDuuzraContentTypeTemplateDto;
                return this.contentTypeTemplateRepo.createContentTypeTemplate(
                    tokenProvider.payload.uuid,
                    objectSingle.duuzraUuid,
                    objectSingle)
            }
        );
    }
}

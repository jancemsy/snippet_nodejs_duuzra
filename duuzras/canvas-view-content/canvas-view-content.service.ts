import { IDuuzraContentDto } from '../../duuzra_types/duuzras';
import { CommunicationVerb } from '../../duuzra_types/network';
import { IDuuzraTokenPayload } from '../../duuzra_types/security';
import { ServiceBase } from '../../core/services/index';
import { ITokenProvider } from '../../core/token/index';
import { CanvasViewContentRepository } from './canvas-view-content.repository';
import { filter } from '../../../node_modules/@types/minimatch';

export interface IContentService {
    create(token: string, correlationId: string, scopeUuid: string, object: IDuuzraContentDto): Promise<IDuuzraContentDto>;
    delete(token: string, correlationId: string, scopeUuid: string, uuid: string, options?: any): Promise<IDuuzraContentDto>;
}
export class CanvasViewContentService extends ServiceBase<IDuuzraContentDto> implements IContentService {
    private contentRepo: CanvasViewContentRepository;

    constructor() {
        super();
        this.contentRepo = new CanvasViewContentRepository();
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
        console.log("canvas-view-content.service.ts createAction()");

        return this.implementSingleOnly(CommunicationVerb.POST, object, async () => { 
            const objectSingle: IDuuzraContentDto = object as IDuuzraContentDto;
            return this.contentRepo.canvasViewContentCreate(null, scopeUuid, objectSingle)
        });
    }



    protected async deleteAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuid: string): Promise<IDuuzraContentDto>;
    protected async deleteAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuids: string[]): Promise<IDuuzraContentDto[]>;
    protected async deleteAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuids: string | string[]): Promise<IDuuzraContentDto | IDuuzraContentDto[]> {
        console.log("canvas-view-content.service.ts DeleteAction()");
        return this.implementSingleOnly(CommunicationVerb.POST, uuids, () => { 
            const uuidSingle: string = uuids as string;
            return this.contentRepo.deleteCanvasContent(null, scopeUuid, uuidSingle);
        });
    }

}

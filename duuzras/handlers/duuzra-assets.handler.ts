import { IDuuzraMediaDto } from '../../duuzra_types/duuzras';
import { CommunicationStatuses, CommunicationSuccessResponse, ICommunication } from '../../duuzra_types/network';
import { HandlerBaseClientDuuzraScope } from '../../core/handlers/base/handler-base-client-duuzra-scope.handler';
import { ContentService, IContentService, IMediaService, MediaService } from '../index';

export class DuuzraAssetsHandler extends HandlerBaseClientDuuzraScope<IDuuzraMediaDto, string> {

    protected service: IMediaService;

    constructor() {
        super(new MediaService());
    }

    protected async processGet(
        communication: ICommunication<string>,
        correlationId: string,
        scopeUuid: string,
        uuid: string
    ): Promise<CommunicationSuccessResponse<string>>;
    protected async processGet(
        communication: ICommunication<IDuuzraMediaDto>,
        correlationId: string,
        scopeUuid: string,
        uuid: string
    ): Promise<CommunicationSuccessResponse<IDuuzraMediaDto>>;
    protected async processGet(
        communication: ICommunication<IDuuzraMediaDto[]>,
        correlationId: string,
        scopeUuid: string,
        filters: any,
        sort: any
    ): Promise<CommunicationSuccessResponse<IDuuzraMediaDto[]>>;
    protected async processGet(
        communication: ICommunication<IDuuzraMediaDto | IDuuzraMediaDto[] | string>,
        correlationId: string,
        scopeUuid: string,
        filters?: any,
        sort?: any
    ): Promise<CommunicationSuccessResponse<IDuuzraMediaDto | IDuuzraMediaDto[] | string>> {
        console.log("duuzra-assets.handler.ts processGet");
        const result: string = await this.service.exportMedia(this.tokenProvider.token, correlationId, scopeUuid, filters, sort);
        return new CommunicationSuccessResponse(result, CommunicationStatuses.OK);
    }
}

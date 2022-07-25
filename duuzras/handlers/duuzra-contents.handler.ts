import { IDuuzraContentDto, IAppAnalyticsDto } from '../../duuzra_types/duuzras';
import {
    CommandTypes,
    CommandVerbs,
    CommunicationFactory,
    CommunicationHandler,
    CommunicationStatuses,
    ICommunication
} from '../../duuzra_types/network';
import { HandlerBaseDuuzraScope } from '../../core/handlers/index';
import { ServiceBaseHandler } from '../../core/index';
import { ContentService, IContentService } from '../contents';

export class DuuzraContentsHandler extends HandlerBaseDuuzraScope<IDuuzraContentDto> {

    constructor() {
        super(new ContentService());
    }

    protected async validateClaimsGet(communication: ICommunication<IDuuzraContentDto | IDuuzraContentDto[]>): Promise<ICommunication<IDuuzraContentDto | IDuuzraContentDto[]>> {
        return this.validateClaimsSuperAdminCmsAdminCmsEditor(communication);
    }

    protected async validateClaimsPost(communication: ICommunication<IDuuzraContentDto | IDuuzraContentDto[]>): Promise<ICommunication<IDuuzraContentDto | IDuuzraContentDto[]>> {
        return this.validateClaimsSuperAdminCmsAdminCmsEditor(communication);
    }

    protected async validateClaimsPut(communication: ICommunication<IDuuzraContentDto>): Promise<ICommunication<IDuuzraContentDto>> {
        return this.validateClaimsSuperAdminCmsAdminCmsEditor(communication as ICommunication<IDuuzraContentDto>) as Promise<ICommunication<IDuuzraContentDto>>;
    }

    protected async validateClaimsDelete(communication: ICommunication<IDuuzraContentDto | IDuuzraContentDto[]>): Promise<ICommunication<IDuuzraContentDto | IDuuzraContentDto[]>> {
        return this.validateClaimsSuperAdminCmsAdminCmsEditor(communication);
    }
}

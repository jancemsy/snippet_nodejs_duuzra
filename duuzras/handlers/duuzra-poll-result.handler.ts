import { IDuuzraAccountDto, IAppPollAnalyticsDto } from '../../duuzra_types/duuzras';

import {
    CommandVerbs,
    CommunicationEmptyRequiredClientUuidResponse,
    CommunicationFactory,
    CommunicationForbiddenErrorResponse,
    CommunicationInvalidClaimsErrorResponse,
    CommunicationNoMatchingClientUuidResponse,
    CommunicationStatuses,
    CommunicationSuccessResponse,
    ICommunication
} from '../../duuzra_types/network';

import { HandlerBase, HandlerBaseClientScope } from '../../core/handlers/index'
import { IServiceBase } from '../../core/services/index';
import { AccountService, IAccountService } from '../accounts/index';
import { DuuzraPermissions } from '../duuzra.permissions';
import { AnalyticsPollResultService } from '../analytics-poll-result/analytics-poll-result.service';

export class DuuzraPollResultHandler extends HandlerBaseClientScope<IAppPollAnalyticsDto> {

    constructor() {
        super(new AnalyticsPollResultService());
    }

    protected async validateClaimsGet(communication: ICommunication<IAppPollAnalyticsDto | IAppPollAnalyticsDto[]>): Promise<ICommunication<IAppPollAnalyticsDto | IAppPollAnalyticsDto[]>> {
        return this.validateClaimsSuperAdminCmsAdmin(communication);
    }

    protected async validateClaimsPost(communication: ICommunication<IAppPollAnalyticsDto>): Promise<ICommunication<IAppPollAnalyticsDto>> {
        return this.validateClaimsSuperAdminCmsAdmin(communication) as Promise<ICommunication<IAppPollAnalyticsDto>>;
    }

    protected async validateClaimsPut(communication: ICommunication<IAppPollAnalyticsDto>): Promise<ICommunication<IAppPollAnalyticsDto>> {
        return this.validateClaimsSuperAdminCmsAdmin(communication) as Promise<ICommunication<IAppPollAnalyticsDto>>;
    }

    protected async validateClaimsDelete(communication: ICommunication<IAppPollAnalyticsDto>): Promise<ICommunication<IAppPollAnalyticsDto>> {
        return this.validateClaimsSuperAdmin(communication) as Promise<ICommunication<IAppPollAnalyticsDto>>;
    }
}

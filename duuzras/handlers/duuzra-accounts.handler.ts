import { IDuuzraAccountDto } from '../../duuzra_types/duuzras';
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

export class DuuzraAccountsHandler extends HandlerBaseClientScope<IDuuzraAccountDto> {

    constructor() {
        super(new AccountService());
    }

    protected async validateClaimsGet(communication: ICommunication<IDuuzraAccountDto | IDuuzraAccountDto[]>): Promise<ICommunication<IDuuzraAccountDto | IDuuzraAccountDto[]>> {
        return this.validateClaimsSuperAdminCmsAdmin(communication);
    }

    protected async validateClaimsPost(communication: ICommunication<IDuuzraAccountDto>): Promise<ICommunication<IDuuzraAccountDto>> {
        return this.validateClaimsSuperAdminCmsAdmin(communication) as Promise<ICommunication<IDuuzraAccountDto>>;
    }

    protected async validateClaimsPut(communication: ICommunication<IDuuzraAccountDto>): Promise<ICommunication<IDuuzraAccountDto>> {
        return this.validateClaimsSuperAdminCmsAdmin(communication) as Promise<ICommunication<IDuuzraAccountDto>>;
    }

    protected async validateClaimsDelete(communication: ICommunication<IDuuzraAccountDto>): Promise<ICommunication<IDuuzraAccountDto>> {
        return this.validateClaimsSuperAdmin(communication) as Promise<ICommunication<IDuuzraAccountDto>>;
    }
}

import { IAttendeeDto } from '../../duuzra_types/duuzras';
import {
    CommandTypes,
    CommandVerbs,
    CommunicationFactory,
    CommunicationForbiddenErrorResponse,
    CommunicationHandler,
    CommunicationInvalidClaimsErrorResponse,
    CommunicationStatuses,
    ICommunication
} from '../../duuzra_types/network';
import { HandlerBaseDuuzraScope } from '../../core/handlers/index';
import {AttendeeService, IAttendeeService } from '../attendees';

import { ServiceBaseHandler } from '../../core/index';

export class DuuzraAttendeesHandler extends HandlerBaseDuuzraScope<IAttendeeDto>  {

    constructor() {
        super(new AttendeeService());
    }

    protected async validateClaimsGet(communication: ICommunication<IAttendeeDto | IAttendeeDto[]>): Promise<ICommunication<IAttendeeDto | IAttendeeDto[]>> {
        return this.validateClaimsSuperAdminCmsAdmin(communication);
    }

    protected async validateClaimsPost(communication: ICommunication<IAttendeeDto | IAttendeeDto[]>): Promise<ICommunication<IAttendeeDto | IAttendeeDto[]>> {
        return this.validateClaimsSuperAdminCmsAdmin(communication);
    }

    protected async validateClaimsPut(communication: ICommunication<IAttendeeDto>): Promise<ICommunication<IAttendeeDto>> {
        return this.validateClaimsSuperAdminCmsAdmin(communication as ICommunication<IAttendeeDto>) as Promise<ICommunication<IAttendeeDto>>;
    }

    protected async validateClaimsDelete(communication: ICommunication<IAttendeeDto | IAttendeeDto[]>): Promise<ICommunication<IAttendeeDto | IAttendeeDto[]>> {
        return this.validateClaimsSuperAdminCmsAdmin(communication);
    }
}

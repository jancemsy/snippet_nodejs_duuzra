import { IAuthClaimDto, IAuthUserDto } from '../../duuzra_types/auth';

import { HandlerBaseDuuzraScope } from '../../core/handlers/index';
import { UserManagementService, IUserManagementService } from '../index';

export class UserManagementHandler extends HandlerBaseDuuzraScope<IAuthUserDto> {
    constructor() {
        super(new UserManagementService());
    }
}

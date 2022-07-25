import { HandlerBaseDuuzraScope } from '../../core/handlers/index';
import { UserDataCollationService } from '../user-data/index';

export class GetUserDataCollationHandler extends HandlerBaseDuuzraScope<any> {
    constructor() {
        super(new UserDataCollationService());
    }
}

import { HandlerBaseDuuzraScope } from '../../core/handlers/index';
import { UserDataService } from '../user-data/index';

export class GetUserDataHandler extends HandlerBaseDuuzraScope<any> {
    constructor() {
        super(new UserDataService());
    }
}

import { HandlerBaseDuuzraScope } from '../../core/handlers/index';
import { UserDataItemService } from '../user-data/index';

export class SetUserDataItemHandler extends HandlerBaseDuuzraScope<any> {
    constructor() {
        super(new UserDataItemService());
    }
}

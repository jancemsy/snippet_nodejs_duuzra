
import { HandlerBaseUserScope } from '../../core/handlers/index';
import { DuuzraUserService } from '../index';

export class DuuzraUsersHandler extends HandlerBaseUserScope<any> {
    constructor() {
        super(new DuuzraUserService());
    }
}

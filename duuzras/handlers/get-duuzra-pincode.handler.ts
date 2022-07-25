import { HandlerBaseDuuzraScope, HandlerBaseUserScope } from '../../core/handlers/index';
import { DuuzraSnapshotService } from '../duuzra-snapshot/index';
import { DuuzraUserService } from '../index';

export class GetDuuzraPinCodeHandler extends HandlerBaseUserScope<any> {
    constructor() {
        super(new DuuzraSnapshotService());
    }
}

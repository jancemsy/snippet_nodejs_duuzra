import { IMessageEnvelope } from '../../duuzra_types/messenger';
import { ServiceBaseHandler } from '../../core/index';
import { DuuzraSnapshotService } from '../duuzra-snapshot/duuzra-snapshot.service';

import { HandlerBaseUserScope } from '../../core/handlers/index';

export class GetDuuzraUrlTokenHandler extends HandlerBaseUserScope<any> {
    constructor() {
        super(new DuuzraSnapshotService());
    }
}

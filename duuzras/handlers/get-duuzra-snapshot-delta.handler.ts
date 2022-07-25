import { IMessageEnvelope } from '../../duuzra_types/messenger';
import { HandlerBaseDuuzraScope } from '../../core/handlers/index';
import { ServiceBaseHandler } from '../../core/index';
import { SnapshotDeltaService } from '../snapshot-delta/snapshot-delta.service';

export class GetDuuzraSnapshotDeltaHandler extends HandlerBaseDuuzraScope<any> {
    constructor() {
        super(new SnapshotDeltaService());
    }
}

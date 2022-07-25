import { ISnapshotDeltaDto } from '../../duuzra_types/duuzras';
import { HandlerBaseDuuzraScope, HandlerBaseUserScope } from '../../core/handlers/index';
import { DuuzraSnapshotRepository, IDuuzraSnapshotRepository } from '../duuzra-snapshot/duuzra-snapshot.repository';
import { ISnapshotDeltaService, SnapshotDeltaService } from '../snapshot-delta/snapshot-delta.service';

export class DuuzraLatestSnapshotHandler extends HandlerBaseDuuzraScope<ISnapshotDeltaDto> {
    constructor() {
        super(new SnapshotDeltaService());
    }
}

import { IDuuzraSnapshotDto } from '../../duuzra_types/duuzras';
import { HandlerBaseDuuzraScope } from '../../core/handlers/index';
import { DuuzraSnapshotService, IDuuzraSnapshotService } from '../duuzra-snapshot';
import { DuuzraSnapshotRepository, IDuuzraSnapshotRepository } from '../duuzra-snapshot/duuzra-snapshot.repository';

export class DuuzraSnapshotHandler extends HandlerBaseDuuzraScope<IDuuzraSnapshotDto> {
    constructor() {
        super(new DuuzraSnapshotService());
    }
}

import { ISnapshotInfoDto } from '../../duuzra_types/duuzras';
import { HandlerBaseUserScope } from '../../core/handlers/index';
import { ISnapshotInfoService, SnapshotInfoService } from '../snapshot-info';

export class DuuzraListHandler extends HandlerBaseUserScope<ISnapshotInfoDto> {
    constructor() {
        super(new SnapshotInfoService());
    }
}

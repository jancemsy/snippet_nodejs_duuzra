import { IDuuzraInfo } from '../../duuzra_types/duuzras';
import { HandlerBaseUserScope } from '../../core/handlers/index';
import { DuuzraListCacheService, IDuuzraListCacheService } from '../duuzra-list-cache';

export class DuuzraListCacheHandler extends HandlerBaseUserScope<IDuuzraInfo> {
    constructor() {
        super(new DuuzraListCacheService());
    }
}

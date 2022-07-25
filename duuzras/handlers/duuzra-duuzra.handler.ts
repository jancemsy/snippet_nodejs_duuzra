import { IDuuzraDto } from '../../duuzra_types/duuzras';

import { HandlerBaseClientScope } from '../../core/handlers/index';
import { DuuzraService, IDuuzraService } from '../duuzra-duuzra';

export class DuuzraDuuzraHandler extends HandlerBaseClientScope<IDuuzraDto> {
    constructor() {
        super(new DuuzraService());
    }
}

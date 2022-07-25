import { IDuuzraInfoDto } from '../../duuzra_types/duuzras';
import { HandlerBaseClientScope } from '../../core/handlers/index';
import { DuuzraInfoService, IDuuzraInfoService } from '../duuzra-info';

export class DuuzraInfoHandler extends HandlerBaseClientScope<IDuuzraInfoDto> {
    constructor() {
        super(new DuuzraInfoService());
    }
}

import { IClientDto } from '../../duuzra_types/duuzras';

import { HandlerBaseDuuzraScope } from '../../core/handlers/index';
import { ClientService, IClientService } from '../index';

export class DuuzraClientHandler extends HandlerBaseDuuzraScope<IClientDto> {
    constructor() {
        super(new ClientService());
    }
}

import { IDuuzraMediaDto } from '../../duuzra_types/duuzras';

import { HandlerBaseClientDuuzraScope } from '../../core/handlers/base/handler-base-client-duuzra-scope.handler';
import { ServiceBaseHandler } from '../../core/index';
import { DuuzraPermissions } from '../duuzra.permissions';
import { IMediaService, MediaService } from '../media';

export class DuuzraMediasHandler extends HandlerBaseClientDuuzraScope<IDuuzraMediaDto> {
    constructor() {
        super(new MediaService());
    }
}

import { IDuuzraFolderDto } from '../../duuzra_types/duuzras';

import { HandlerBaseClientScope } from '../../core/handlers/base/handler-base-client-scope.handler';
import { ServiceBaseHandler } from '../../core/index';
import { DuuzraPermissions } from '../duuzra.permissions';
import { FolderService, IFolderService } from '../folders';

export class DuuzraFoldersHandler extends HandlerBaseClientScope<IDuuzraFolderDto> {
    constructor() {
        super(new FolderService());
    }
}

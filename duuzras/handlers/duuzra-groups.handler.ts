import { IGroupDto } from '../../duuzra_types/duuzras';
import { HandlerBaseDuuzraScope } from '../../core/handlers/index';
import { ServiceBaseHandler } from '../../core/index';
import { GroupService, IGroupService  } from '../groups/group.service';

export class DuuzraGroupsHandler extends HandlerBaseDuuzraScope<IGroupDto> {
    constructor() {
        super(new GroupService());
    }
}

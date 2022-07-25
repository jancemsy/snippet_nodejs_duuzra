import { NotificationAddRemoveLogDto } from '../notification/model';
import { HandlerBaseClientScope, HandlerBaseDuuzraScope } from '../../core/handlers/index';
import { NotificationAddRemoveService, INotificationAddRemoveService } from '../notification';

export class NotificationAddRemoveHandler extends HandlerBaseDuuzraScope<NotificationAddRemoveLogDto> {
    constructor() {
        super(new NotificationAddRemoveService());
    }
}

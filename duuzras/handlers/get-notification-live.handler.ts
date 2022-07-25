import { NotificationLiveLog, NotificationLiveLogDto } from '../notification/model';
import { HandlerBaseClientScope, HandlerBaseDuuzraScope } from '../../core/handlers/index';
import { NotificationLiveService, INotificationLiveService } from '../notification';

export class NotificationLiveHandler extends HandlerBaseDuuzraScope<NotificationLiveLogDto> {
    constructor() {
        super(new NotificationLiveService());
    }
}

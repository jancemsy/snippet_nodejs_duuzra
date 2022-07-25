import { IAppAnalyticsDto } from '../../duuzra_types/duuzras';
import { CommunicationFactory, CommunicationHandler, CommunicationStatuses, ICommunication } from '../../duuzra_types/network';
import { HandlerBaseDuuzraScope } from '../../core/handlers/index';
import { ServiceBaseHandler } from '../../core/index';
import { AnalyticsService } from '../analytics';

export class DuuzraAnalyticsHandler extends HandlerBaseDuuzraScope<IAppAnalyticsDto> {
    constructor() {
        super(new AnalyticsService());
    }
}

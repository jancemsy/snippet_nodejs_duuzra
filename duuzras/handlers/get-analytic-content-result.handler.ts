import { AnalyticContentResultDto } from '../analytics-content-result/model/analytics-content-result.dto';
import { HandlerBaseClientScope, HandlerBaseDuuzraScope } from '../../core/handlers/index';
import { AnalyticsContentResultService, IAnalyticsContentResultService } from '../analytics-content-result/analytics-content-result.service';
import {
    CommandTypes,
    CommandVerbs,
    CommunicationFactory,
    CommunicationHandler,
    CommunicationStatuses,
    ICommunication,
    CommunicationSuccessResponse
} from '../../duuzra_types/network';
import { System, SessionService,  } from '../../shared';

export class GetAnalyticContentResultHandler extends HandlerBaseDuuzraScope<AnalyticContentResultDto> {

    protected service: AnalyticsContentResultService;
    private sessionCtrl: SessionService;

    constructor() {
        super(new AnalyticsContentResultService());
    }
}

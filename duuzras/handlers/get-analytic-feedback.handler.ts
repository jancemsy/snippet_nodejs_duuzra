import { AnalyticFeedbackDto } from '../analytics-feedback/model/analytic_feedback.dto';
import { HandlerBaseClientScope, HandlerBaseDuuzraScope } from '../../core/handlers/index';
import { AnalyticsFeedbackService, IAnalyticsFeedbackService } from '../analytics-feedback/analytics-feedback.service';
import {
    CommandTypes,
    CommandVerbs,
    CommunicationFactory,
    CommunicationHandler,
    CommunicationStatuses,
    ICommunication,
    CommunicationSuccessResponse
} from '../../duuzra_types/network';

export class GetAnalyticFeedbackHandler extends HandlerBaseDuuzraScope<AnalyticFeedbackDto> {

    constructor() {
        super(new AnalyticsFeedbackService());
    }

}

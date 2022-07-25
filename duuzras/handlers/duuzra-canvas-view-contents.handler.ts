import { IDuuzraContentDto, IAppAnalyticsDto } from '../../duuzra_types/duuzras';
import {
    CommandTypes,
    CommandVerbs,
    CommunicationFactory,
    CommunicationHandler,
    CommunicationStatuses,
    ICommunication
} from '../../duuzra_types/network';
import { HandlerBaseDuuzraScope } from '../../core/handlers/index';
import { ServiceBaseHandler } from '../../core/index';
import { CanvasViewContentService, IContentService } from '../canvas-view-content';

export class DuuzraCanvasViewContentHandler extends HandlerBaseDuuzraScope<IDuuzraContentDto> {

    constructor() {
        super(new CanvasViewContentService());
    }

}

import {
    IDuuzraContentTypeTemplateDto
} from '../../duuzra_types/duuzras';
import {
    CommandTypes,
    CommandVerbs,
    CommunicationFactory,
    CommunicationHandler,
    CommunicationStatuses,
    ICommunication
} from '../../duuzra_types/network';
import { IExtractedToken } from '../../duuzra_types/security';
import { HandlerBaseDuuzraScope, HandlerBaseUserScope } from '../../core/handlers/index';
import { DuuzraContentTypeTemplateService, IDuuzraContentTypeTemplateService } from '../duuzra-contenttypetemplate';

export class DuuzraContentTypeTemplateHandler extends HandlerBaseDuuzraScope<IDuuzraContentTypeTemplateDto> {

    constructor() {
        super(new DuuzraContentTypeTemplateService());
    }
}

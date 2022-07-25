import { IAgendaSession } from '../duuzra_types/duuzras';
import { IDuuzraContentDoc } from './duuzra-content-doc';

export interface IDuuzraContentAgendaDoc extends IDuuzraContentDoc {
    sessions: IAgendaSession[];
}

import { IDuuzraContentDoc } from './duuzra-content-doc';

export interface IDuuzraContentPollDoc extends IDuuzraContentDoc {
    question: string;
    responses: string[];
}

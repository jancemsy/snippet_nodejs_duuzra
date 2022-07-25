import { IDuuzraContentDoc } from './duuzra-content-doc';
import { IDuuzraContentFormElementDoc } from './duuzra-content-form-element-doc';

export interface IDuuzraContentFormDoc extends IDuuzraContentDoc {
    submissionType: string;
    formElements: IDuuzraContentFormElementDoc[];
}

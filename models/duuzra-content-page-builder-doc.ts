import { IDuuzraContentPagedDoc } from './duuzra-content-paged-doc';
import { IDuuzraContentPageBuilderPageDoc } from './duuzra-content-page-builder-page-doc';

export interface IDuuzraContentPageBuilderDoc extends IDuuzraContentPagedDoc {
    pages: IDuuzraContentPageBuilderPageDoc[];
}

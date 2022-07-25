import { IDuuzraContentDocumentPageDoc } from "./duuzra-content-document-page-doc";
import { IDuuzraContentPagedDoc } from "./duuzra-content-paged-doc";

export interface IDuuzraContentPresentationDoc extends IDuuzraContentPagedDoc {
    pages: IDuuzraContentDocumentPageDoc[];
}

import { IDuuzraContentDocumentPageDoc } from "./duuzra-content-document-page-doc";
import { IDuuzraContentPagedDoc } from "./duuzra-content-paged-doc";

export interface IDuuzraContentDocumentDoc extends IDuuzraContentPagedDoc {
    pages: IDuuzraContentDocumentPageDoc[];
}

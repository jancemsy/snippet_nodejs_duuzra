import { IDuuzraContentPageDoc } from "./duuzra-content-page-doc";

export interface IDuuzraContentDocumentPageDoc extends IDuuzraContentPageDoc {
    uuid: string;
    path: string;
    isLocked: boolean;
    fileSize: string;
    dimensions: string;
}

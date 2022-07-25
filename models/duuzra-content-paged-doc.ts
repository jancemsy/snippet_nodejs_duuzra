import { IDuuzraContentPageDoc } from "./duuzra-content-page-doc";
import { IDuuzraContentDoc } from "./duuzra-content-doc";

export interface IDuuzraContentPagedDoc extends IDuuzraContentDoc {
    pages: IDuuzraContentPageDoc[];
}

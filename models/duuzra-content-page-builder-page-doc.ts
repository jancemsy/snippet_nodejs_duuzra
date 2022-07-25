import { IDuuzraContentPageDoc } from "./duuzra-content-page-doc";
import { IFormattedValue } from '../duuzra_types/content';

export interface IDuuzraContentPageBuilderPageDoc extends IDuuzraContentPageDoc {
    textCollapsed: boolean;
    imageCollapsed: boolean;
    imageMediaUuid: string;
    linkedFeaturesCollapsed: boolean;
    linkedFeatures: string[];

    body: IFormattedValue;
    title: IFormattedValue;
    subtitle: IFormattedValue;
}

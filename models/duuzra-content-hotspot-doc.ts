import { IDuuzraContentDoc } from './duuzra-content-doc';
import { IMediaDocumentDto } from '../duuzra_types/media';
import { HotspotInfoDoc } from './hotspot-info-doc';

export interface IDuuzraContentHotspotDoc extends IDuuzraContentDoc {
    backgroundImage: any;
    hotspots: HotspotInfoDoc[]
}

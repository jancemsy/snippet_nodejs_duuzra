import { IDuuzraContentTypeTemplateDto } from '../../duuzra_types/duuzras';
import { IDuuzraContentTypeTemplateDoc } from '../../models/duuzra-contentTypeTemplate-doc';
import { System } from '../../shared';
import { DuuzraContentTypeTemplateMapper } from './duuzra-contenttypetemplate.mapper';

export abstract class IDuuzraContentTypeTemplateRepository {
    public abstract async getContentTypeTemplatesByDuuzraUuid(clientUuid: string, duuzraUuid: string): Promise<IDuuzraContentTypeTemplateDto[]>
    public abstract async getContentTypeTemplateByUuid(clientUuid: string, duuzraUuid: string, id: string): Promise<IDuuzraContentTypeTemplateDto>;
    public abstract async createContentTypeTemplate(clientUuid: string, duuzraUuid: string, contentTypeTemplate: IDuuzraContentTypeTemplateDto): Promise<IDuuzraContentTypeTemplateDto>;
}

export class DuuzraContentTypeTemplateRepository implements IDuuzraContentTypeTemplateRepository {
    private readonly objectName = DuuzraContentTypeTemplateMapper.getViewType();

    private contentTypeTemplateMapper: DuuzraContentTypeTemplateMapper;

    constructor() {
        this.contentTypeTemplateMapper = new DuuzraContentTypeTemplateMapper();
    }

    // ####################################
    // # DATA READS
    // ####################################

    public async getContentTypeTemplatesByDuuzraUuid(userUuid: string, duuzraUuid: string): Promise<IDuuzraContentTypeTemplateDto[]> {
        console.log("duuzra-contenttemplate.repository.ts getContentTypeTemplatesByDuuzraUuid()");
        try {
            const duuzraDocId = 'duuzra-duuzra_' + duuzraUuid;
            const rawContentTypeTemplates = await System.DB.get(this.objectName, 'duuzraId', duuzraDocId) as any;

            if (rawContentTypeTemplates && rawContentTypeTemplates.docs.length > 0) {  
                const contentTypeTemplateDtos = [];
                rawContentTypeTemplates.docs.forEach((ctt) => {
                    const contentTYpeTemplateDto = DuuzraContentTypeTemplateMapper.mapToObj(duuzraUuid, ctt);
                    contentTypeTemplateDtos.push(contentTYpeTemplateDto);
                });

                return Promise.resolve(contentTypeTemplateDtos);
            } else {
                return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node  
            }

        } catch (err) { 
            //return Promise.reject<IDuuzraContentTypeTemplateDto[]>(err);
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
        }
    }

    /**
     * Gets contentTypeTemplate by id
     */
    public async getContentTypeTemplateByUuid(clientUuid: string, duuzraUuid: string, contentTypeTemplateUuid: string): Promise<IDuuzraContentTypeTemplateDto> {
        console.log("duuzra-contenttemplate.repository.ts getContentTypeTemplatesByUuid()");
        try {
            const rawContentTypeTemplates = await System.DB.get(this.objectName, 'uuid', contentTypeTemplateUuid) as any;
            if (rawContentTypeTemplates && rawContentTypeTemplates.docs.length === 1) {
                 return Promise.resolve(DuuzraContentTypeTemplateMapper.mapToObj(duuzraUuid, rawContentTypeTemplates.docs[0]));
            } else {
                return Promise.resolve(null);
            }
        } catch (err) { 
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
            //return Promise.reject<IDuuzraContentTypeTemplateDto>(err);
        }
    }

    private async buildDto(duuzraUuid: string, clientUuid: string, contentTypeTemplateItemDoc: IDuuzraContentTypeTemplateDoc): Promise<IDuuzraContentTypeTemplateDto> {
        console.log("duuzra-contenttemplate.repository.ts buildDto()");
        return Promise.resolve(DuuzraContentTypeTemplateMapper.mapToObj(duuzraUuid, contentTypeTemplateItemDoc));
    }
    // ####################################
    // # DATA CHANGES
    // ####################################

    /**
     * Saves the specified contentTypeTemplate
     */
    public async createContentTypeTemplate(clientUuid: string, duuzraUuid: string, contentTypeTemplate: IDuuzraContentTypeTemplateDto): Promise<IDuuzraContentTypeTemplateDto> {
        console.log("duuzra-contenttemplate.repository.ts createContentTypeTemplate()");
        try {
            // convert dto to doc
            const contentTypeTemplateDoc = DuuzraContentTypeTemplateMapper.mapToDoc(contentTypeTemplate);

            // load the client doc
            const couchGet = await System.DB.get('duuzraDuuzra', 'id', 'duuzra-duuzra_' + duuzraUuid) as any;

            // add the item
            if (couchGet.docs.length === 1) {
                const duuzraDoc = couchGet.docs[0];
                if (duuzraDoc.contentTypeTemplates) {
                    duuzraDoc.contentTypeTemplates.push(contentTypeTemplateDoc); // todo - check for conflict
                } else {
                    duuzraDoc.contentTypeTemplates = [contentTypeTemplateDoc]; // todo - check for conflict
                }
                // save the client doc
                const couchResponse = await System.DB.save(duuzraDoc);
            } else { 
                //return Promise.reject<IDuuzraContentTypeTemplateDto>('Individual DuuzraDoc not found');
                return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
            }

            // resolve with the created item
            return Promise.resolve(this.buildDto(duuzraUuid, clientUuid, contentTypeTemplateDoc));
        } catch (err) { 
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
            //return Promise.reject<IDuuzraContentTypeTemplateDto>(err);
        }
    }
}

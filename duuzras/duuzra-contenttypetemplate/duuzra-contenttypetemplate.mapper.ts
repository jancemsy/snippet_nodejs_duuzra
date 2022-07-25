import { IDuuzraContentTypeTemplateDto } from '../../duuzra_types/duuzras';
import { IDuuzraContentTypeTemplateDoc } from '../../models/duuzra-contenttypetemplate-doc';

const uuidgen = require('uuid/v1');

export class DuuzraContentTypeTemplateMapper {

    public static getViewType() { return 'duuzraContentTypeTemplate'; }
    public static revertDocId(docId: string) { return docId.replace('duuzra-duuzra_', ''); }

    /***********************************************************************
     * Please note the hack here where the duuzraUuid is not populating from the data but from the passed uuid.
     * This should user the docId of the duuzraDuuzra doc to populate.
     * Needs a little work around the couch view. See duuzraInfo for reference
     ***********************************************************************/

    public static mapToObj(duuzraUuid: string, contentTypeTemplateDoc: IDuuzraContentTypeTemplateDoc): IDuuzraContentTypeTemplateDto {

        try {
            return {
                uuid: contentTypeTemplateDoc.uuid,
                duuzraUuid: duuzraUuid,
                contentType: contentTypeTemplateDoc.contentType,
                template: contentTypeTemplateDoc.template,
                title: contentTypeTemplateDoc.title
            };
        } catch (err) {
            console.error(err);
        }
    }

    public static mapToDoc(contentTypeTemplateDto: IDuuzraContentTypeTemplateDto): IDuuzraContentTypeTemplateDoc {

        try {
            // Auto id
            if (!contentTypeTemplateDto.uuid) {
                contentTypeTemplateDto.uuid = uuidgen();
            }

            return {
                uuid: contentTypeTemplateDto.uuid,
                contentType: contentTypeTemplateDto.contentType,
                template: contentTypeTemplateDto.template,
                title: contentTypeTemplateDto.title
            }
        } catch (err) {
            console.error(err);
        }
    }
}

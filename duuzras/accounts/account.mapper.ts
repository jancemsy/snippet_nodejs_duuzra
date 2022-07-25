import { IDuuzraAccountDto } from '../../duuzra_types/duuzras';
import { IDuuzraAccountDoc } from '../../models/duuzra-account-doc';

const uuidgen = require('uuid/v1');
export class DuuzraAccountMapper {

    public static getViewType() { return 'duuzraAccount'; }

    public static mapToObj(doc: IDuuzraAccountDoc): IDuuzraAccountDto {
        return {
            uuid: doc.uuid,
            name: doc.name
        };
    }

    public static mapToDoc(account: IDuuzraAccountDto): IDuuzraAccountDoc {

        // Auto id
        if (!account.uuid) {
            account.uuid = uuidgen();
        }

        return {
            uuid: account.uuid,
            name: account.name
        }
    }
}

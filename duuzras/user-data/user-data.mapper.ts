
import { IUserDataItemDto } from '../../duuzra_types/duuzras';
import { IUserDataDoc, IUserDataDuuzraItemDoc } from '../../models/duuzra-userdata-doc';
const uuidgen = require('uuid/v1');
export class UserDataMapper {
    public static getViewType() {
        return 'duuzraUserData';
    }

    public static mapDataItemToDoc(dataItem: IUserDataItemDto): IUserDataDuuzraItemDoc {

        // Auto id
        if (!dataItem.uuid) {
            dataItem.uuid = uuidgen();
        }

        // 1 to 1 mapping no mapping required.
        return dataItem;
    }
}

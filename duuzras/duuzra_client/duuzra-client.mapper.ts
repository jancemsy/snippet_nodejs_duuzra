import { IClientDto } from '../../duuzra_types/duuzras';
import { IClientDoc } from '../../models/duuzra-client-doc';

const uuidgen = require('uuid/v1');

export class ClientMapper {
    public static getNewUuid() { return uuidgen(); }
    public static getViewType() { return 'duuzraClient'; }

    public static mapToObj(clientDoc: IClientDoc): IClientDto {
        try {
            if (clientDoc.uuid === undefined) {
                let idarr = clientDoc._id.split('_');
                clientDoc.uuid = idarr[1];
            }
            const clientDto: IClientDto = {
                uuid: clientDoc.uuid,
                info: clientDoc.info,
                accounts: clientDoc.accounts,
                media: clientDoc.media,
                duuzras: clientDoc.duuzras,
                folders: clientDoc.folders,
                email: clientDoc.email
            };

            return clientDto;
        } catch (e) {
            console.error('Client Mapper - mapToObj failed ' + e); 
            return null; 
        }
    }

    public static mapToDoc(clientDto: IClientDto): IClientDoc {

        let clientAccounts: any = clientDto.accounts;
        let clientAllAccounts: any = [];
        let clientFolders: any = clientDto.folders;
        let clientAllFolders: any = [];
        for (var i = 0; i < clientAccounts.length; i++) {
            clientDto.accounts = {
                uuid: this.getNewUuid(),
                name: clientAccounts[i].name// 'Default'
            }

            clientAllAccounts.push(clientDto.accounts);
        }
        for (var i = 0; i < clientFolders.length; i++) {
            clientDto.folders = {
                uuid: this.getNewUuid(),
                parentUuid: null,
                accountUuid: clientAllAccounts[0].uuid,
                title: clientFolders[i].title,
                duuzraUuids: []
            }

            clientAllFolders.push(clientDto.folders);
        }
        clientDto.info = {
            name: clientDto.info

        }

        try {
            const newId = this.getNewUuid()
            const clientDoc: IClientDoc = {
                _id: 'duuzra-client_' + newId,
                _rev: undefined,
                type: 'duuzra-client',
                uuid: newId,
                info: clientDto.info,
                accounts: clientAllAccounts,
                media: clientDto.media,
                duuzras: clientDto.duuzras,
                folders: clientAllFolders,
                email: clientDto.email
            };

            return clientDoc;
        } catch (e) {
            console.error('Client Mapper - mapToDoc failed ' + e); 
            return null; 
        }
    }
}

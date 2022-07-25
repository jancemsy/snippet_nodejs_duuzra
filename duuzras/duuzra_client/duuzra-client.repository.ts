import { DateFormatter } from '../../duuzra_types/common';
import { IClientDto } from '../../duuzra_types/duuzras';
import { IClientDoc } from '../../models/duuzra-client-doc';
import { System } from '../../shared';
import { ClientMapper } from './duuzra-client.mapper';

export abstract class IClientRepository {
    public abstract async getAllUsers(): Promise<IClientDto[]>
    public abstract async getClientByUuid(authToken: string, correlationId: string, clientUuid: string): Promise<IClientDto>;
    public abstract async createClient(authToken: string, correlationId: string, client: IClientDto): Promise<IClientDto>;
    public abstract async deleteClient(clientUuid: string): Promise<IClientDto>;
    public abstract async updateClient(userDto: IClientDto): Promise<IClientDto>;
}

export class ClientRepository implements IClientRepository {
    private readonly objectName = ClientMapper.getViewType();

    // ####################################
    // # DATA READS
    // ####################################

    public async getAllUsers(): Promise<IClientDto[]> {
        console.log("duuzra-client.repository.ts getAllUsers()");
        try {
            const rawClients = await System.DB.get(this.objectName, 'all') as any;

            if (rawClients && rawClients.docs.length >= 1) {
                const infoDtosPromises: Array<Promise<IClientDto>> = [];

                rawClients.docs.forEach((infoDoc) => {

                    infoDtosPromises.push(Promise.resolve(ClientMapper.mapToObj(infoDoc)))
                });
                return Promise.all(infoDtosPromises);
            } else {
                return Promise.resolve(null);
            }
        } catch (err) { 
            //return Promise.reject<IClientDto[]>(err);
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
        }
    }

    public async getClientByUuid(authToken: string, correlationId: string, clientUuid: string): Promise<IClientDto> {
        console.log("duuzra-client.repository.ts getClientByUuid()");
        try {
            const rawClients = await System.DB.get(this.objectName, 'id', 'duuzra-client_' + clientUuid) as any;

            if (rawClients && rawClients.docs.length === 1) {
                return Promise.resolve(ClientMapper.mapToObj(rawClients.docs[0]));
            } else {
                return Promise.resolve(null);
            }
        } catch (err) { 
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
            //return Promise.reject<IClientDto>(err);
        }
    }

    // ####################################
    // # DATA CHANGES
    // ####################################

    public async createClient(authToken: string, correlationId: string, client: IClientDto): Promise<IClientDto> {
        console.log("duuzra-client.repository.ts createClient()");
        try { 
            let myClientlist = [];
            const rawClients = await System.DB.get(this.objectName, 'all') as any;
            if (rawClients.docs.length > 0) {
                rawClients.docs.forEach(element => {
                    if (element.email) {
                        if (element.email.toLowerCase() === client.email.toLowerCase()) { myClientlist.push(element) }
                    }

                });
            } 

            if (myClientlist.length > 0) { 
                return Promise.resolve<IClientDto>(null);
            } else {
                const clientDoc = ClientMapper.mapToDoc(client);

                const couchGet = await System.DB.get(this.objectName, 'id', clientDoc._id) as any;
                if (couchGet.docs.length === 0) {
                    const couchResponse = await System.DB.save(clientDoc);
                } else { 
                    return Promise.reject<IClientDto>('Error - Client Already Exists');
                }

                return Promise.resolve(ClientMapper.mapToObj(clientDoc));
            }
        } catch (err) { 
            return Promise.reject<IClientDto>(err);
        }
    }

    public async deleteClient(clientUuid: string): Promise<IClientDto> {
        try {
            const couchGet = await System.DB.get(this.objectName, 'id', 'duuzra-client_' + clientUuid) as any;

            if (couchGet.docs.length === 1) {
                const clientDoc = couchGet.docs[0];
                const couchResponse = await System.DB.save(clientDoc);

                return Promise.resolve(await ClientMapper.mapToObj(clientDoc));
            } else { 
                return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
                //return Promise.reject<IClientDto>(null);
            }
        } catch (err) { 
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
            ///return Promise.reject<IClientDto>(err);
        }
    }

    public async updateClient(clientDto: IClientDto): Promise<IClientDto> {
        return new Promise<IClientDto>(async (resolve, reject) => {
            try {
                const couchGet = await System.DB.get(this.objectName, 'id', 'duuzra-client_' + clientDto.uuid) as any;

                if (couchGet.docs.length === 1) {
                    const dbClientDoc: IClientDoc = couchGet.docs[0];
                    const clientDoc = ClientMapper.mapToDoc(clientDto);
                    clientDoc._rev = dbClientDoc._rev;

                    System.DB.save(clientDoc)
                        .then((updateDoc: any) => {
                            resolve(updateDoc);
                        })
                        .catch((err: string) => {
                            reject(err);
                        });
                }
            } catch (err) {
                reject(err);
            }

        });
    }
}

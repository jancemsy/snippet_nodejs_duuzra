import { DuuzraPollClickLog, IDuuzraPollClickDto } from './model/index';

import { System } from '../../shared';
import { DuuzraPollClickMapper } from './duuzra-poll-click.mapper';

export abstract class IDuuzraPollClickRepository {
    public abstract async get(filters: any): Promise<IDuuzraPollClickDto[]>
    public abstract async create(coordinate: IDuuzraPollClickDto): Promise<IDuuzraPollClickDto>
}

export class DuuzraPollClickRepository implements IDuuzraPollClickRepository {
    private readonly objectName = DuuzraPollClickMapper.getViewType();  

    public async create(coordinate: IDuuzraPollClickDto): Promise<IDuuzraPollClickDto> { 
        console.log("duuzra-poll.click.repository.ts create()");
        try {
            let doc = await DuuzraPollClickMapper.convertPollClickDOc(coordinate); 
            let result = await DuuzraPollClickMapper.convertPollClickDto(doc);
            return Promise.resolve(result);

        } catch (err) { 
            return Promise.reject<IDuuzraPollClickDto>(err);
        }
    }

    public async get(filters: any): Promise<IDuuzraPollClickDto[]> {
        
        try {
            let reponse = await System.DB.get('pollClickLogEntry', 'duuzraUuid_contentUuid', [filters.contentUuid, filters.duuzraUuid]) as any;
            if (reponse.docs.length > 0) {
                let datas: IDuuzraPollClickDto[] = [];
                for (let data of reponse.docs) {
                    datas.push(await DuuzraPollClickMapper.convertPollClickDto(data));
                }
                return Promise.all(datas);
            } else {
                return Promise.resolve(null);
            }
        } catch (err) { 
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
            //return Promise.reject<IDuuzraPollClickDto[]>(err);
        }
    } 
}

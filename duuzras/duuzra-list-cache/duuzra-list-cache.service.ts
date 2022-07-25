import { ServiceBase } from '../../core/services/index';
import { DuuzraListCacheRepository } from './duuzra-list-cache.repository';

import { ITokenProvider } from '../../core/token/index';
import { IDuuzraInfo,  } from '../../duuzra_types/duuzras';
import { CommunicationVerb } from '../../duuzra_types/network';
import { HttpApi } from '../../shared/index';
import { DuuzraListCacheMapper } from './index';
export interface IDuuzraListCacheService {
    get(token: string, correlationId: string, scopeUuid: string, filter?: any, sort?: any): Promise<IDuuzraInfo[]>;
}

export class DuuzraListCacheService extends ServiceBase<IDuuzraInfo> implements IDuuzraListCacheService {
    private duuzraRepo: DuuzraListCacheRepository;
    private http: HttpApi;

    constructor() {
        super();
        this.http = new HttpApi();
        this.duuzraRepo = new DuuzraListCacheRepository();
    }

    // ####################################
    // # DATA READS
    // ####################################

    /**
     * Gets the duuzra list for the specified user
     * @deprecated Due to tie in with the old CMS we need to pass around the authToken rather than the userUuid
     */
    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuid: string): Promise<IDuuzraInfo>;
    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, filters: any, sort: any): Promise<IDuuzraInfo[]>
    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, filters?: any, sort?: any): Promise<IDuuzraInfo | IDuuzraInfo[]> {
        console.log("duuzra-list-cache.service.ts getAction()");
        if (this.isUuidQuery(filters)) {
            this.throwSingleActionTypeNotImplementedException(CommunicationVerb.GET);
        } else {
            let eventList = await this.duuzraRepo.getDuuzraInfoCacheForUser(tokenProvider.token);
            if (!eventList) {
                // TODO: The api request below will become obsolete once we get rid of the old CMS
                // in the new structure the repo class above would take care fo fetching directly from the db.
                const rawData = await this.http.get(
                    'http://cms.duuzra.com/api/events?expand=content&content.theme&content.children',
                    tokenProvider.token
                );
                eventList = DuuzraListCacheMapper.mapDuuzraInfoFromOldCmsData(rawData);
                // cache the new event info
                if (eventList) {
                    this.duuzraRepo.cacheDuuzraInforForUser(tokenProvider.token, eventList);
                }
                return eventList;
            }
        }
    }
}

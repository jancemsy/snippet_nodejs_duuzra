import { IDuuzraInfo } from '../../duuzra_types/duuzras';
import { CacheService } from '../../shared/cache/cache.service';

export abstract class IDuuzraListCacheRepository {
    public abstract async getDuuzraInfoCacheForUser(userToken: string): Promise<IDuuzraInfo[]>;
    public abstract async cacheDuuzraInforForUser(userToken, eventData: IDuuzraInfo[]): Promise<void>;

}

export class DuuzraListCacheRepository implements IDuuzraListCacheRepository {
    private readonly cacheExpiryMinutes = 5;

    private cache: CacheService;

    constructor() {
        this.cache = new CacheService();
    }
 

    public async cacheDuuzraInforForUser(userToken, eventData: IDuuzraInfo[]): Promise<void> {
        console.log("duuzra-list-cache.repository.ts cacheDuuzraInfoForUser()");
        try{ 
            const cachedList = await this.cache.get(this.getEventListCacheKey(userToken));
            if (cachedList) {
                this.cache.remove(cachedList);
            }

            if (eventData && eventData.length) { 
                this.cache.add(this.getEventListCacheKey(userToken), eventData);
            }
        }catch (err){ 
        }

    }

    public async getDuuzraInfoCacheForUser(userToken: string): Promise<IDuuzraInfo[]> {
        console.log("duuzra-list-cache.repository.ts getDuuzraInfoCacheForUser()");
        try{ 
            const cachedList = await this.cache.get<IDuuzraInfo[]>(this.getEventListCacheKey(userToken));
 
            if (cachedList) {
                const expiryTime = new Date( new Date( cachedList.timeStamp.toDateString() ).getTime() + (this.cacheExpiryMinutes * 60000));
                if (expiryTime < new Date()) {
                    const result = await this.cache.remove(cachedList);
                    return Promise.resolve(null);
                }
            } 
            return Promise.resolve(cachedList ? cachedList.data : null);
        }catch (err){ 
        } 
    }

    /**
     * Generates a unique cache key for the event list
     * @deprecated This method will no longer be required when we remove the link to the old CMS
     */
    private getEventListCacheKey(userToken: string): string {
        return `event-list_${userToken}`;
    }

}

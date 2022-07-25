import { IDuuzraInfo } from '../../duuzra_types/duuzras';
import { CacheService } from '../../shared/cache/cache.service';
import { AnalyticContentResultEntry, AnalyticContentResultDto } from './index';
import { IAppAnalyticsDto } from '../../duuzra_types/duuzras';
import { AnalyticsContentResultMapper } from './analytics-content-result.mapper';
import { IAuthUserDto } from '../../duuzra_types/auth';
import { IDuuzraContentDto, IDuuzraInfoDto } from '../../duuzra_types/duuzras';

import { System } from '../../shared';

export abstract class IAnalyticsContentResultRepository {
    public abstract async createAnalytic(content: IDuuzraContentDto, duuzraUuid: string, object: IAppAnalyticsDto, user: IAuthUserDto): Promise<AnalyticContentResultDto>;
    public abstract async getAnalyticByUserUuuid(user: string): Promise<AnalyticContentResultDto[]>;
    public abstract async getAnalyticByDuuzraUuid(duuzra: string): Promise<AnalyticContentResultDto[]>;
    public abstract async getAnalyticByContentUuid(content: string): Promise<AnalyticContentResultDto[]>;
}

/**
 * This class has been added to indicate that content data can be used to enhance the data set to the analytics service.
 */
export class AnalyticsContentResultRepository implements IAnalyticsContentResultRepository {

    constructor() { }

    public async getAnalyticByUserUuuid(user: string): Promise<AnalyticContentResultDto[]>{

        try{
            let analytic = await System.DB.get('analyticContentResult', 'userUuid', user) as any;
            let result = [];
            if (analytic.docs.length > 0){
                for (let data of analytic.docs){
                    result.push(await this.convertToAnalyticDto(data));
                }
                result.sort((a, b) => a.dateCreated <= b.dateCreated ? -1 : 1);
                // result = analytic.docs;
            }
            return Promise.all(result);
        }catch (err){
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
            //return Promise.reject<AnalyticContentResultDto[]>(err);
        }

    }

    public async getAnalyticByDuuzraUuid(duuzra: string): Promise<AnalyticContentResultDto[]>{
        try{
            let analytic = await System.DB.get('analyticContentResult', 'duuzraUuid', duuzra) as any;
            let result = [];
            if (analytic.docs.length > 0){
                // result = await this.convertToAnalyticDto(analytic.docs[analytic.docs.length - 1]);
                // result = analytic.docs;
                for (let data of analytic.docs){
                    result.push(await this.convertToAnalyticDto(data));
                }
                result.sort((a, b) => a.dateCreated <= b.dateCreated ? -1 : 1);
            }
            return Promise.all(result);
        }catch (err){
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
            //return Promise.reject<AnalyticContentResultDto[]>(err);
        }

    }

    public async getAnalyticByContentUuid(content: string): Promise<AnalyticContentResultDto[]>{
        try{
            let analytic = await System.DB.get('analyticContentResult', 'contentUuid', content) as any;
            let result = [];
            if (analytic.docs.length > 0){
                // result = await this.convertToAnalyticDto(analytic.docs[analytic.docs.length - 1]);
                // result = analytic.docs;
                for (let data of analytic.docs){
                    result.push(await this.convertToAnalyticDto(data));
                }
                result.sort((a, b) => a.dateCreated <= b.dateCreated ? -1 : 1);
            }
            return Promise.all(result);
        }catch (err){
            return Promise.resolve(null); //james-new - 8/3/2020  reject is risky because if not handled by catch, the server will terminate the node 
            //return Promise.reject<AnalyticContentResultDto[]>(err);
        }
    }

    public async createAnalytic(content: IDuuzraContentDto, duuzraUuid: string, object: IAppAnalyticsDto, user: IAuthUserDto): Promise<AnalyticContentResultDto>{ 
        try{
            if (content && duuzraUuid && object && user){ 
                let seconds = await this.CountSecondsOnPreviousVisit(user, object.dateCreated); 
                let analytic: AnalyticContentResultEntry = await AnalyticsContentResultMapper.mapToAnalyticContentResultEntry(duuzraUuid, content.uuid, content.title, user.uuid, user.email, object.dateCreated, user.firstname + " " + user.lastname, seconds); 
                await System.DB.save(analytic); 
                let result = await this.convertToAnalyticDto(analytic); 
                return Promise.resolve(result);
            } 
        }catch (err){ 
            return Promise.reject<AnalyticContentResultDto>(err);
        }
    }

    private async convertToAnalyticDto(analytic: AnalyticContentResultEntry): Promise<AnalyticContentResultDto>{
        console.log("analytics.service.ts convertToAnalyticsDto()");
        let result = await AnalyticsContentResultMapper.mapToAnalyticContentResultDto(analytic);
        return Promise.resolve(result);
    }

    private async CountSecondsOnPreviousVisit(user: IAuthUserDto, analyticDate: string): Promise<string>{
        console.log("analytics.service.ts countSecondsOnPreviousVisit()");
        try{
            let sec = "0";
            let lastDate = null;
            let nowDate = null;
            let analytic: any = await this.getAnalyticByUserUuuid(user.uuid);
            analytic.sort((a, b) => a.dateCreated <= b.dateCreated ? -1 : 1);
            if (analytic.length > 0){

                lastDate = new Date(analytic[analytic.length - 1].dateCreated);
                nowDate = new Date(analyticDate);

                let mysec = (nowDate - lastDate) / 1000;

                sec = mysec.toString();
            }

            return sec;
        }catch (err){
            return Promise.reject<string>(err);
        }

    }
}

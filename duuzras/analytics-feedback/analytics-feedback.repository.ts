import { IDuuzraInfo } from '../../duuzra_types/duuzras';
import { CacheService } from '../../shared/cache/cache.service';
import { analyticFeedbackEntry, AnalyticFeedbackDto } from './index';
import { IAppAnalyticsDto } from '../../duuzra_types/duuzras';
import { AnalyticsFeedbackMapper } from './analytics-feedback.mapper';
import { IAuthUserDto } from '../../duuzra_types/auth';
import { IDuuzraContentDto, IDuuzraInfoDto } from '../../duuzra_types/duuzras';

import { System } from '../../shared';

export abstract class IAnalyticsFeedbackRepository {
    public abstract async createAnalytic(content: IDuuzraContentDto, duuzraUuid: string, object: IAppAnalyticsDto, user: IAuthUserDto): Promise<AnalyticFeedbackDto>;
    public abstract async getAnalyticByUserUuuid(user: string): Promise<AnalyticFeedbackDto[]>;
    public abstract async getAnalyticByDuuzraUuid(duuzra: string): Promise<AnalyticFeedbackDto[]>;
    public abstract async getAnalyticByContentUuid(content: string): Promise<AnalyticFeedbackDto[]>;
}

/**
 * This class has been added to indicate that content data can be used to enhance the data set to the analytics service.
 */
export class AnalyticsFeedbackRepository implements IAnalyticsFeedbackRepository {

    constructor() { }

    public async getAnalyticByUserUuuid(user: string): Promise<AnalyticFeedbackDto[]>{
        console.log("analytics-feedback.repository.ts getAnalyticsByUserUuid()");
        try{
            let analytic = await System.DB.get('analyticFeedback', 'userUuid', user) as any;
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
            //return Promise.reject<AnalyticFeedbackDto[]>(err);
        }

    }

    public async getAnalyticByDuuzraUuid(duuzra: string): Promise<AnalyticFeedbackDto[]>{
        try{
            let analytic = await System.DB.get('analyticFeedback', 'duuzraUuid', duuzra) as any;
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
            //return Promise.reject<AnalyticFeedbackDto[]>(err);
        }

    }

    public async getAnalyticByContentUuid(content: string): Promise<AnalyticFeedbackDto[]>{
        try{
            let analytic = await System.DB.get('analyticFeedback', 'contentUuid', content) as any;
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
            //return Promise.reject<AnalyticFeedbackDto[]>(err);
        }
    }

    public async createAnalytic(content: IDuuzraContentDto, duuzraUuid: string, object: IAppAnalyticsDto, user: IAuthUserDto): Promise<AnalyticFeedbackDto>{
        console.log("analytics-feedback.repository.ts createAnalytic()");
        try{
            if (content && duuzraUuid && object && user){
                // get name and email
                let seconds = await this.CountSecondsOnPreviousVisit(user, object.dateCreated);

                let analytic: analyticFeedbackEntry = await AnalyticsFeedbackMapper.mapToAnalyticFeedbackEntry(duuzraUuid, content.uuid, content.title, user.uuid, user.email, object.dateCreated, user.firstname + " " + user.lastname, seconds);

                await System.DB.save(analytic);

                let result = await this.convertToAnalyticDto(analytic);

                return Promise.resolve(result);
            }

        }catch (err){ 
            return Promise.reject<AnalyticFeedbackDto>(err);
        }
    }

    private async convertToAnalyticDto(analytic: analyticFeedbackEntry): Promise<AnalyticFeedbackDto>{
        console.log("analytics-feedback.repository.ts convertToAnalyticsDto()");
        let result = await AnalyticsFeedbackMapper.mapToAnalyticFeedbackDto(analytic);
        return Promise.resolve(result);
    }

    private async CountSecondsOnPreviousVisit(user: IAuthUserDto, analyticDate: string): Promise<string>{
        console.log("analytics-feedback.repository.ts CountSecondsOnPreviousVisit()");
        try{
            let sec = "0";
            let lastDate = null;
            let nowDate = null;
            let analytic: any = await this.getAnalyticByUserUuuid(user.uuid);
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

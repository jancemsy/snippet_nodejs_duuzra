import { IKeyValuePair } from '../../duuzra_types/common';
import {
    IDuuzraContentLockPush,
    IDuuzraNavigationPush,
    IDuuzraNavigationPushLayer,
    IDuuzraState
} from '../../duuzra_types/duuzras';

import { ServiceBase } from '../../core/services/index';
import { ITokenProvider } from '../../core/token/index';
import { StateLogEntry } from '../state-log/models';
import { IStateLogRepository, StateLogRepository } from '../state-log/state-log.repository';

// tslint:disable-next-line:no-var-requires
const uuidGen = require('uuid/v1');

export interface IStateDeltaService {
    get(token: string, correlationId: string, scopeUuid: string, uuid: string): Promise<IDuuzraState>;
}

export class StateDeltaService extends ServiceBase<IDuuzraState> implements IStateDeltaService {
    private stateLogRepo: IStateLogRepository;

    // ####################################
    // # LIFECYCLE
    // ####################################

    constructor() {
        super();
        this.stateLogRepo = new StateLogRepository();
    }

    // ####################################
    // # DATA READS
    // ####################################

    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuid: string): Promise<IDuuzraState>;
    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, filters?: any, sort?: any): Promise<IDuuzraState[]>
    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, filters?: any, sort?: any): Promise<IDuuzraState | IDuuzraState[]> {
        console.log("state-delta.service.ts getAction()");
        if (this.isUuidQuery(filters)) {
            // get the state log
            const stateLog = await this.stateLogRepo.getStateLog(scopeUuid, filters as string);
            if (!stateLog || stateLog.length === 0) {
                return Promise.resolve(null);
            }

            // find the last navigation push entry
            let navigationEntry: StateLogEntry;
            for (let i = stateLog.length - 1; i >= 0; i--) {
                if (stateLog[i].entryType === 'navigation') {
                    navigationEntry = stateLog[i];
                    break;
                }
            }

            // flatten the content-lock entries, newest will surface
            const contentLocks: IKeyValuePair<StateLogEntry> = {};
            stateLog.filter((entry) => entry.entryType === 'content-lock')
                .forEach((entry) => contentLocks[entry.contentUuid] = entry);

            // if a content lock was applied after the navigation push, throw the navigation away
            if (navigationEntry) {
                const targetContentLock = contentLocks[navigationEntry.contentUuid];
                if (navigationEntry.timeStamp < targetContentLock.timeStamp) {
                    navigationEntry = null;
                }
            }

            // build the response which contains the delta changes

            const stateChanges: IDuuzraState = {
                stateUuid: stateLog[stateLog.length - 1]._id,
                navigation: navigationEntry ? {
                    duuzraUuid: scopeUuid,
                    contentUuid: navigationEntry.contentUuid,
                    stack: navigationEntry.data as IDuuzraNavigationPushLayer[],
                    slideUuid: null
                } : null,
                locks: Object.keys(contentLocks).map((contentUuid) => {
                    return {
                        duuzraUuid: contentLocks[contentUuid].duuzraUuid,
                        contentUuid: contentLocks[contentUuid].contentUuid,
                        locked: contentLocks[contentUuid].data as boolean
                    }
                })
            }; 
            return Promise.resolve(stateChanges); 
        } else { 
            return Promise.reject<IDuuzraState>(null);  
        }
    }
}

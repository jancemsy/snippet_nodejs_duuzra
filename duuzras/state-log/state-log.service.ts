import { IKeyValuePair } from '../../duuzra_types/common';
import {
    IDuuzraContentLockPush,
    IDuuzraNavigationPush,
    IDuuzraNavigationPushLayer,
    IDuuzraState
} from '../../duuzra_types/duuzras';
import { ServiceBase } from '../../core/services/index';
import { StateLogEntry } from './models';
import { StateLogRepository } from './state-log.repository';

// tslint:disable-next-line:no-var-requires
const uuidGen = require('uuid/v1');

export interface IStateLogService {
    logContentLockStateChange(duuzraUuid: string, contentUuid: string, locked: boolean, slideUuid?: string): Promise<IDuuzraState>;
    logContentNavigationStateChange(duuzraUuid: string, contentUuid: string, navStack: IDuuzraNavigationPushLayer[]): Promise<IDuuzraState>;
}

export class StateLogService extends ServiceBase<IDuuzraState> implements IStateLogService {
    private stateRepo: StateLogRepository;

    constructor() {
        super();
        this.stateRepo = new StateLogRepository();
    }

    /**
     * Logs a content lock state change
     */
    public async logContentLockStateChange(duuzraUuid: string, contentUuid: string, locked: boolean, slideUuid?: string): Promise<IDuuzraState> {
        console.log("state-log.service.ts logContentLockStateChange()");
        // create the state change entry
        const stateEntry = new StateLogEntry(
            uuidGen(),
            'content-lock',
            duuzraUuid,
            contentUuid,
            locked,
            slideUuid
        );

        // log the lock
        const entry = await this.stateRepo.logStateChange(stateEntry);

        // build the state response
        return Promise.resolve({
            stateUuid: entry._id,
            locks: [{
                duuzraUuid,
                contentUuid,
                locked
            }]
        });
    }

    /**
     * Logs a content navigation state change
     */
    public async logContentNavigationStateChange(duuzraUuid: string, contentUuid: string, navStack: IDuuzraNavigationPushLayer[], slideUuid: string = null): Promise<IDuuzraState> {
        console.log("state-log.service.ts logContentNavigationStateChange()");
        // create the state change entry
        const stateEntry = new StateLogEntry(
            uuidGen(),
            'navigation',
            duuzraUuid,
            contentUuid,
            navStack,
            slideUuid
        );

        // automatically issue a content unlock before we log a nav push
        const lockResponse = await this.logContentLockStateChange(duuzraUuid, contentUuid, false, slideUuid);

        // log the navigation
        const entry = await this.stateRepo.logStateChange(stateEntry);

        // build the state response
        return Promise.resolve({
            stateUuid: entry._id,
            locks: lockResponse.locks,
            navigation: {
                duuzraUuid,
                contentUuid,
                stack: navStack,
                slideUuid
            }
        });
    }
}

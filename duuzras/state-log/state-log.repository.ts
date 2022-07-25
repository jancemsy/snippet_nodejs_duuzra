import { IKeyValuePair } from '../../duuzra_types/common';
import { StateLogEntry } from './models';
import { System } from '../../shared'

export abstract class IStateLogRepository {
    public abstract async logStateChange(stateEntry: StateLogEntry): Promise<StateLogEntry>;
    public abstract async getStateLog(duuzraUuid: string, lastStateUuid?: string): Promise<StateLogEntry[]>;
    public abstract async getStateEntryById(stateUuid: string): Promise<StateLogEntry>;
}

export class StateLogRepository implements IStateLogRepository {
    /**
     * Records a state change for the specified duuzra
     */
    public async logStateChange(stateEntry: StateLogEntry): Promise<StateLogEntry> {
        console.log("state-log.repository.ts logStateChange()");
        try{
            // save the entry to the db
            let result = await System.DB.save(stateEntry) as StateLogEntry;
            return Promise.resolve(result);
        }catch (err){
            return Promise.reject<StateLogEntry>(err);
        }

    }

    /**
     * Gets the delta state change from the reference point defined by the laststateUuid parameter
     */
    public async getStateLog(duuzraUuid: string, lastStateUuid: string = null): Promise<StateLogEntry[]> {
        console.log("state-log.repository.ts getStateLog()");
        try{
            // get the state log from the database
            let stateLog: StateLogEntry[] = null;
            let lastChange: StateLogEntry;

            // if we have a supplied last change id, get all newer entries
            if (lastStateUuid) {
                lastChange = await this.getStateEntryById(lastStateUuid);
            }

            if (lastChange) {
                // we have a matching state entry
                let recentChanges = await System.DB.get(StateLogEntry.docType, 'duuzraUuid_timeStamp', null, {
                    descending: false,
                    startkey: [duuzraUuid, (lastChange.timeStamp + 1).toString()],
                    endkey: [duuzraUuid, {}]
                }) as any;

                // map the changes
                if (recentChanges && recentChanges.docs.length > 0) {
                    stateLog = recentChanges.docs as StateLogEntry[];
                }
            } else {
                // no last change found so we need to get all entries
                let changes = await System.DB.get(StateLogEntry.docType, 'duuzraUuid_timeStamp', null, {
                    descending: false,
                    startkey: [duuzraUuid, 0],
                    endkey: [duuzraUuid, {}]
                }) as any;
                if (changes && changes.docs.length > 0) {
                    stateLog = changes.docs as StateLogEntry[];
                }
            }

            // return the values
            return Promise.resolve(stateLog);
        }catch (err){
            return Promise.reject<StateLogEntry[]>(err);
        }

    }

    /**
     * Gets a state entry by id
     */
    public async getStateEntryById(stateUuid: string): Promise<StateLogEntry> {
        console.log("state-log.repository.ts getStateEntryById()");
        try{
            let result: any = await System.DB.get(StateLogEntry.docType, 'id', stateUuid);
            if (!result || result.docs.length === 0) {
                return Promise.resolve(null);
            }
            return Promise.resolve(result.docs[0] as StateLogEntry);
        }catch (err){
            return Promise.reject<StateLogEntry>(err);
        }

    }
}

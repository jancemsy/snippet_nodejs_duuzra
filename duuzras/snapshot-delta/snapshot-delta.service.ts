import { IKeyValuePair } from '../../duuzra_types/common';
import {
    IDuuzraContentLockPush,
    IDuuzraNavigationPush,
    IDuuzraNavigationPushLayer,
    IDuuzraState,
    ISnapshotDeltaDto
} from '../../duuzra_types/duuzras';
import { ServiceBase } from '../../core/services/index';
import { ITokenProvider } from '../../core/token/index';
import { DuuzraSnapshotRepository, IDuuzraSnapshotRepository } from '../duuzra-snapshot/duuzra-snapshot.repository';

// tslint:disable-next-line:no-var-requires
const uuidGen = require('uuid/v1');

export interface ISnapshotDeltaService {
    get(token: string, correlationId: string, scopeUuid: string, uuid: string): Promise<ISnapshotDeltaDto>;
}

export class SnapshotDeltaService extends ServiceBase<ISnapshotDeltaDto> implements ISnapshotDeltaService {
    private snapshotRepo: IDuuzraSnapshotRepository;

    // ####################################
    // # LIFECYCLE
    // ####################################

    constructor() {
        super();
        this.snapshotRepo = new DuuzraSnapshotRepository();
    }

    // ####################################
    // # DATA READS
    // ####################################

    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, latestUuid: string): Promise<ISnapshotDeltaDto>;
    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, filters?: any, sort?: any): Promise<ISnapshotDeltaDto[]>
    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, filters?: any, sort?: any): Promise<ISnapshotDeltaDto | ISnapshotDeltaDto[]> {
        console.log("snapshot-deleta.service.ts getAction()");
        try {

            if (this.isUuidQuery(filters)) {
                // get the state log
                const currentSnapshotUuid = filters as string;

                const latestSnapshotForUser = await this.snapshotRepo.getSnapshotUpdateForAuthUserByDuuzraUuid(tokenProvider.payload.uuid, scopeUuid, currentSnapshotUuid);
                if (currentSnapshotUuid !== latestSnapshotForUser.snapshotUuid) {
                    return Promise.resolve(latestSnapshotForUser);
                } else {
                    return Promise.resolve(null);
                }
            } else {
                // todo - the base classes don't handle scenarios where the query is parameterisesd. It only handles this in the case of
                //      - extracting a uuid and the scope uuid as direcly passed parameters.
                // note - for this call we need to be able to pass 2 snapshot Uuids and determine the differnce.
                //      - as such the only way to do this is through the filters. So that is what has been done. However the base classes need updating
                //      - to handle parameterised queries and not just uuid.

                const friendlyOutput = filters.friendlyOutput
                const snapshotDelta = await this.snapshotRepo.getSnapshotDelta(tokenProvider.payload.uuid, scopeUuid, filters.snapshotAUuid, filters.snapshotBUuid, friendlyOutput);

                return Promise.resolve(snapshotDelta);
            }
        } catch (e) {
            return Promise.resolve(null);
        }
    }
}

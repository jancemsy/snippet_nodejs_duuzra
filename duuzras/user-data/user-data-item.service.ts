import { IUserDataDto, IUserDataItemDto } from '../../duuzra_types/duuzras';
import { CommunicationVerb } from '../../duuzra_types/network';
import { IDuuzraTokenPayload } from '../../duuzra_types/security';
import { ServiceBase } from '../../core/services/index';
import { ITokenProvider } from '../../core/token/index';
import { UserDataRepository } from './user-data.repository';

export interface IUserDataItemService {
    create(token: string, correlationId: string, scopeUuid: string, object: IUserDataItemDto): Promise<IUserDataItemDto>;
    // update(token: string, correlationId: string, scopeUuid: string, object: IUserDataItemDto): Promise<IUserDataItemDto>
    // delete(token: string, correlationId: string, scopeUuid: string, uuid: string): Promise<IUserDataItemDto>;
}
export class UserDataItemService extends ServiceBase<IUserDataItemDto> implements IUserDataItemService {
    private userDataRepo: UserDataRepository;

    constructor() {
        super();
        this.userDataRepo = new UserDataRepository();
    }

    // ####################################
    // # DATA CHANGES
    // ####################################

    public async createAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, object: IUserDataItemDto): Promise<IUserDataItemDto>;
    public async createAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, object: IUserDataItemDto[]): Promise<IUserDataItemDto[]>;
    public async createAction(
        tokenProvider: ITokenProvider,
        correlationId: string,
        scopeUuid: string,
        object: IUserDataItemDto | IUserDataItemDto[]
    ): Promise<IUserDataItemDto | IUserDataItemDto[]> {
        
        console.log("user-data-item.service.ts createAction()");

        return this.implementSingleOnly(CommunicationVerb.POST, object, async () => {
            const objectSingle: IUserDataItemDto = object as IUserDataItemDto;
            return this.userDataRepo.createUserData(tokenProvider.payload.uuid, scopeUuid, objectSingle)
        });
    }

    protected async updateAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, object: IUserDataItemDto): Promise<IUserDataItemDto> {
        console.log("user-data-item.service.ts UpdateAction()");
        return this.userDataRepo.updateUserData(tokenProvider.payload.uuid, scopeUuid, object);
    }

    protected async deleteAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuid: string): Promise<IUserDataItemDto>;
    protected async deleteAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuids: string[]): Promise<IUserDataItemDto[]>;
    protected async deleteAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuids: string | string[]): Promise<IUserDataItemDto | IUserDataItemDto[]> {
        console.log("user-data-item.service.ts DeleteAction()");
        return this.implementSingleOnly(CommunicationVerb.DELETE, uuids, () => {
            const uuidSingle: string = uuids as string;
            return this.userDataRepo.deleteUserData(tokenProvider.payload.uuid, scopeUuid, uuidSingle);
        });
    }
}

import { ServiceBase } from '../../core/services/index';
import { ITokenProvider } from '../../core/token/index';
import { IAttendeeDto, IDuuzraInfoDto, IGroupDto, } from '../../duuzra_types/duuzras';
import { CommunicationVerb } from '../../duuzra_types/network';
import { IDuuzraTokenPayload } from '../../duuzra_types/security';
import { ClaimsService } from '../../shared/claims/claims.service';
import { AttendeeService, IAttendeeService } from '../attendees/attendee.service';
import { GroupService, IGroupService } from '../groups/group.service';
import { IMediaService, MediaService } from '../media/media.service';
import { DuuzraInfoRepository, IDuuzraInfoRepository } from './duuzra-info.repository';
/* Cross Service Communication */
/* The RPC mechanism needs to be considered before any split for this item */

import { DuuzraPermissions } from '../duuzra.permissions';

export interface IDuuzraInfoService {
    get(token: string, correlationId: string, scopeUuid: string, uuid: string): Promise<IDuuzraInfoDto>;
    get(token: string, correlationId: string, scopeUuid: string, filter?: any, sort?: any): Promise<IDuuzraInfoDto[]>;
    create(token: string, correlationId: string, scopeUuid: string, object: IDuuzraInfoDto): Promise<IDuuzraInfoDto>;
    update(token: string, correlationId: string, scopeUuid: string, object: IDuuzraInfoDto): Promise<IDuuzraInfoDto>;
    delete(token: string, correlationId: string, scopeUuid: string, uuid: string): Promise<IDuuzraInfoDto>;
}

export class DuuzraInfoService extends ServiceBase<IDuuzraInfoDto> implements IDuuzraInfoService {

    private mediaService: IMediaService;
    private infoRepo: IDuuzraInfoRepository;
    private groupService: IGroupService;
    private attendeeService: IAttendeeService;

    // ##########################################################################
    // # LIFECYCLE
    // ##########################################################################

    constructor() {
        super();
        this.mediaService = new MediaService();
        this.infoRepo = new DuuzraInfoRepository();
        this.groupService = new GroupService();
        this.attendeeService = new AttendeeService();
    }

    // ####################################
    // # DATA READS
    // ####################################

    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuid: string): Promise<IDuuzraInfoDto>;
    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, filters?: any, sort?: any): Promise<IDuuzraInfoDto[]>
    public async getAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, filters?: any, sort?: any): Promise<IDuuzraInfoDto | IDuuzraInfoDto[]> { 
        console.log("duuzra-info.service.ts getAction()");
        if (this.isUuidQuery(filters)) {
            return await this.infoRepo.getInfoByUuid(filters as string);
        }

        if (sort && sort.name == "getAllContent") { 
            return await this.infoRepo.getTotalFeatureOfDuuzra(sort.duuzraUuid); 
         } else {
            const map: Map<boolean, () => Promise<IDuuzraInfoDto[]>> = new Map();  
            map.set(!!tokenProvider.payload.uuid && !!tokenProvider.isCMSAdmin, () => this.infoRepo.getInfosByAdministrator(tokenProvider.payload.uuid)); 
            return this.getResultsFromPrioritizedConditions(map, filters, sort);
        }
    }

    // ####################################
    // # DATA CHANGES
    // ####################################

    public async createAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, object: IDuuzraInfoDto): Promise<IDuuzraInfoDto>;
    public async createAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, object: IDuuzraInfoDto[]): Promise<IDuuzraInfoDto[]>;
    public async createAction(
        tokenProvider: ITokenProvider,
        correlationId: string,
        scopeUuid: string,
        object: IDuuzraInfoDto | IDuuzraInfoDto[]
    ): Promise<IDuuzraInfoDto | IDuuzraInfoDto[]> { 
        console.log("duuzra-info.service.ts createAction()");
        return this.implementSingleOnly(CommunicationVerb.POST, object, async () => {
            const objectSingle: IDuuzraInfoDto = object as IDuuzraInfoDto;
            // Create the media object
            const thumbnailUuid = objectSingle.thumbnailImage ? objectSingle.thumbnailImage.uuid : null;

            // TODO: Info should be client scope? Not user scope as on doc. Replace null clientUuid param below with scope when completed
            const createdInfo = await this.infoRepo.createInfo(tokenProvider.payload.uuid, scopeUuid, objectSingle, thumbnailUuid);

            // Once we have created the duuzra create a group for 'all'
            const groupDto: IGroupDto = {
                groupName: 'All (default)',
                duuzraUuid: createdInfo.uuid,
                groupAttendeeUuids: [],
                groupPermissions: {
                    appMasterEnabled: false,
                    appMessagingEnabled: false,
                    appNotesEnabled: false,
                    appQuestionsEnabled: false,
                    cmsAnalyticsEnabled: false,
                    cmsEditEnabled: false,
                    cmsSharingEnabled: false,
                    canSubmitQuestionAsAnnonymous: false,
                    canReceiveNotificationDuuzraLive: false,
                    canReceiveNotificationContentAddRemove: false
                },
                createdBy: null, // handled by the repository
                dateCreated: null, // handled by the repository
                uuid: null, // handled by the repository
                isDefault: true
            };
            await this.groupService.create(tokenProvider.token, correlationId, createdInfo.uuid, groupDto).then((group) => {

                // Create the attendee
                const creatorsAttendee: IAttendeeDto = {
                    uuid: null,
                    authUuid: tokenProvider.payload.uuid,
                    duuzraUuid: createdInfo.uuid,
                    email: null,
                    firstname: null,
                    hasRegistered: null,
                    isAnnonymous: null,
                    isEmailValidated: null,
                    lastname: null,
                    permissions: {
                        appMasterEnabled: true,
                        appMessagingEnabled: true,
                        appNotesEnabled: true,
                        appQuestionsEnabled: true,
                        cmsAnalyticsEnabled: true,
                        cmsEditEnabled: true,
                        cmsSharingEnabled: true,
                        canSubmitQuestionAsAnnonymous: true,
                        canReceiveNotificationDuuzraLive: false,
                        canReceiveNotificationContentAddRemove: false
                    }
                }

                this.attendeeService.createAttendeeForKnownUser(
                    tokenProvider.token,
                    correlationId,
                    createdInfo.uuid,
                    creatorsAttendee
                );
                return;
            });
            return createdInfo
        })
    }

    protected async updateAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, object: IDuuzraInfoDto): Promise<IDuuzraInfoDto> { 
        console.log("duuzra-info.service.ts updateAction()");
        const thumbnailUuid: string = object.thumbnailImage ? object.thumbnailImage.uuid : null; 
        return this.infoRepo.updateInfo(null, object, thumbnailUuid);
    }

    protected async deleteAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuid: string, isDeleted?: boolean): Promise<IDuuzraInfoDto>;
    protected async deleteAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuids: string[], isDeleted?: boolean): Promise<IDuuzraInfoDto[]>;
    protected async deleteAction(tokenProvider: ITokenProvider, correlationId: string, scopeUuid: string, uuids: string | string[], isDeleted?: boolean): Promise<IDuuzraInfoDto | IDuuzraInfoDto[]> { 
        console.log("duuzra-info.service.ts deleteAction()");
        return this.implementSingleOnly(CommunicationVerb.POST, uuids, async () => {
            const uuidSingle: string = uuids as string;
            return this.infoRepo.deleteInfo(tokenProvider.payload.uuid, uuidSingle, isDeleted);
        });
    }

    // ####################################
    // # SYSTEM HELPERS
    // ####################################

    // TODO: Do we need this now?
    // public async isUserAdministrator(tokenPayload: IDuuzraTokenPayload, duuzraUuid: string): Promise < boolean > {

    //     try {
    //         /* note - improvement here to eb less wasteful to fill the function requirement  */

    //         let infosForUser = await this.get(tokenPayload, null, null);
    //         let match = infosForUser.find((info) => { return info.uuid === duuzraUuid; })
    //             return Promise.resolve<boolean>(match ? true : false);
    //     } catch (e) {
    //         console.error('ERROR:', e);
    //         return Promise.resolve<boolean>(false);
    //     }
    // }
}

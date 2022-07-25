import { IAuthUserDto } from '../../duuzra_types/auth'
import {
    CommandTypes,
    CommandVerbs,
    CommunicationFactory,
    CommunicationHandler,
    CommunicationStatuses,
    ICommunication,
} from '../../duuzra_types/network';
import { AuthUserService, IAuthUserService } from '../';
import { ServiceBaseHandler } from '../../core/index';
import { SessionService, System } from '../../shared';

export class AuthUserHandler extends ServiceBaseHandler<IAuthUserDto[]> {
    private userService: IAuthUserService;

    constructor() {
        super()
        this.userService = new AuthUserService();
    }

    public async processCommunication(communication: ICommunication<any>): Promise<ICommunication<IAuthUserDto[]>> {
        console.log("authuser.handler.ts processCommunication()"); 
        const filter = communication.head.parameters['filter'] || {};
        const sort = communication.head.parameters['sort'] || null;
        const uuid = communication.head.parameters['uuid'] || null;

        let response: any;
        let status: CommunicationStatuses;

        try {
            await this.verifyToken(communication.head.authToken);
            const userId = super.extractTokenUserId();
        } catch (err) {
            return super.buildForbiddenResponse(communication, err);
        }

        try {
            switch (communication.head.verb) {

                case CommandVerbs.delete: 
                    return super.buildErrorResponse(communication, 'error');
                case CommandVerbs.put:
                    return super.buildErrorResponse(communication, 'error');
                case CommandVerbs.post:
                    response = await this.userService.createUser(this.myExtractedToken.sub, communication.body as IAuthUserDto);
                    status = CommunicationStatuses.Created;
                    break;  
                default:
                    // hack - to deal with calls using the uuid on parameters directly and not in the filter.
                    if (uuid) {
                        filter.uuid = uuid;
                    }

                    response = await this.userService.getUsers(this.myExtractedToken.sub, filter, sort);

                    // handle request for singular
                    if (response.length === 1 && uuid) {
                        response = response[0];
                    }

                    status = CommunicationStatuses.OK;
                    break;
            }
        } catch (err) {
            return super.buildErrorResponse(communication, err);
        }

        // fire the results down the pipe to the client
        return Promise.resolve(
            CommunicationFactory.createResponse(communication, status, null, response)
        );
    }
}

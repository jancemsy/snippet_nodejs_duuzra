import { IAuthClaimDto } from '../../duuzra_types/auth'
import {
    CommandTypes,
    CommandVerbs,
    CommunicationFactory,
    CommunicationHandler,
    CommunicationStatuses,
    ICommunication,
} from '../../duuzra_types/network';
import { AuthClaimService, IAuthClaimService } from '../';
import { ServiceBaseHandler } from '../../core/index';
import { SessionService, System } from '../../shared';

export class AuthClaimHandler extends ServiceBaseHandler<IAuthClaimDto[]> {
    private claimService: IAuthClaimService;

    constructor() {
        super()
        this.claimService = new AuthClaimService();
    }

    public async processCommunication(communication: ICommunication<any>): Promise<ICommunication<IAuthClaimDto[]>> {
        console.log("authclaim.handler.ts processCommunication()"); 
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
                    response = await this.claimService.deleteClaim(communication.body as IAuthClaimDto);
                    status = CommunicationStatuses.OK;
                    break;
                case CommandVerbs.put: 
                    return super.buildErrorResponse(communication, 'AuthClaim Update - Not Implemented');
                case CommandVerbs.post:
                    response = await this.claimService.createClaim(communication.body as IAuthClaimDto);
                    status = CommunicationStatuses.Created;
                    break;
                default: 
                    return super.buildErrorResponse(communication, 'AuthClaim Update - Not Implemented');
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

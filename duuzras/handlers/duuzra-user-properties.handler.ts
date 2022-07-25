// import {
//     ICommunication,
//     CommunicationStatuses,
//     CommunicationFactory
// } from '../../duuzra_types/network';
// import { CommandVerbs } from '../../duuzra_types/network';
// import { ServiceBaseHandler } from '../../core';
// import { UserService } from '../../shared/user/user.service';
// import { IDuuzraUserPropertiesDto } from '../../duuzra_types/duuzras';

// export class DuuzraUserPropertiesHandler extends ServiceBaseHandler<any>  {

//     private userService: UserService;

//     constructor() {
//         super();
//         this.userService = new UserService();

//     }

//     public async processCommunication(communication: ICommunication<any>): Promise<ICommunication<any>> {

//         let userPropertiesUuid = communication.head.parameters['userPropertiesUuid'] || null;

//         try {
//             await this.verifyToken(communication.head.authToken);
//             let userId = super.extractTokenUserId();
//         } catch (err) {
//             return super.buildForbiddenResponse(communication,err);
//         }

//         let response;
//         let status;

//         switch (communication.head.verb) {
//             case CommandVerbs.get:
//                 response = await this.userService.getUserProperites(userPropertiesUuid);
//                 status = CommunicationStatuses.OK;
//                 break;
//             case CommandVerbs.post:
//                 response = await this.userService.updateUserProperties(communication.body, communication.head.authToken);
//                 status = CommunicationStatuses.OK;
//                 break;
//             default:
//                 break;
//         }

//         return Promise.resolve(
//             CommunicationFactory.createResponse(communication, CommunicationStatuses.OK, null, response)
//         );
//     }

// }

// import {
//     ICommunication,
//     CommunicationStatuses,
//     CommandTypes,
//     CommunicationHandler,
//     CommunicationFactory,
//     CommandVerbs
// } from '../../duuzra_types/network';

// import { ServiceBaseHandler } from '../../core/index';
// import { IDuuzraGroupService, DuuzraGroupService } from '../group/duuzra-group.service';

// export class DuuzraGroupsHandler extends ServiceBaseHandler<any>  {

//     private duuzraGroupsService: IDuuzraGroupService;

//     constructor() {
//         super();
//         this.duuzraGroupsService = new DuuzraGroupService();

//     }

//     public async processCommunication(communication: ICommunication<any>): Promise<ICommunication<any>> {

//         let duuzraUuid = communication.head.parameters['duuzraUuid'] || null;
//         let groupName = communication.head.parameters['groupName'] || null;

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
//                 response = await this.duuzraGroupsService.getGroupList(this.myExtractedToken.sub, duuzraUuid);
//                 status = CommunicationStatuses.OK;
//                 break;
//             case CommandVerbs.delete:
//                 response = await this.duuzraGroupsService.deleteGroup(this.myExtractedToken.sub, duuzraUuid, groupName);
//                 status = CommunicationStatuses.OK;
//                 break;
//             case CommandVerbs.put:
//             case CommandVerbs.post:
//                 response = await this.duuzraGroupsService.addGroup(this.myExtractedToken.sub, duuzraUuid, groupName);
//                 status = CommunicationStatuses.Created;
//                 break;
//             default:
//                 break;
//         }

//         return Promise.resolve(
//             CommunicationFactory.createResponse(communication, CommunicationStatuses.OK, null, response)
//         );
//     }

// }

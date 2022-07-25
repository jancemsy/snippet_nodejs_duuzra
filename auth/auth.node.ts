import { IServiceBusNode, ServiceBus, CommandTypes, ServiceBusQueues } from '../duuzra_types/network';

import {
    AuthClaimHandler,
    AuthUserHandler
} from './handlers';

export class AuthNode implements IServiceBusNode {
    /**
     * Gets the name of this service node
     */
    public readonly name = 'auth';

    /**
     * Allows the node to configure any subscriptions it might need
     */
    registerSubscriptions(bus: ServiceBus): void {
        // register the queue handlers
        bus.subscribe(ServiceBusQueues.authNode.user, new AuthUserHandler());
        bus.subscribe(ServiceBusQueues.authNode.claim, new AuthClaimHandler());
    }
}

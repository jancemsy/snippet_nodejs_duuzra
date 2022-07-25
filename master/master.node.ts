import { IServiceBusNode, ServiceBus, CommandTypes, ServiceBusQueues } from '../duuzra_types/network';
import { GetUserCollatedDataHandler, PushContentLockHandler, PushNavigationHandler } from './handlers';

export class MasterNode implements IServiceBusNode {
    /**
     * Gets the name of this service node
     */
    public readonly name = 'master';

    /**
     * Allows the node to configure any subscriptions it might need
     */
    registerSubscriptions(bus: ServiceBus): void {
        // register the queue handlers
        bus.subscribe(ServiceBusQueues.masterNode.pushContentLock, new PushContentLockHandler());
        bus.subscribe(ServiceBusQueues.masterNode.pushNavigation, new PushNavigationHandler());
        bus.subscribe(ServiceBusQueues.masterNode.getUserCollatedData, new GetUserCollatedDataHandler());
    }
}

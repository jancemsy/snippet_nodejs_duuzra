import { IServiceBusNode, ServiceBus, ServiceBusQueues } from '../duuzra_types/network';
import {
    HandshakeHandler,
    MessageRelayHandler,
    SetSessionDuuzraLinkHandler
} from './handlers';

/**
 * This is a core gateway node and needs to reside inside of the primary public facing service
 */
export class GatewayNode implements IServiceBusNode {
    /**
     * Gets the name of this gateway node
     */
    public readonly name = 'gateway';

    /**
     * Allows the node to configure any subscriptions it might need
     */
    registerSubscriptions(bus: ServiceBus): void {
        // register the queue handlers
        bus.subscribe(ServiceBusQueues.gatewayNode.handshake, new HandshakeHandler());
        bus.subscribe(ServiceBusQueues.gatewayNode.relayMessageToChannel, new MessageRelayHandler());
        bus.subscribe(ServiceBusQueues.gatewayNode.setSessionDuuzraLink, new SetSessionDuuzraLinkHandler());
    }
}

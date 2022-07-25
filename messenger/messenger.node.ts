import { IServiceBusNode, ServiceBus, ServiceBusQueues } from '../duuzra_types/network';
import {
    SendMessageToAttendeeHandler,
    GetMessageLogDeltaHandler,
    GetMessageNotificationHandler
} from './handlers';

export class MessengerNode implements IServiceBusNode {
    /**
     * Gets the name of this service node
     */
    public readonly name = 'messenger';

    /**
     * Allows the node to configure any subscriptions it might need
     */
    public registerSubscriptions(bus: ServiceBus): void {
        // register the queue handlers
        bus.subscribe(ServiceBusQueues.messengerNode.sendMessageToAttendee, new SendMessageToAttendeeHandler());
        bus.subscribe(ServiceBusQueues.messengerNode.getMessageLogDelta, new GetMessageLogDeltaHandler());
        bus.subscribe(ServiceBusQueues.messengerNode.getMessageNotification, new GetMessageNotificationHandler());
    }
}

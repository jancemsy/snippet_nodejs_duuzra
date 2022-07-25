import { IDbModel } from '../../duuzra_types/database';
import { CommunicationsStream, WsChannels } from '../../duuzra_types/network';
import { Session } from '../../shared'

// TODO This class needs to be broken apart and the base class needs moving to @duuzra/types
// See notes inside the class
export class ConnectedSession {
    // The duuzra that this session is currently in
    public associatedDuuzraUuid: string;
    public attendeeUuid: string;
    private channels: {[channel: string]: CommunicationsStream<any>} = {};

    constructor(public session: Session) { }

    /**
     * Links the specified channel to this session
     */
    public linkChannel(channel: WsChannels, stream: CommunicationsStream<any>): void {
        console.log('linkChannel here...');
        if (!channel || !stream) {
            return;
        }
        this.channels[channel] = stream;
    }

    /**
     * Unlinks the specified channel to this session
     */
    public unlinkChannel(channel: WsChannels): void {
        delete this.channels[channel];
    }

    /**
     * Gets the stream for the specified channel linked to this session
     */
    public getStreamByChannel(channel: WsChannels): CommunicationsStream<any> {
        console.log('getStreamByChannel here...');
        return this.channels[channel] || null;
    }

    /**
     * Gets a flag indicating if the specified channel has been linked to this session or not
     */
    public isChannelLinked(channel: WsChannels): boolean {
        return !!this.channels[channel];
    }

}

import {EventEmitter} from 'events';
/**
 * @class AppNotifier
 * @author Jonathan Casarrubias
 * @description This class is an App Level notifier.
 * It will be used to send events like when a user
 * is disconnected through websocket.
 */
export class AppNotifier extends EventEmitter {}

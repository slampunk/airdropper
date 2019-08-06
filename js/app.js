import EventEmitter from './lib/eventEmitter.js';
import TransportService from './services/wsTransport.js';
import PeerManagerService from './services/peerManager.js';
import User from './components/user/user.js';
import PeerList from './components/peerList/peerList.js';

export default class App {
  constructor() {
    this.emitter = new EventEmitter();

    this.transport = new TransportService({ emitter: this.emitter });
    this.peerManager = new PeerManagerService({ emitter: this.emitter });

    this.user = new User({ emitter: this.emitter });
    this.remoteUserElements = new PeerList({ emitter: this.emitter });
  }
}

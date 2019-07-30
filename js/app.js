import EventEmitter from './lib/eventEmitter.js';
import Transport from './lib/wsTransport.js';
import User from './components/user/user.js';
import PeerList from './components/peerList/peerList.js';

export default class App {
  constructor() {
    this.emitter = new EventEmitter();
    this.transport = new Transport({ emitter: this.emitter });

    this.user = new User({ emitter: this.emitter });
    this.remoteUserElements = new PeerList({ emitter: this.emitter });
  }
}

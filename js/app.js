import EventEmitter from './lib/eventEmitter.js';
import TransportService from './services/wsTransport.js';
import PeerManagerService from './services/peerManager.js';
import User from './components/user/user.js';
import PeerList from './components/peerList/peerList.js';
import Notifications from './components/notifications/notifications.js';
import FileTransferList from './components/fileTransferList/fileTransferList.js';

export default class App {
  constructor() {
    this.emitter = new EventEmitter();

    this.transport = new TransportService({ emitter: this.emitter });
    this.peerManager = new PeerManagerService({ emitter: this.emitter });

    this.user = new User({ emitter: this.emitter });
    this.remoteUserElements = new PeerList({ emitter: this.emitter });
    this.notifications = new Notifications({ emitter: this.emitter });
    this.fileTransferList = new FileTransferList({ emitter: this.emitter });

    if (location.href.indexOf('debug=true') > -1) {
      window.emitter = this.emitter;
    }
  }
}

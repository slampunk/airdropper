import PeerConnection from '../lib/peerConnection.js';

export default class PeerManager {
  constructor(props) {
    this.emitter = props.emitter;
    this.peers = {};
    this.candidateQueue = {};
    this.pc_config = {
      iceServers:[
        { url: 'stun:stun.sipgate.net:3478' },
        { url: 'stun:stun.sip.us:3478' }
      ]
    };

    this.attachEvents();
  }

  attachEvents() {
    this.emitter.on('peer.connection.initiate', this.initiatePeerConnection);
    this.emitter.on('peerconnection', this.handlePeerConnectionResponse);
    this.emitter.on('config.servers.turn', this.handleTurnserverConfig)
  }

  initiatePeerConnection = connectionId => {
    if (!this.peers.hasOwnProperty(connectionId)) {
      this.peers[connectionId] = new PeerConnection({ emitter: this.emitter, peerId: connectionId, initiate: true, pc_config: this.pc_config });
    }
  }

  handlePeerConnectionResponse = (data) => {
    const { target } = data;
    if (!this.peers.hasOwnProperty(target)) {
      this.peers[target] = new PeerConnection({ emitter: this.emitter, peerId: target, initiate: false, pc_config: this.pc_config });
    }

    this.peers[target].handleRemoteRequest(data);
  }

  handleTurnserverConfig = turnConfig => {
    this.pc_config.iceServers = [].concat(
      this.pc_config.iceServers,
      turnConfig
    )
  }
}

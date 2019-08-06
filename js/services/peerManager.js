import PeerConnection from '../lib/peerConnection.js';

export default class PeerManager {
  constructor(props) {
    this.emitter = props.emitter;
    this.peers = {};
    this.candidateQueue = {};

    this.attachEvents();
  }

  attachEvents() {
    this.emitter.on('peer.connection.initiate', this.initiatePeerConnection);
    this.emitter.on('peerconnection', this.handlePeerConnectionResponse);
  }

  initiatePeerConnection = connectionId => {
    if (!this.peers.hasOwnProperty(connectionId)) {
      this.peers[connectionId] = new PeerConnection({ emitter: this.emitter, peerId: connectionId, initiate: true });
    }
  }

  handlePeerConnectionResponse = (data) => {
    const { target } = data;
    if (!this.peers.hasOwnProperty(target)) {
      this.peers[target] = new PeerConnection({ emitter: this.emitter, peerId: target, initiate: false });
    }

    this.peers[target].handleRemoteRequest(data);
  }
}

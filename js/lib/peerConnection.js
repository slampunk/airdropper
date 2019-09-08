import PeerMessenger from './peerMessenger.js';

export default class PeerConnection {
  constructor({ emitter, peerId, initiate = false, pc_config}) {
    this.emitter = emitter;
    this.id = peerId;
    this.pc_config = pc_config;
    this.candidatesQueue = [];
    this.messenger = null;

    console.log(this.pc_config);
    this.pc = new RTCPeerConnection(this.pc_config);

    this.handleRTCEvents();

    initiate && this.initiateConnection();
  }

  initiateConnection() {
    this.channel = this.pc.createDataChannel('channel');
    this.messenger = new PeerMessenger(this);
    this.sendOffer();
  }

  handleRTCEvents() {
    this.pc.onicecandidate = this.handleIceCandidate;
    this.pc.oniceconnectionstatechange = this.handleIceStateChange;
    this.pc.ondatachannel = this.setupDataChannel;
    this.emitter.on(`peer.connection.remoteDesc.set.${this.id}`, this.handleRemoteDescriptionAvailable);
  }

  handleIceCandidate = (e) => {
    if (e.candidate) {
      const details = {
        ...e.candidate.toJSON(),
        type: 'candidate'
      };
      this.sendCommunication('peer.connection.config', { target: this.id, details: details });
    }
  }

  handleIceStateChange = (e) => {
    const isConnected = ['connected', 'completed'].find(state => state === this.pc.iceConnectionState);
    if (isConnected) {
      this.emitter.emit('peer.connection.established', this.id);
    }
  }

  handleRemoteDescriptionAvailable = () =>
    this.candidatesQueue.splice(0)
      .forEach(candidate => this.pc.addIceCandidate(candidate));

  setupDataChannel = (e) => {
    this.channel = this.channel || e.channel;
    this.channel.binaryType = 'arraybuffer';
    this.messenger = new PeerMessenger({ emitter: this.emitter, id: this.id, channel: this.channel });
  }

  sendOffer() {
    this.pc.createOffer()
      .then(offer => {
        this.pc.setLocalDescription(offer);
        this.sendCommunication('peer.connection.config', { target: this.id, details: offer });
      });
  }

  sendAnswer() {
    this.pc.createAnswer()
      .then(answer => {
        this.pc.setLocalDescription(answer);
        this.sendCommunication('peer.connection.config', { target: this.id, details: answer });
      });
  }

  sendCommunication(evtName, data) {
    if (this.messenger && this.messenger.channel.readyState === 'open') {
      return this.messenger.send({ event: evtName, payload: data });
    }

    this.emitter.emit('ws.send', { action: 'peerconnection', payload: data });
  }

  handleOffer(details) {
    if (!this.pc.remoteDescription || !this.pc.remoteDescription.sdp) {
      this.pc.setRemoteDescription(new RTCSessionDescription(details))
        .then(() => this.emitter.emit(`peer.connection.remoteDesc.set.${this.id}`));
    }

    this.sendAnswer();
  }

  handleAnswer(details) {
    this.pc.setRemoteDescription(new RTCSessionDescription(details));
  }

  addRemoteCandidate(details) {
    const candidate = new RTCIceCandidate(details);
    if (this.pc.remoteDescription) {
      return this.pc.addIceCandidate(candidate);
    }

    this.candidatesQueue.push(candidate);
  }

  handleRemoteRequest(data) {
    const { details } = data;
    switch (details.type) {
      case 'offer':
        this.handleOffer(details);
        break;

      case 'answer':
        this.handleAnswer(details);
        break;

      case 'candidate':
        this.addRemoteCandidate(details);
        break;
    }
  }
}

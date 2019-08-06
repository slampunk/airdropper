const pc_config = {
  urls:[
    { url: 'stun:stun.sipgate.net:3478' },
    { url: 'stun:stun.sip.us:3478' }
  ]
};

export default class PeerConnection {
  constructor({ emitter, peerId, initiate = false}) {
    this.emitter = emitter;
    this.id = peerId;

    this.pc = new RTCPeerConnection(pc_config);
    this.fileChunk = 16384;
    this.candidatesQueue = [];
    this.fileTransfers = {};
    this.handleRTCEvents();

    initiate && this.initiateConnection();
  }

  initiateConnection() {
    this.pc.createDataChannel('channel');
    this.setChannelEvents();
    this.sendOffer();
  }

  handleRTCEvents() {
    this.pc.onicecandidate = evt => {
      if (evt.candidate) {
        const details = {
          ...evt.candidate.toJSON(),
          type: 'candidate'
        };
        this.sendCommunication('peer.connection.config', { target: this.id, details: details });
      }
    }

    this.pc.oniceconnectionstatechange = evt => {
      const isConnected = ['connected', 'completed'].find(state => state === this.pc.iceConnectionState);
      if (isConnected) {
        console.log('peer connection established');
        this.emitter.emit('peer.connection.established', this.id);
      }
    }

    this.pc.ondatachannel = evt => {
      this.dataChannel = this.dataChannel || evt.channel;
    }

    this.emitter.on(`peer.connection.remoteDesc.set.${this.id}`, () => {
      this.candidatesQueue.splice(0)
        .forEach(candidate => this.pc.addIceCandidate(candidate));
    });
  }

  setChannelEvents = () => {
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
    if (this.pc.dataChannel && this.pc.dataChanel.readyState === 'open') {
      return this.sendMessage(evtName, data);
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

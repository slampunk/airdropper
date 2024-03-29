export default class WebsocketTransport {
  constructor(opts) {
    this.emitter = opts.emitter;
    this.socket = new WebSocket('wss://1v4j1j98ob.execute-api.ap-south-1.amazonaws.com/beta');
    this.handleSocketEvents();
    this.attachEvents();

    this.queue = [];
  }

  handleSocketEvents() {
    this.socket.onopen = e => {
      this.emitter.emit('ws.open');
      this.queue.splice(0).forEach(this.sendMessage);
    };

    this.socket.onclose = e => {
      console.log('socket closed', e);
    };

    this.socket.onerror = e => {
      console.log('socket error', e);
    };

    this.socket.onmessage = e => {
      try {
        let message = JSON.parse(e.data);
        this.emitter.emit(message.action, message.payload);
      } catch(e) {
      }
    };
  }

  attachEvents() {
    this.emitter.on('ws.send', this.sendMessage);
  }

  sendMessage = data => {
    if (!data) {
      return;
    }

    if (!this.socket.readyState) {
      return this.queue.push(data);
    }

    let payload = typeof data == 'string' ? data : JSON.stringify(data);
    this.socket.send(payload);
  }
}

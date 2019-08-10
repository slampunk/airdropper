import { getFileSize } from './utils.js';

export default class PeerMessenger {
  constructor({ emitter, channel, id }) {
    this.emitter = emitter;
    this.channel = channel;
    this.id = id;
    this.incomingFiles = {};
    this.outgoingFiles = {};
    this.outgoingFilesCompleted = [];
    this.alwaysAccept = false;
    this.fileChunk = 16384;
    this.headerByteLength = 20;
    this.historicRateWeight = 1;

    this.attachLocalEvents();
    this.attachChannelEvents();
  }

  /* Listens for a number of local emitter events
   *
   * @params null
   * @returns void
   */
  attachLocalEvents() {
    this.emitter.on(`peer.${this.id}.filetransfer.initiate`, this.initialiseFileTransfer);
    this.emitter.on(`peer.${this.id}.filetransfer.accept`, this.acceptFileTransfer);
    this.emitter.on(`peer.${this.id}.file.transfer.next`, this.acceptFileTransfer);
  }

  /* Sets up listeners for events originating over data channel
   *
   * @params null
   * @returns void
   */
  attachChannelEvents() {
    this.channel.onmessage = this.handleChannelMessage;

    this.channel.onopen = e => {
      this.channel.send('ping');
    }

    this.channel.onerror = e => {
      console.log('channel error', e);
    }

    this.channel.onclose = e => {
      console.log('channel closed');
    }
  }

  /* Handles incoming messages and distributes them to various functions
   *
   * @params {RTCDataChannelEvent<e>} - message intercepted over data channel
   * @returns null
   */
  handleChannelMessage = (e) => {
    if (e.data instanceof ArrayBuffer) {
      return this.handleBinaryData(e.data);
    }

    let event = e.data;
    let data = {};

    try {
      data = JSON.parse(e.data);
      event = data.event;
    } catch(e) {
    }

    switch(event) {
      case 'file.transfer.request':
      case 'file.transfer.next':
        this.prepareFileTransfer(data.payload, event);
        break;

      case 'file.transfer.accept':
        this.performFileTransfer(data.payload);
        break;

      case 'file.transfer.progress':
        this.interrogateTransfer(data.payload);
        break;

      case 'file.transfer.complete':
        this.finaliseFileTransfer(data.payload);
        break;
    }
  }

  /* Handles and concatenates binary data
   *
   * @params {ArrayBuffer<data>} - binary data. includes a 20-byte header which denotes
   *                               the token of the file undergoing transfer.
   *
   *                               Parses the header to get the token, then lobs off the
   *                               remaining chunk to the `buildIncomingFile` method.
   */
  handleBinaryData(data) {
    const header = String.fromCharCode(...new Uint16Array(data.slice(0, this.headerByteLength))).replace(/\0/g, '');
    if (this.incomingFiles.hasOwnProperty(header)) {
      this.buildIncomingFile(header, data.slice(this.headerByteLength));
    }
  }

  /* Builds the incoming file
   *
   * @param {String<token>}      - token of the file, i.e. the file's key in `incomingFiles`.
   * @param {ArrayBuffer<chunk>} - binary chunk to be appended to file.
   */

  buildIncomingFile(token, chunk) {
    const file = this.incomingFiles[token];
    file.binaryData.push(chunk);
    file.recvBytes += chunk.byteLength;
    const currentTime = (new Date()).getTime();
    file.startTime = file.startTime || currentTime;
    file.lastTime = file.lastTime || currentTime;
    const elapsedTime = (currentTime - file.startTime) / 1000;
    const deltaFromLastTime = (currentTime - file.lastTime) / 1000;
    const historicRate = elapsedTime > 0 ? file.recvBytes / elapsedTime : 0;
    const deltaRate = deltaFromLastTime > 0 ? chunk.byteLength / deltaFromLastTime : 0;
    const aggregatedRate = this.historicRateWeight * historicRate + (1 - this.historicRateWeight) * deltaRate;
    const rate = elapsedTime > 0 ? getFileSize(aggregatedRate) + '/s' : '0 B/s';
    file.lastTime = currentTime;
    const perc = ~~(file.recvBytes / file.size * 100);
    this.emitter.emit(`peer.file.transfer.progress-${token}`, perc, rate);
  }

  /* Prepares the file transfer process. Files are staged in `this.outgoingFiles`
   * until the remote peer accepts the file.
   *
   * @params {FileList<files>} - an iterable-like list of files.
   *                             See https://developer.mozilla.org/en-US/docs/Web/API/FileList
   */
  initialiseFileTransfer = (files) => {
    [...files].forEach(file => {
      let token;
      do {
        token = (Math.random() + 1).toString(36).substring(2, 10);
      } while (this.outgoingFiles.hasOwnProperty(token));

      this.outgoingFiles[token] = {
        file: file,
        name: file.name,
        header: this.bufferFromString(token, this.headerByteLength),
        startTime: 0,
        lastTime: 0,
        sentBytes: 0,
        stopTransfer: false,
        lastChunk: 0,
        transferDelay: 0 // TODO: use this to apply backpressure on uploads that are too fast
      };
    });

    this.sendNextFile();
  }

  sendNextFile = () => {
    let nextToken = Object.keys(this.outgoingFiles).find(token => this.outgoingFilesCompleted.indexOf(token) === -1);
    if (!nextToken) {
      return;
    }

    const { name, size, type } = this.outgoingFiles[nextToken].file;
    const payload = { name, size, type, token: nextToken };

    if (this.alwaysAccept) {
      this.sendMessage('file.transfer.next', payload);
    }
    else {
      this.sendMessage('file.transfer.request', payload);
    }
  }

  /* Prepare file metadata on receiving side
   *
   * @params {FileMetadata<payload>}
   */
  prepareFileTransfer(payload, event) {
    const { token, name, size, type } = payload;
    if (this.incomingFiles[token]) {
      // File already incoming?
      return;
    }

    const transferType = event.indexOf('request') > -1 ? 'request' : 'next';
    //this.emitter.emit(`peer.${this.id}.file.transfer.request`, payload);
    this.emitter.emit(`peer.${this.id}.file.transfer.${transferType}`, payload);
  }

  acceptFileTransfer = (payload) => {
    const { token, name, size, type, alwaysAccept } = payload;
    this.incomingFiles[token] = {
      binaryData: [],
      filename: name,
      size: size,
      mimeType: type,
      recvBytes: 0,
      startTime: 0,
      lastTime: 0
    };

    if (alwaysAccept != undefined) {
      this.alwaysAccept = alwaysAccept;
    }

    this.sendMessage('file.transfer.accept', { token, alwaysAccept: this.alwaysAccept });
    this.emitter.emit('peer.file.transfer.incoming', { token, name, size, id: this.id });
  }

  performFileTransfer(details, startOffset = 0) {
    const { token, alwaysAccept } = details;
    if (alwaysAccept != undefined) {
      this.alwaysAccept = alwaysAccept;
    }

    const { file, name, size, header, transferDelay, stopTransfer } = this.outgoingFiles[token];
    const info = this.outgoingFiles[token];

    if (!file) {
      console.log('theres no file by that name');
      return this.sendMessage('file.send.error', {error: `no file with token ${token}`});
    }

    const sliceFile = offset => {
      if (stopTransfer) {
        return;
      }

      let reader = new FileReader();
      reader.onload = (() =>
        e => {
          let data = new Uint8Array(this.headerByteLength + e.target.result.byteLength);
          data.set(new Uint8Array(header), 0);
          data.set(new Uint8Array(e.target.result), this.headerByteLength);
          this.sendBinaryData(data.buffer);
          if (file.size > offset + e.target.result.byteLength) {
            let currentTime = (new Date()).getTime();
            info.startTime = info.startTime || currentTime;
            info.lastTime = info.lastTime || currentTime;
            let elapsedTime = (currentTime - info.startTime) / 1000;
            let deltaFromLastTime = (currentTime - info.lastTime) / 1000;
            let historicRate = elapsedTime > 0 ? (offset + this.fileChunk) / elapsedTime : 0;
            let deltaRate = deltaFromLastTime > 0 ? this.fileChunk / deltaFromLastTime : 0;
            let aggregatedRate = this.historicRateWeight * historicRate + (1 - this.historicRateWeight) * deltaRate;
            let rate = elapsedTime > 0 ? getFileSize(aggregatedRate) + '/s' : '0 B/s';
            info.lastTime = currentTime;

            let perc = ~~((offset + this.fileChunk) / file.size * 100);
            this.emitter.emit(`peer.file.transfer.progress-${token}`, perc, rate);
            setTimeout(sliceFile, transferDelay, offset + this.fileChunk - this.headerByteLength);
          }
          else {
            this.sendMessage('file.transfer.complete', {token: token});
            this.emitter.emit('peer.file.transfer.outgoing.complete', token);
            this.outgoingFilesCompleted.push(token);
            this.sendNextFile();
          }
        }
      )(file);
      let slice = file.slice(offset, offset + this.fileChunk - this.headerByteLength);
      reader.readAsArrayBuffer(slice);
    };
    sliceFile(startOffset);

    this.emitter.emit('peer.file.transfer.outgoing', { token, name, size, id: this.id });
  }

  interrogateTransfer(data) {
  }

  finaliseFileTransfer(data) {
    const { token } = data;
    if (!this.incomingFiles.hasOwnProperty(token)) {
      return;
    }

    const { filename, mimeType, binaryData } = this.incomingFiles[token];
    const file = new File(binaryData, filename, { type: mimeType, lastModified: (new Date()).getTime() });
    const a = document.createElement('a');
    a.download = filename;
    a.target = '_blank';
    a.href = URL.createObjectURL(file);
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(a.href);
    a.remove();
  }

  sendMessage = (event, payload) => {
    this.send({ event, payload });
  }

  sendBinaryData = (data) => {
    this.channel.send(data);
  }

  send = (data) => {
    data = typeof data === 'string' ? data : JSON.stringify(data);
    this.channel.send(data);
  }

  bufferFromString(str, bufferLength) {
    let strLen = str.length;

    let buf = new ArrayBuffer(bufferLength);
    let bufView = new Uint16Array(buf);
    for (let i = 0; i < strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }

    for (let pad = strLen; pad < bufferLength; pad++) {
      bufView[pad] = "\0".charCodeAt(0);
    }

    return bufView.buffer;
  }

}

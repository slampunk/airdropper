import FileTransferItem from './fileTransferItem.js';

export default class FileTransferList {
  constructor(props) {
    this.emitter = props.emitter;
    this.container = document.querySelector('.fileTransfers');
    this.items = {};

    this.attachEvents();
  }

  attachEvents() {
    this.emitter.on('peer.file.transfer.incoming', this.displayIncomingFile);
    this.emitter.on('peer.file.transfer.outgoing', this.displayOutgoingFile);
  }

  displayTransfer = (payload, transferType) => {
    const { token } = payload;

    if (!this.items.hasOwnProperty(payload.token)) {
      this.items[token] = {
        details: payload,
        element: new FileTransferItem({ ...payload, emitter: this.emitter, transferType: transferType })
      }

      this.container.appendChild(this.items[token].element.render());
    }

  }

  displayIncomingFile = payload => {
    this.displayTransfer(payload, 'incoming');
  }

  displayOutgoingFile = payload => {
    this.displayTransfer(payload, 'outgoing');
  }
}

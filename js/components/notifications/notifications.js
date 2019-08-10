import IncomingFileNotification from './incomingFileNotification.js';

export default class Notifications {
  constructor(props) {
    this.emitter = props.emitter;
    this.items = {};
    this.container = document.querySelector('.notifications');

    this.attachEvents();
  }

  attachEvents() {
    this.emitter.on('notification.file.transfer.request', this.notifyFileTransferRequest);
    this.emitter.on('notification.remove', this.removeNotification);
  }

  notifyFileTransferRequest = (details) => {
    let notificationToken = `file-notification-${details.id}`;
    let notificationId;
    let notificationIdIndex = 0;
    do {
      notificationIdIndex++;
      notificationId = `${notificationToken}-${notificationIdIndex}`;
    } while (this.items.hasOwnProperty(notificationId));

    this.items[notificationId] = {
      details: details,
      element: new IncomingFileNotification({ ...details, containerId: notificationId, emitter: this.emitter })
    }

    this.container.appendChild(this.items[notificationId].element.render());
  }

  removeNotification = notificationId => {
    if (this.items[notificationId]) {
      delete this.items[notificationId];
    }
  }
}

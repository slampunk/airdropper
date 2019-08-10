import NotificationItem from './notificationItem.js';
import { getFileSize, appendChildren } from  '../../lib/utils.js';

export default class IncomingFileNotification extends NotificationItem {
  constructor(props) {
    super(props);

    this.props = props;

    this.username = props.username;
    this.id = props.id;
    this.token = props.token;
    this.filename = props.name;
    this.size = props.size;
  }

  /* @Override */
  renderInnerContent() {
    const container = document.createElement('div');

    const title = document.createElement('p');
    const name = document.createElement('span');
    name.className = 'username';
    name.textContent = this.username;
    const text = document.createTextNode(' wants to send a file');
    title.appendChild(name);
    title.appendChild(text);

    const details = document.createElement('div');
    details.className = 'flex';

    const nameField = document.createElement('span');
    nameField.textContent = 'Name:';
    const nameValue = document.createElement('span');
    nameValue.textContent = this.filename;
    nameValue.setAttribute('title', this.filename);

    const sizeField = document.createElement('span');
    sizeField.textContent = 'Size';
    const sizeValue = document.createElement('span');
    sizeValue.textContent = getFileSize(this.size);

    appendChildren(details, [ nameField, nameValue, sizeField, sizeValue ]);

    const actions = document.createElement('div');
    actions.className = 'flex actions';

    const rejectButton = document.createElement('button');
    rejectButton.className = 'btn-error';
    rejectButton.textContent = 'Reject';
    const acceptButton = document.createElement('button');
    acceptButton.className = 'btn-success';
    acceptButton.textContent = 'Accept';
    const alwaysAcceptButton = document.createElement('button');
    alwaysAcceptButton.className = 'btn-success btn-secondary';
    alwaysAcceptButton.textContent = 'Always accept';

    rejectButton.addEventListener('click', this.reject, false);
    acceptButton.addEventListener('click', this.accept, false);
    alwaysAcceptButton.addEventListener('click', this.alwaysAccept, false);

    appendChildren(actions, [ rejectButton, acceptButton, alwaysAcceptButton ]);

    container.appendChild(title);
    container.appendChild(details);
    container.appendChild(actions);

    return container;
  }

  reject = () => {
    this.completeNotification();
  }

  accept = () => {
    this.emitter.emit(`peer.${this.id}.filetransfer.accept`, this.props);
    this.completeNotification();
  }

  alwaysAccept = () => {
    this.emitter.emit(`peer.${this.id}.filetransfer.accept`, { ...this.props, alwaysAccept: true });
    this.completeNotification();
  }
}

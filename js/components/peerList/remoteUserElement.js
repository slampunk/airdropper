export default class RemoteUserElement {
  constructor(props) {
    this.emitter = props.emitter;
    this.user = props.user;
    this.element = null;

    this.generateElement();
  }

  generateElement() {
    this.element = document.createElement('li');

    let input = document.createElement('input');
    input.type = 'radio';
    input.name = 'userSelect';
    input.id = `user-selector-${this.user.user_id}`;
    input.classList.add('hidden');

    let container = document.createElement('div');
    container.classList.add('user');

    let label = document.createElement('label');
    label.classList.add('user__name');
    label.setAttribute('for', input.id);
    label.textContent = this.user.username;

    let optionsList = document.createElement('ul');
    optionsList.classList.add('user__options');

    let fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.classList.add('hidden');
    fileInput.multiple = true;
    fileInput.id = `file-${this.user.user_id}`;

    let infoItem = document.createElement('li');
    let infoButton = document.createElement('button');
    infoButton.textContent = 'User Info';

    let toggleFileItem = document.createElement('li');
    let fileLabel = document.createElement('label');
    fileLabel.setAttribute('for', fileInput.id);
    fileLabel.textContent = 'Send file';

    let connectItem = document.createElement('li');
    let connectButton = document.createElement('button');
    connectButton.textContent = 'Connect';

    connectItem.appendChild(connectButton);

    toggleFileItem.appendChild(fileLabel);
    infoItem.appendChild(infoButton);

    optionsList.appendChild(fileInput);
    optionsList.appendChild(infoItem);
    optionsList.appendChild(connectItem);
    optionsList.appendChild(toggleFileItem);

    container.appendChild(label);
    container.appendChild(optionsList);

    this.element.appendChild(input);
    this.element.appendChild(container);
  }

  render() {
    return this.element;
  }
}

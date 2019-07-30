import Modal from '../shared/modal.js';

export default class SetUserNameModal extends Modal {
  constructor(props) {
    super(props);
    this.emitter = props.emitter;
    this.appendModalForm();
  }

  appendModalForm() {
    let heading = 'Username?';

    let form = document.createElement('form');
    form.onsubmit = e => this.handleFormSubmit(e);

    let formText = document.createElement('p');
    formText.textContent = 'Looks like this is your first time here. Please enter a username below so that others may recognise you.';
    formText.style.margin = '0';

    let userInput = document.createElement('input');
    userInput.name = 'username';

    let button = document.createElement('button');
    button.textContent = 'Submit';

    form.appendChild(formText);
    form.appendChild(userInput);
    form.appendChild(button);

    this.applyModalOptions({
      heading: heading,
      children: [ form ],
      styles: {
        width: '480px',
        height: '244px'
      }
    });
  }

  handleFormSubmit = event => {
    event.preventDefault();
    let username = event.currentTarget.querySelector('input').value;
    this.emitter.emit('user.update.name', username);
  }
}

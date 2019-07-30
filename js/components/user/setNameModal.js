import Modal from '../shared/modal.js';

export default class SetUserNameModal extends Modal {
  constructor(props) {
    super(props);

    this.appendModalForm();
  }

  appendModalForm() {
    let heading = 'Username?';

    let form = document.createElement('form');
    form.onsubmit = e => this.handleFormSubmit(e);

    let formText = document.createElement('p');
    console.log(formText);
    formText.textContent = 'Looks like this is your first time here. Please enter a username below so that others may recognise you.';

    let userInput = document.createElement('input');
    userInput.name = 'username';

    let button = document.createElement('button');
    button.textContent = 'Submit';

    form.appendChild(formText);
    form.appendChild(userInput);
    form.appendChild(button);

    this.applyModalOptions({
      heading: heading,
      children: [ form ]
    });
  }

  handleFormSubmit(event) {
  }
}

export default class Modal {
  constructor(opts) {
    this.modalContainer = null;
    this.modal = null;
    this.modalHeading = null;
    this.modalBody = null;

    this.generateModalElements();
    opts && this.applyModalOptions(opts);
  }

  generateModalElements() {
    this.modalContainer = document.createElement('div');
    this.modalContainer.classList.add('modalContainer');

    this.modal = document.createElement('div');
    this.modal.classList.add('modal');

    this.modalHeading = document.createElement('h2');

    this.modalBody = document.createElement('div');
    this.modalBody.classList.add('modalBody');

    this.modal.appendChild(this.modalHeading);
    this.modal.appendChild(this.modalBody);
    this.modalContainer.appendChild(this.modal);
  }

  applyModalOptions({styles = {}, heading = 'Modal heading', children = []}) {
    Object.keys(styles)
      .forEach(style => {
        this.modal.style[style] = styles[style];
      });

    this.modalHeading.textContent = heading;

    children.forEach(child => this.modalBody.appendChild(child));
  }

  render() {
    document.body.insertBefore(this.modalContainer, document.querySelector('main'));
  }

  remove() {
    this.modalContainer.remove();
  }
}

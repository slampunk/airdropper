import SetUserNameModal from './setUserNameModal.js';

export default class User {
  constructor(opts) {
    this.emitter = opts.emitter;

    this._id = '';
    this._name = '';

    this._userNameModal = null;

    this.loadState();

    this.element = document.querySelector('.user.local');

    this.attachEvents();
  }

  get id() {
    return this._id;
  }

  get name() {
    return this._name;
  }

  get state() {
    return {
      id: this._id,
      name: this._name
    }
  }

  loadState() {
    if (!localStorage.getItem('user')) {
      this.promptForUsername();
    }

    try {
      const state = JSON.parse(localStorage.getItem('user'));
      state.name ? this.handleNameUpdate(state.name) : this.promptForUsername();
    } catch(e) {
      this.emitter.emit('user.corrupted');
    }
  }

  promptForUsername() {
    this._userNameModal = new SetUserNameModal({ emitter: this.emitter });
    this._userNameModal.render();
  }

  setState({
    name = this.name,
    id = this._id
  }) {
    this._name = name;
    this._id = id;

    localStorage.setItem('user',
      JSON.stringify({ name: this._name, id: this._id }));


  }

  completeLoad = () => {
    this.element.classList.remove('loading');
  }

  attachEvents() {
    this.emitter.on('ws.open', this.completeLoad);
    this.emitter.on('user.update.name', { fn: this.handleNameUpdate, scope: this });
  }

  handleNameUpdate(username) {
    this.setState({ name: username });
    this.emitter.emit('ws.send', {
      action: 'name',
      payload: username
    });

    this._userNameModal && this._userNameModal.remove();
  }
}

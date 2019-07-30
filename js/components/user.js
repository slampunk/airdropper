export default class User {
  constructor(opts) {
    this.emitter = opts.emitter;

    this._id = '';
    this._name = '';
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
      return this.emitter.emit('user.empty');
    }

    try {
      const state = JSON.parse(localStorage.getItem('user'));
      this.setState(state);
    } catch(e) {
      this.emitter.emit('user.corrupted');
    }
  }

  setState({
    name = this.name,
    id = this._id
  }) {
    this._name = name;
    this._id = id;

    this.emitter.emit('user.state.update', this.state);
  }

  completeLoad = () => {
    this.element.classList.remove('loading');
  }

  attachEvents() {
    this.emitter.on('ws.open', this.completeLoad);
  }
}

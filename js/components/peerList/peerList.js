import RemoteUserElement from './remoteUserElement.js';

export default class PeerList {
  constructor(props) {
    this.emitter = props.emitter;

    this.attachEvents();
  }

  generateRemoteUserElement(user) {
    return new RemoteUserElement({
      emitter: this.emitter,
      user: user
    });
  }

  listUsers(userList) {
    userList
      .map(this.generateRemoteUserElement.bind(this))
      .forEach(el => document.querySelector('.userList').appendChild(el.render()));
  }

  attachEvents() {
    this.emitter.on('user.list', { fn: this.listUsers, scope: this });
    document.querySelector('main').addEventListener('click', e => this.removeExpandedUser(e), false);
  }

  removeExpandedUser = e => {
    if (e.path[0].tagName.toLowerCase() === 'main') {
      [...document.querySelectorAll('input[name=userSelect]')]
        .filter(input => input.checked)
        .forEach(input => { input.checked = false });
    }
  }
}

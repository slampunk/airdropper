import RemoteUserElement from './remoteUserElement.js';

export default class PeerList {
  constructor(props) {
    this.emitter = props.emitter;

    this.users = [];

    this.attachEvents();
  }

  generateRemoteUserElement = (user) => {
    return new RemoteUserElement({
      emitter: this.emitter,
      user: user
    });
  }

  listUser = user => {
    return this.listUsers([user]);
  }

  listUsers = (userList) => {
    userList
      .filter(user => this.users.indexOf(user.user_id) === -1)
      .map(this.generateRemoteUserElement)
      .forEach(el => {
        this.users.push(el.id);
        document.querySelector('.userList').appendChild(el.render());
      });
  }

  removeUser = ({ user_id }) => {
//    this.emitter.request(`has.peer.dropped.${user_id}`)
//      .then(
    this.users = this.users.filter(id => id !== user_id);
    document.querySelector(`.userList li[data-peer="${user_id}"]`).remove();
  }

  attachEvents() {
    this.emitter.on('user.list', { fn: this.listUsers, scope: this });
    this.emitter.on('user.update', { fn: this.listUser, scope: this });
    this.emitter.on('user.remove', { fn: this.removeUser, scope: this });
    this.emitter.on('peer.connection.established', this.removeExpandedUser);
    document.querySelector('main').addEventListener('click', e => this.removeExpandedUser(e), false);
  }

  removeExpandedUser = e => {
    if (e.path && e.path[0].tagName.toLowerCase() === 'main') {
      [...document.querySelectorAll('input[name=userSelect]')]
        .filter(input => input.checked)
        .forEach(input => { input.checked = false });
    }
    else if (typeof e === 'string') {
      [...document.querySelectorAll(`input[id="user-selector-${e}"`)]
        .forEach(input => { input.checked = false });
    }
  }
}

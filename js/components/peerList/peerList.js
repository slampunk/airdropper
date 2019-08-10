import RemoteUserElement from './remoteUserElement.js';

export default class PeerList {
  constructor(props) {
    this.emitter = props.emitter;

    this.users = [];
    this.userSubscriptionTokens = {};

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
        this.users.push({ id: el.id, username: el.username });
        this.userSubscriptionTokens[el.id] =
          this.emitter.on(`peer.${el.id}.file.transfer.request`, payload => {
            this.emitter.emit('notification.file.transfer.request', { ...payload, id: el.id, username: el.username })
          });
        document.querySelector('.userList').appendChild(el.render());
      });
  }

  removeUser = ({ user_id }) => {
//    this.emitter.request(`has.peer.dropped.${user_id}`)
//      .then(
    this.users = this.users.filter(user => user.id !== user_id);
    [...document.querySelectorAll(`.userList li[data-peer="${user_id}"]`)].forEach(el => el.remove());
    if (this.userSubscriptionTokens[user_id]) {
      this.emitter.off(`peer.${user_id}.file.transfer.request`, this.userSubscriptionTokens[user_id]);
      delete this.userSubscriptionTokens[user_id];
    }
  }

  attachEvents() {
    this.emitter.on('user.list', this.listUsers);
    this.emitter.on('user.update', this.listUser);
    this.emitter.on('user.remove', this.removeUser);
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

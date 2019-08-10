export default class NotificationItem {
  constructor(props) {
    this.emitter = props.emitter;
    this.containerId = props.containerId || null;
    this.container = null;
  }

  renderInnerContent() {
    return document.createTextNode('');
  }

  completeNotification() {
    this.container.style.height = `${this.container.clientHeight}px`;
    setTimeout(() => {
      this.container.classList.add('complete');
    }, 0);
    setTimeout(() => {
      this.container.remove();
      this.emitter.emit('notification.remove', this.containerId);
    }, 600);
  }

  render() {
    this.container= document.createElement('li');
    if (this.containerId) {
      this.container.id = this.containerId;
    }

    this.container.appendChild(this.renderInnerContent());
    return this.container;
  }
}

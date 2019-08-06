const xmlns = "http://www.w3.org/2000/svg";

export default class RemoteUserElement {
  constructor(props) {
    this.emitter = props.emitter;
    this.user = props.user;
    this.id = props.user.user_id;
    this.username = props.user.username;

    this.element = null;

    this.generateElement();
    this.attachEvents();
  }

  generateElement() {
    this.element = document.createElement('li');
    this.element.setAttribute('data-peer', this.id);

    /* Create necessary elements - start */
    let input = document.createElement('input');
    input.type = 'radio';
    input.name = 'userSelect';
    input.id = `user-selector-${this.id}`;
    input.classList.add('hidden');

    let container = document.createElement('div');
    container.classList.add('user');

    let label = document.createElement('label');
    label.classList.add('user__name');
    label.setAttribute('for', input.id);
    label.textContent = this.username;

    let optionsList = document.createElement('ul');
    optionsList.classList.add('user__options');

    let fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.classList.add('hidden');
    fileInput.multiple = true;
    fileInput.id = `file-${this.id}`;

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
    /* Create necessary elements - end */

    /* Add event listeners to created elements - start */
    connectButton.addEventListener('click', this.initiateConnection, false);
    /* Add event listeners to created elements - end */
  }

  get transformCSS() {
    // Hold on while I rummage around for that Anton-Rorres LA book...
    //
    // window.getComputedStyle for transform returns `matrix(a b c d tx ty)`
    // for our transformations in R^2.
    // We end up with a matrix
    // | a c | = | cos(theta)  sin(theta) |
    // | b d |   | -sin(theta) cos(theta) |
    //
    // Our elements do not undergo scaling in either axis, so we may safely
    // assume that sin(theta) = the angle we're looking for (using Math.asin)
    //
    // Finally, `tx` and `ty` are translations in pixels in `x` and `y` axes
    // respectively; only `y` is translated, so forget about `x`.
    const [ radians, ty ] =
      window.getComputedStyle(this.element, null).getPropertyValue('transform')
        .split(/[\(\),]/)
        .filter((e, i) => i && i % 3 === 0)
        .map(e => +e);

    return {
      angle: Math.round(Math.asin(radians) * 180 / Math.PI),
      translateY: Math.abs(ty),
      elementWidth: this.element.clientWidth
    }
  }

  appendConnectingSvg = () => {
    if (this.element.querySelector('.connecting')) {
      return;
    }

    const transformation = this.transformCSS;
    const width = transformation.translateY - transformation.elementWidth - 10;
    const svg = document.createElementNS(xmlns, 'svg');
    svg.setAttribute('width', width);
    svg.setAttribute('height', 8);
    svg.classList.add('connecting');
    const line = document.createElementNS(xmlns, 'line');
    line.setAttribute('x1', 0);
    line.setAttribute('y1', 4);
    line.setAttribute('x2', width);
    line.setAttribute('y2', 4);
    line.setAttribute('stroke-dasharray', 20);
    line.setAttribute('stroke', 'white');
    svg.appendChild(line);
    this.element.appendChild(svg);
  }

  removeConnectingSvg = () => {
   // setTimeout(() => {
      [...this.element.querySelectorAll('.connecting')].forEach(el => el.remove());
   // }, 500);
  }

  appendConnectedSvg = () => {
    if (this.element.querySelector('.connected')) {
      return;
    }

    this.removeConnectingSvg();
    const transformation = this.transformCSS;
    const width = transformation.translateY - transformation.elementWidth - 15;
    const svg = document.createElementNS(xmlns, 'svg');
    svg.setAttribute('width', width);
    svg.setAttribute('height', 16);
    svg.classList.add('connected');
    const line = document.createElementNS(xmlns, 'line');
    line.setAttribute('x1', 0);
    line.setAttribute('y1', 4);
    line.setAttribute('x2', width);
    line.setAttribute('y2', 4);
    line.setAttribute('stroke', '#2e8b57');
    line.setAttribute('stroke-width', '4px');
    line.setAttribute('stroke-dasharray', width);
//    line.setAttribute('stroke-dashoffset', width);
    svg.appendChild(line);
    this.element.appendChild(svg);
    line.setAttribute('stroke-dashoffset', 0);
  }

  initiateConnection = (e) => {
    this.emitter.emit('peer.connection.initiate', this.id);
  }

  attachEvents = () => {
    this.emitter.on('peer.connection.initiate', id => {
      if (id === this.id) {
        this.appendConnectingSvg();
      }
    });
    this.emitter.on('peerconnection', ({ target }) => {
      if (target === this.id) {
        this.appendConnectingSvg();
      }
    });
    this.emitter.on('peer.connection.established', id => {
      if (id === this.id) {
        this.appendConnectedSvg();
      }
    });
  }

  render() {
    return this.element;
  }
}

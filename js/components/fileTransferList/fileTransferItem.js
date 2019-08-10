import { getSVGElement, appendChildren } from '../../lib/utils.js';

const xmlns = "http://www.w3.org/2000/svg";

const getDownArrow = (maxWidth) => {
  const leftX = (maxWidth / 2) - 3;
  const rightX = (maxWidth / 2) + 3;
  const leftTipX = (maxWidth / 2) - 7;
  const rightTipX = (maxWidth / 2) + 7;
  const topY = 14;
  const bottomY = maxWidth - topY;
  const tipStartY = maxWidth / 2;
  const middleX = maxWidth / 2;

  return `M ${leftX} ${topY} L ${leftX} ${tipStartY}
          L ${leftTipX} ${tipStartY}
          L ${middleX} ${bottomY}
          L ${rightTipX} ${tipStartY}
          L ${rightX} ${tipStartY} L ${rightX} ${topY} L ${leftX} ${topY}`;
}

export default class FileTransferItem {
  constructor(props) {
    this.emitter = props.emitter;
    this.token = props.token;
    this.id = props.id;
    this.filename = props.name;
    this.size = props.size;
    this.containerId = props.containerId || `file-transfer-${this.id}`;
    this.circumference = 0;
    this.progressCircle = null;
    this.rateSpan = null;
    this.direction = props.transferType;

    this.element = null;
    this.attachEvents();
  }

  attachEvents() {
    this.emitter.on(`peer.file.transfer.progress-${this.token}`, this.progressTick);
  }

  progressTick = (perc, rate) => {
    if (!this.progressCircle) {
      return;
    }

    const newDashOffset = Math.min(0, -(100 - perc) / 100 * this.circumference);
    this.progressCircle.setAttribute('stroke-dashoffset', newDashOffset);
    this.progressCircle.setAttribute('stroke', this.getProgressColor(perc));
    this.rateSpan.textContent = rate;
  }

  getProgressColor = (perc) => {
    // from red to green, with a bit of dulling the yellow in the middle due to white background
    return 'rgb(' + [
      perc > 33 ? 255 - (perc - 34) * 255 / 66 : 255,
      perc < 67 ? perc * 255 / 66 : 255,
      0
    ].join(', ') + ')';
  }

  innerContent() {
    const HEIGHT = 48;
    const progressRadius = HEIGHT / 2 - 6;
    this.circumference = 2 * Math.PI * progressRadius;
    const progressSvg = document.createElementNS(xmlns, 'svg');
    progressSvg.setAttribute('width', HEIGHT);
    progressSvg.setAttribute('height', HEIGHT);

    const bgCircle1 = getSVGElement('circle', { cx: '50%', cy: '50%', fill: 'none', r: HEIGHT / 2 - 6, stroke: '#ccc', 'stroke-width': 6});
    const bgCircle2 = getSVGElement('circle', { cx: '50%', cy: '50%', fill: 'none', r: HEIGHT / 2 - 6, stroke: '#eee', 'stroke-width': 4});
    this.progressCircle = getSVGElement('circle', { cx: '50%', cy: '50%', fill: 'none', r: HEIGHT / 2 - 6, stroke: '#ff2015',
      'stroke-width': 6, 'stroke-dasharray': this.circumference, 'stroke-dashoffset': -this.circumference});
    this.progressCircle.classList.add('progressCircle');
    const directionElement = getSVGElement('path', { 'stroke-width': 1, d: getDownArrow(HEIGHT) });
    directionElement.classList.add(this.direction);

    appendChildren(progressSvg, [bgCircle1, bgCircle2, this.progressCircle, directionElement]);

    const fileSpan = document.createElement('span');
    fileSpan.textContent = this.filename;

    this.rateSpan = document.createElement('span');
    this.rateSpan.textContent = '';

    return [ progressSvg, fileSpan, this.rateSpan ];
  }

  render() {
    this.element = document.createElement('li');
    this.element.id = this.containerId;
    appendChildren(this.element, this.innerContent());

    return this.element;
  }
}

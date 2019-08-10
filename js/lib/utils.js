const xmlns = "http://www.w3.org/2000/svg";

export const getFileSize = (size) => {
  if (typeof size != 'number') {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const selectedUnit = Math.min(Math.log(size)/Math.log(1024) >> 0, 4);
  const unitSize = (size / (1024 ** selectedUnit)).toFixed(2);
  return `${unitSize} ${units[selectedUnit]}`;
}

export const appendChildren = (parent, childArr) => {
  childArr.forEach(child => parent.appendChild(child));
  return parent;
}

export const getSVGCircle = details => {
  const circle = document.createElementNS(xmlns, 'circle');
  Object.keys(details)
    .forEach(attribute => circle.setAttribute(attribute, details[attribute]));

  return circle;
}

export const getSVGElement = (elementType, attributes) => {
  const element = document.createElementNS(xmlns, elementType);
  Object.keys(attributes)
    .forEach(attribute => element.setAttribute(attribute, attributes[attribute]));

  return element;
}

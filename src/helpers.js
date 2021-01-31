function makePercentage(n) {
  return (n / 100).toFixed(4);
}

function intervalSeconds(s) {
  return s * 1000;
}

function sliceObject(obj, keys) {
  return keys.reduce((acc, key) => ({ ...acc, [key]: obj[key] }), {});
}

function getChangePercentage(initial, current) {
  if (!initial || !current) return 0;
  return parseFloat((initial - current) / initial).toFixed(4);
}

function hasIncreasedFor(current, initial, percent) {
  const change = getChangePercentage(current, initial);
  return change > 0 && change >= percent;
}

function hasDecreasedFor(current, initial, percent) {
  const change = getChangePercentage(initial, current);
  return change > 0 && change >= percent;
}

module.exports = {
  makePercentage,
  intervalSeconds,
  sliceObject,
  getChangePercentage,
  hasIncreasedFor,
  hasDecreasedFor
};
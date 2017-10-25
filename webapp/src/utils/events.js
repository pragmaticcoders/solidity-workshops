const occured = {};

module.exports.deduplicate = function (event) {
  const eventID = event.name + '_' + event.transactionHash + '_' + event.logIndex;
  if (occured[eventID]) {
    return true;
  }
  occured[eventID] = true;
  return false;
}

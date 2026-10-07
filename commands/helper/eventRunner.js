function runEvent(event, ...args) {
  return Promise.resolve().then(() => event.execute(...args)).catch(error => {
    console.error(`[Event ${event.name}]`, error);
  });
}
module.exports = { runEvent };

// Loads the standings engine for testing.
// Today the engine is the `Component` class inside index.html's inline script.
// When the engine is rebuilt as a module, change ONLY this file; the tests in
// engine-rules.test.js describe the league rules and must keep passing.
const fs = require('fs'), path = require('path');
class DCLogic { constructor() { this.props = {}; } setState() {} }
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const start = html.indexOf('class Component extends DCLogic');
const end = html.indexOf('</script>', start);
if (start < 0 || end < 0) throw new Error('engine class not found in index.html');
const Component = new Function('DCLogic', html.slice(start, end) + '\nreturn Component;')(DCLogic);
module.exports = { Component };

const fs = require('fs');
const path = require('path');

function loadFlows(flowsDir) {
  const flows = {};
  if (!fs.existsSync(flowsDir)) return flows;
  const files = fs.readdirSync(flowsDir).filter(f => f.endsWith('.json'));
  for (const f of files) {
    try {
      const full = path.join(flowsDir, f);
      const j = JSON.parse(fs.readFileSync(full, 'utf8'));
      const name = j.flow_name || path.basename(f, '.json');
      flows[name] = Object.assign({ _file: f, _path: full }, j);
    } catch (err) {
      console.error('Failed to load flow', f, err.message);
    }
  }
  return flows;
}

module.exports = { loadFlows };

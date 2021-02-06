const db = require('../storage');

const AuditLog = db.defaults({
  audit_logs: []
}).get('audit_logs');

module.exports = AuditLog;
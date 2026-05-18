export const templates = {
  app: {
    name: 'Full-stack app builder',
    prompt: 'Build or modify a production-ready app. Return a compact execution bundle with files, commands, tests, and rollback notes.'
  },
  mac: {
    name: 'macOS app operator',
    prompt: 'Operate a macOS app through safe high-level steps. Prefer keyboard shortcuts and ask for approval before destructive actions.'
  },
  code: {
    name: 'Codebase agent',
    prompt: 'Inspect the project, create a concise plan, make targeted edits, run tests, and summarize exact changed files.'
  },
  business: {
    name: 'Business workflow',
    prompt: 'Bundle research, drafting, and operational steps into one command sequence with measurable outcomes.'
  }
};

export function listTemplates() {
  return Object.entries(templates).map(([id, item]) => ({ id, ...item }));
}

export function getTemplate(id = 'code') {
  return templates[id] || templates.code;
}

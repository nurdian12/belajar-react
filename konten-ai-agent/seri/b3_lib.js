exports.c = (h, items, note) => ({ t: 'cards', h, items, note });
exports.p = (h, items, prompt) => ({ t: 'prompt', h, items, prompt });
exports.pp = (h, prompts) => ({ t: 'prompts2', h, prompts });
exports.t = (h, cols, rows, foot) => ({ t: 'table', h, cols, rows, foot });
exports.m = (kind, title, sub, s, ci) => ({ kind, title, sub, s, close: { h: 'Ringkasnya:', items: ci } });

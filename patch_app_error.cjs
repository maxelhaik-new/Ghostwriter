const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

app = app.replace(
  '<div className="mb-6 p-4 rounded-xl bg-white shadow-sm border-l-4 border-rose-500 flex items-center justify-between gap-3 text-xs text-rose-800 animate-fadeIn">',
  '<div className="mb-8 p-4 border border-rose-900/20 bg-rose-900/5 flex items-center justify-between gap-3 font-mono text-xs text-rose-900 animate-fadeIn">'
);

app = app.replace(
  '<button onClick={() => setErrorMessage(null)} className="text-slate-500 hover:text-slate-800 font-medium">',
  '<button onClick={() => setErrorMessage(null)} className="uppercase tracking-wider hover:opacity-70 underline">'
);

app = app.replace(
  '<AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />',
  '<strong className="tracking-wider">[ERROR]</strong>'
);

fs.writeFileSync('src/App.tsx', app);

const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

// Change the outer container and grid
app = app.replace(
  '<div className="min-h-screen py-6 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto flex flex-col justify-start">',
  '<div className="min-h-screen w-full max-w-[1500px] mx-auto p-6 md:p-12 lg:p-16 flex flex-col">'
);

app = app.replace(
  '<main className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">',
  '<main className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-12 lg:gap-16 items-start flex-1">'
);

app = app.replace(
  '<div className="lg:col-span-5 flex flex-col gap-6">',
  '<div className="flex flex-col gap-8">'
);

app = app.replace(
  '<div className="lg:col-span-7 flex flex-col gap-6">',
  '<div className="flex flex-col h-full">'
);

fs.writeFileSync('src/App.tsx', app);

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/admin/agenda-semanal/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Block 1: Non-futebol
content = content.replace(
  /<div key=\{modalidade\} className="break-inside-avoid">[\s\S]*?<table className="w-full min-w-max border-collapse text-xs">/g,
  `<div key={modalidade} className="break-inside-avoid bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:border-none print:shadow-none print:rounded-none">
                  <div className="bg-[#004B87] border-b-[3px] border-[#FFD100] px-4 py-3 print:bg-transparent print:border-b-2 print:border-slate-800 print:text-black">
                    <h2 className="text-lg font-black text-white uppercase tracking-widest print:text-slate-800">
                      {modalidade}
                    </h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-max border-collapse text-xs">`
);

// Block 2: Futebol
content = content.replace(
  /<div key=\{modalidade\} className="mt-32 pt-16 border-t-\[16px\] border-slate-200 break-inside-avoid print:break-before-page print:mt-0 print:pt-0 print:border-none">[\s\S]*?<table className="w-full min-w-max border-collapse text-xs">/g,
  `<div key={modalidade} className="mt-12 break-inside-avoid bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:break-before-page print:mt-0 print:border-none print:shadow-none print:rounded-none">
                  <div className="bg-[#009A44] border-b-[3px] border-[#FFD100] px-4 py-3 print:bg-transparent print:border-b-2 print:border-slate-800 print:text-black">
                    <h2 className="text-lg font-black text-white uppercase tracking-widest print:text-slate-800">
                      {modalidade}
                    </h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-max border-collapse text-xs">`
);

// Replace closing tags for the new `div.overflow-x-auto` we added inside the table wrappers
content = content.replace(/<\/table>\n              <\/div>\n            \}\)\}/g, 
`</table>
                  </div>
                </div>
            ))}`);

// Fix table header styles for both
content = content.replace(/border border-slate-300/g, "border border-slate-200");
content = content.replace(/bg-slate-100 p-2 text-center font-bold text-slate-800 uppercase w-20/g, "bg-slate-50 p-3 text-center font-bold text-slate-500 uppercase w-20");
content = content.replace(/bg-slate-200 p-2 text-center font-bold text-slate-800 uppercase/g, "bg-slate-100 p-3 text-center font-bold text-slate-700 uppercase");
content = content.replace(/bg-white p-2 text-center font-bold text-slate-700 uppercase/g, "bg-white p-2.5 text-center font-bold text-slate-600 uppercase text-[11px]");
content = content.replace(/bg-slate-50 font-bold p-2 text-center whitespace-nowrap text-slate-800/g, "bg-slate-50 font-bold p-3 text-center whitespace-nowrap text-slate-700");

fs.writeFileSync(filePath, content, 'utf8');
console.log('Tables updated successfully');

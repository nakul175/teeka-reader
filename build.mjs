import {readFileSync,writeFileSync,mkdirSync,cpSync} from 'node:fs';
const c=JSON.parse(readFileSync('config.json','utf8'));mkdirSync('dist/server',{recursive:true});
const replace=s=>s.replaceAll('__NAME__',c.name).replaceAll('__DESCRIPTION__',c.description).replaceAll('__ORG__',c.organisation).replaceAll('__TOPIC__',c.topic).replaceAll('__COLOR__',c.color).replaceAll('__COLOR_URI__',encodeURIComponent(c.color)).replaceAll('__SOURCE__',c.source).replaceAll('__GUIDANCE__',c.guidance).replaceAll('__CONFIG__',JSON.stringify(c));
const assets={config:c,html:replace(readFileSync('client/index.html','utf8')),client:replace(readFileSync('client/app.js','utf8')),css:replace(readFileSync('client/style.css','utf8'))};
writeFileSync('dist/server/assets.mjs',Object.entries(assets).map(([k,v])=>'export const '+k+'='+JSON.stringify(v)+';').join('\n'));
cpSync('worker.mjs','dist/server/index.js');cpSync('rules.mjs','dist/server/rules.mjs');
writeFileSync('dist/server/wrangler.json',JSON.stringify({name:c.id,main:'index.js',compatibility_date:'2026-10-03',compatibility_flags:['nodejs_compat','global_fetch_strictly_public'],d1_databases:[{binding:'DB',database_name:c.id,database_id:'local-demo'}]},null,2));

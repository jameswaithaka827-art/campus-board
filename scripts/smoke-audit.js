const fs=require('fs');const path=require('path');const root=path.resolve(__dirname,'..');
const required=['app/page.tsx','app/demo/page.tsx','app/login/page.tsx','app/signup/page.tsx','app/dashboard/page.tsx','app/admin/page.tsx','app/dashboard/teaching/page.tsx','app/dashboard/learn/page.tsx','app/dashboard/community/page.tsx','app/dashboard/community/client.tsx','app/dashboard/marketplace/page.tsx','app/account/delete/page.tsx','app/account/security/page.tsx','app/account/reset-password/page.tsx','middleware.ts','prisma/schema.prisma'];
let bad=0;for(const f of required){const ok=fs.existsSync(path.join(root,f));console.log(`${ok?'PASS':'FAIL'}  ${f}`);if(!ok)bad++;}
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));const scripts=pkg.scripts||{};
for(const k of ['dev','build','db:push','test:security','test:smoke']){const ok=!!scripts[k];console.log(`${ok?'PASS':'FAIL'}  npm script: ${k}`);if(!ok)bad++;}
if(bad){console.error(`\n${bad} smoke checks failed.`);process.exit(1)}
console.log('\nSmoke audit passed.');

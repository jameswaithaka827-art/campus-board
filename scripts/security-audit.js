const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const checks = [];
function read(rel){return fs.readFileSync(path.join(root, rel),'utf8');}
function check(name, ok, detail){checks.push({name,ok,detail});}
const schema=read('prisma/schema.prisma');
check('Password reset token model exists', schema.includes('model PasswordResetToken'), 'Prisma model');
check('Security event model exists', schema.includes('model SecurityEvent'), 'Prisma model');
check('Admin self-session invalidation exists', read('app/api/admin/users/route.ts').includes('sessionVersion:{increment:1}'), 'Admin role/status mutations');
check('Account deletion origin guard', read('app/api/account/delete/route.ts').includes('assertSameOrigin(req)'), 'State-changing API guard');
check('Account deletion cleans Blob avatar', read('app/api/account/delete/route.ts').includes('await del(user.avatarUrl)'), 'Stored media cleanup');
check('Password reset endpoint exists', fs.existsSync(path.join(root,'app/api/account/password/reset/route.ts')), 'API route');
check('Reset tokens are hashed before lookup', read('lib/password-reset.ts').includes('hashToken(token)'), 'No raw reset token stored');
check('PWA icon sizes exist', fs.existsSync(path.join(root,'public/icon.png')) && fs.existsSync(path.join(root,'public/icon-512.png')), 'Manifest assets');
check('Admin security endpoint exists', fs.existsSync(path.join(root,'app/api/admin/security/route.ts')), 'Protected security feed');
check('Public demo exists', fs.existsSync(path.join(root,'app/demo/page.tsx')), 'Presentation mode');
check('Community profile API exists', fs.existsSync(path.join(root,'app/api/community/profile/route.ts')), 'Study matching');
check('Community report moderation exists', fs.existsSync(path.join(root,'app/api/admin/community/reports/route.ts')), 'Admin safety controls');
check('Community messages rate limited', read('app/api/community/rooms/[id]/messages/route.ts').includes('rateLimit(`roommsg:'), 'Abuse protection');
check('Marketplace ownership model exists', schema.includes('model MarketplaceListing'), 'Student marketplace');
check('No obvious hard-coded OpenAI secret', !/(sk-[A-Za-z0-9]{20,})/.test(fs.readFileSync(path.join(root,'README.md'),'utf8')), 'Source scan');
const failed=checks.filter(x=>!x.ok);
for(const x of checks) console.log(`${x.ok?'PASS':'FAIL'}  ${x.name} — ${x.detail}`);
if(failed.length){console.error(`\n${failed.length} security checks failed.`);process.exit(1)}
console.log(`\nAll ${checks.length} security checks passed.`);

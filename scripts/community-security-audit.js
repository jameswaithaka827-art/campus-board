const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const checks = [
  ['prisma/schema.prisma', 'CommunityPost'],
  ['prisma/schema.prisma', 'SchoolIdVerification'],
  ['app/api/community/verification/route.ts', "access:'private'"],
  ['app/api/admin/verifications/route.ts', 'school_verification'],
  ['app/api/admin/verifications/[id]/document/route.ts', 'requireAdmin'],
  ['app/api/community/posts/route.ts', 'requireSchoolVerifiedUser'],
  ['app/api/community/posts/images/route.ts', 'MAX_FILES=5'],
  ['app/api/community/posts/[id]/like/route.ts', 'requireSchoolVerifiedUser'],
  ['app/api/community/posts/[id]/comments/route.ts', 'requireSchoolVerifiedUser'],
  ['app/api/community/posts/[id]/share/route.ts', 'requireSchoolVerifiedUser'],
  ['app/api/community/posts/[id]/view/route.ts', 'communityPostView.upsert'],
  ['app/dashboard/community/feed/feed-client.tsx', 'green verified tick'],
  ['app/dashboard/community/verification/verification-client.tsx', 'school ID'],
  ['app/admin/admin-panel.tsx', 'School ID verification queue'],
  ['app/api/community/rooms/route.ts', 'mine']
];
let failed = 0;
for (const [file, needle] of checks) {
  const p = path.join(root, file);
  const ok = fs.existsSync(p) && fs.readFileSync(p, 'utf8').includes(needle);
  console.log(`${ok ? 'PASS' : 'FAIL'} ${file} :: ${needle}`);
  if (!ok) failed++;
}
process.exitCode = failed ? 1 : 0;

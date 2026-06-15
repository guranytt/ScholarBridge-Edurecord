import fs from 'fs';
let s = fs.readFileSync('prisma/schema.prisma', 'utf-8');
s = s.replace(/  @@schema\("public"\)\n/g, '');
fs.writeFileSync('prisma/schema.prisma', s);

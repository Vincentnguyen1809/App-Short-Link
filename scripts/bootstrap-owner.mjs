import { PrismaClient } from '@prisma/client';

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

async function hashPassword(rawPassword) {
  const bytes = new TextEncoder().encode(rawPassword);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

const enableFlag = process.env.BOOTSTRAP_OWNER_ENABLED;
if (enableFlag !== 'true') {
  throw new Error('Refusing to run bootstrap. Set BOOTSTRAP_OWNER_ENABLED=true to continue.');
}

const ownerEmail = requireEnv('BOOTSTRAP_OWNER_EMAIL').trim().toLowerCase();
const ownerPassword = requireEnv('BOOTSTRAP_OWNER_PASSWORD');
const ownerName = process.env.BOOTSTRAP_OWNER_NAME?.trim() || 'Owner';
const workspaceId = process.env.BOOTSTRAP_WORKSPACE_ID?.trim() || 'default-workspace';
const workspaceSlug = process.env.BOOTSTRAP_WORKSPACE_SLUG?.trim() || 'default';
const workspaceName = process.env.BOOTSTRAP_WORKSPACE_NAME?.trim() || 'Default Workspace';

const datasourceUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!datasourceUrl) {
  throw new Error('DIRECT_URL (preferred) or DATABASE_URL must be set.');
}

const prisma = new PrismaClient({ datasourceUrl });

try {
  const hashedPassword = await hashPassword(ownerPassword);

  const user = await prisma.user.upsert({
    where: { email: ownerEmail },
    update: {
      name: ownerName,
      password: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
      verificationToken: null,
      resetToken: null,
      resetTokenExpiry: null,
    },
    create: {
      email: ownerEmail,
      name: ownerName,
      password: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
      verificationToken: null,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });

  await prisma.workspace.upsert({
    where: { id: workspaceId },
    update: {
      ownerId: user.id,
      name: workspaceName,
      slug: workspaceSlug,
    },
    create: {
      id: workspaceId,
      ownerId: user.id,
      name: workspaceName,
      slug: workspaceSlug,
      members: {
        connect: { id: user.id },
      },
    },
  });

  console.log(`Bootstrap owner ready: ${ownerEmail}`);
} finally {
  await prisma.$disconnect();
}

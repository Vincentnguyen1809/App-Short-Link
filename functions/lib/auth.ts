interface AuthPayload {
  id: string;
  email: string;
  role: string;
}

const encoder = new TextEncoder();

function base64UrlEncode(input: ArrayBuffer | string): string {
  const bytes = typeof input === 'string' ? encoder.encode(input) : new Uint8Array(input);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecode(input: string): string {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  const binary = atob(`${normalized}${padding}`);

  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function sign(input: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(input));
  return base64UrlEncode(signature);
}

export async function createAuthToken(payload: AuthPayload, secret: string): Promise<string> {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64UrlEncode(JSON.stringify(payload));
  const content = `${header}.${body}`;
  const signature = await sign(content, secret);
  return `${content}.${signature}`;
}

export async function verifyAuthToken(token: string, secret: string): Promise<AuthPayload | null> {
  const [header, body, signature] = token.split('.');

  if (!header || !body || !signature) {
    return null;
  }

  const content = `${header}.${body}`;
  const expected = await sign(content, secret);

  if (expected !== signature) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(body)) as AuthPayload;
    if (!payload?.id || !payload?.email || !payload?.role) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function requireAuth(request: Request, secret: string): Promise<AuthPayload | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice('Bearer '.length).trim();
  return verifyAuthToken(token, secret);
}

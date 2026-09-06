export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/auth/login" && request.method === "POST") return login(request, env);
    if (url.pathname === "/api/auth/me") return getMe(request, env);
    if (url.pathname === "/api/auth/logout" && request.method === "POST") return logout();
    if (url.pathname === "/api/content" && request.method === "GET") return getContent(env);
    if (url.pathname === "/api/content" && request.method === "PUT") return saveContent(request, env);
    return env.ASSETS.fetch(request);
  }
};

const ADMIN_CODE = "berzelia";

async function login(request, env) {
  const body = await request.json().catch(() => ({}));
  if (body.code !== ADMIN_CODE) return json({error:"Invalid admin code."}, 401);
  const session = await signSession({authenticated:true, authorized:true, username:"Administrator", exp:Date.now()+8*60*60*1000}, env.SESSION_SECRET || ADMIN_CODE);
  return new Response(JSON.stringify({ok:true}), {headers:{"Content-Type":"application/json","Set-Cookie":`aegis_session=${session}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=28800`}});
}

async function getMe(
  request,
  env
) {

  const token =
    getCookie(
      request.headers.get(
        "Cookie"
      ) || "",
      "aegis_session"
    );


  if (!token) {

    return json({
      authenticated: false,
      authorized: false
    });

  }


  const payload =
    await verifySession(
      token,
      env.SESSION_SECRET
    );


  if (!payload) {

    return json({
      authenticated: false,
      authorized: false
    });

  }


  return json({

    authenticated: true,

    authorized:
      !!payload.authorized,

    username:
      payload.username,

    userId:
      payload.userId

  });

}


/* ==================================
   CONTENT GET
================================== */

async function getContent(
  env
) {

  if (!env.DB) {

    return json(
      DEFAULT_DATA
    );

  }


  const row =
    await env.DB
      .prepare(
        "SELECT value FROM portal_content WHERE id = 'main'"
      )
      .first();


  if (!row) {

    return json(
      DEFAULT_DATA
    );

  }


  try {

    return json(
      JSON.parse(
        row.value
      )
    );

  } catch {

    return json(
      DEFAULT_DATA
    );

  }

}


/* ==================================
   CONTENT SAVE
================================== */

async function saveContent(
  request,
  env
) {

  const session =
    await getSession(
      request,
      env
    );


  if (
    !session ||
    !session.authorized
  ) {

    return json(
      {
        error:
          "You are not authorised to edit this website."
      },
      403
    );

  }


  if (!env.DB) {

    return json(
      {
        error:
          "D1 is not configured."
      },
      500
    );

  }


  const data =
    await request.json();


  await env.DB
    .prepare(
      `INSERT INTO portal_content
       (id, value, updated_at)
       VALUES ('main', ?, ?)
       ON CONFLICT(id)
       DO UPDATE SET
       value = excluded.value,
       updated_at = excluded.updated_at`
    )
    .bind(
      "main",
      JSON.stringify(data),
      new Date().toISOString()
    )
    .run();


  return json({
    ok: true
  });

}


/* ==================================
   SESSION
================================== */

async function getSession(
  request,
  env
) {

  const token =
    getCookie(
      request.headers.get(
        "Cookie"
      ) || "",
      "aegis_session"
    );


  if (!token)
    return null;


  return verifySession(
    token,
    env.SESSION_SECRET
  );

}


async function signSession(
  payload,
  secret
) {

  const encoded =
    base64url(
      new TextEncoder().encode(
        JSON.stringify(
          payload
        )
      )
    );


  const key =
    await crypto.subtle.importKey(
      "raw",

      new TextEncoder().encode(
        secret
      ),

      {
        name: "HMAC",
        hash: "SHA-256"
      },

      false,

      ["sign"]
    );


  const signature =
    await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(
        encoded
      )
    );


  return (
    encoded +
    "." +
    base64url(
      new Uint8Array(
        signature
      )
    )
  );

}


async function verifySession(
  token,
  secret
) {

  try {

    const parts =
      token.split(".");


    if (parts.length !== 2)
      return null;


    const payloadPart =
      parts[0];

    const signaturePart =
      parts[1];


    const key =
      await crypto.subtle.importKey(
        "raw",

        new TextEncoder().encode(
          secret
        ),

        {
          name: "HMAC",
          hash: "SHA-256"
        },

        false,

        ["verify"]
      );


    const valid =
      await crypto.subtle.verify(
        "HMAC",

        key,

        fromBase64url(
          signaturePart
        ),

        new TextEncoder().encode(
          payloadPart
        )
      );


    if (!valid)
      return null;


    const payload =
      JSON.parse(
        new TextDecoder().decode(
          fromBase64url(
            payloadPart
          )
        )
      );


    if (
      !payload.exp ||
      payload.exp < Date.now()
    ) {

      return null;

    }


    return payload;

  } catch {

    return null;

  }

}


/* ==================================
   LOGOUT
================================== */

function logout() {

  return new Response(
    JSON.stringify({
      ok: true
    }),
    {

      headers: {

        "Content-Type":
          "application/json",

        "Set-Cookie":
          "aegis_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0"

      }

    }
  );

}


/* ==================================
   HELPERS
================================== */

function getCookie(
  cookieString,
  name
) {

  const found =
    cookieString
      .split(";")
      .map(x => x.trim())
      .find(
        x =>
          x.startsWith(
            name + "="
          )
      );


  return found
    ? found.slice(
        name.length + 1
      )
    : null;

}


function base64url(
  bytes
) {

  let binary = "";

  for (
    const byte of bytes
  ) {

    binary += String.fromCharCode(
      byte
    );

  }


  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

}


function fromBase64url(
  value
) {

  const base64 =
    value
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(
        Math.ceil(
          value.length / 4
        ) * 4,
        "="
      );


  const binary =
    atob(base64);


  const bytes =
    new Uint8Array(
      binary.length
    );


  for (
    let i = 0;
    i < binary.length;
    i++
  ) {

    bytes[i] =
      binary.charCodeAt(i);

  }


  return bytes;

}


function json(
  data,
  status = 200
) {

  return new Response(
    JSON.stringify(data),
    {

      status,

      headers: {
        "Content-Type":
          "application/json"
      }

    }
  );

}

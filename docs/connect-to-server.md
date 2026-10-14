# Connecting the app to the server

The app has two modes, chosen by one setting at build time:

| `NEXT_PUBLIC_API_URL` | Mode |
| --- | --- |
| not set | **Demo.** Everything stays on the phone, as before. |
| `https://api.yourdomain.com` | **Connected.** Codes are shared through the server. |

## How it works (connected mode)

- The phone downloads all toilets (`/v1/snapshot`), then only the changes (`/v1/changes`), and keeps a copy, so the app works offline.
- Anything you do (add a toilet, "Yes/No", suggest or edit a code) is shown at once and put in an **outbox** on the phone. It is sent when there is internet and shows "waiting to send" until then.
- If the server turns something down (for example you were too far away), a message appears in **Profile → Couldn't be sent**.
- The phone gets an anonymous key from the server the first time it needs one. It is kept in `localStorage` (`magyarotyesz:identity`): **clearing the browser's site data means losing the right to edit the codes you shared.**
- The server checks "on the spot" too, so connected mode always sends the phone's position (within 150 m, accuracy ≤ 100 m) with adds and votes. The Profile switch for it is hidden in connected mode.
- The app syncs on start, when the internet returns, when you open the app again, and every minute while it is open.

## Switching it on

1. Run the server (see `magyarotyesz-server`'s README) and make it reachable over **https** (Cloudflare Tunnel or Caddy).
2. On the server set `ALLOWED_ORIGINS` to the exact address(es) the app is opened from, e.g. `https://project-1y1mw.vercel.app` (no trailing slash; every address, including preview URLs you want to use, must be listed).
3. In Vercel → Project → Settings → Environment Variables add `NEXT_PUBLIC_API_URL` = `https://api.yourdomain.com`, then **redeploy** (the value is baked in at build time).
4. For local development copy `.env.example` to `.env.local`.

To go back to the demo, remove the variable and redeploy.

## Things to know

- Deleting a code in Profile removes it **for everyone**. Only the person who shared it can.
- The server only accepts toilets inside Budapest.
- If the server's data is wiped, phones notice (their old key is refused), get a new key and carry on; codes they shared before can't be edited any more.

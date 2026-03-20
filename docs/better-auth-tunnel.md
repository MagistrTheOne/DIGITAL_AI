# Better Auth Dashboard + Cloudflare quick tunnel (trycloudflare)

**HTTP 530** / «origin unregistered» = Cloudflare **не видит активный** `cloudflared` или **не достучался** до Next на `localhost:3000`. Это не ошибка `dash()` и не обязательно API key.

## Стабильный порядок запуска

1. **Сначала** Next (чтобы порт 3000 был занят приложением):

   ```bash
   npm run dev:tunnel
   ```

   Обычный `npm run dev` тоже ок, но `dev:tunnel` явно слушает **`127.0.0.1:3000`** — так меньше сюрпризов с IPv6/`localhost` на Windows.

2. **Потом** туннель **на тот же адрес**:

   ```bash
   cloudflared tunnel --url http://127.0.0.1:3000 --protocol http2
   ```

3. Скопируй **новый** `https://….trycloudflare.com` из вывода и пропиши в `.env` / `.env.local`:

   - `BETTER_AUTH_URL`
   - `NEXT_PUBLIC_BETTER_AUTH_URL`

4. **Перезапусти** `npm run dev` / `dev:tunnel` после смены env.

5. Проверь в браузере **до** кнопки в Dashboard:

   - `https://<твой-поддомен>.trycloudflare.com/api/auth`  
     Должен быть ответ от Better Auth (не страница 530).

6. В Better Auth Dashboard нажми **Retry**, когда в логе `cloudflared` есть  
   `Registered tunnel connection` **и** нет свежих `Connection terminated`.

## Частые причины 530

| Причина | Что сделать |
|--------|-------------|
| Next не запущен или порт не 3000 | Запусти dev, проверь `http://127.0.0.1:3000/api/auth` локально |
| Туннель перезапускался | Новый URL → обнови env |
| Обрыв в логе (`client disconnected`) | Подожди переподключения, отключи VPN, попробуй другую сеть |
| Проверка в момент реконнекта | Подожди 10–20 с после `Registered tunnel connection`, открой URL в браузере, потом Retry |

## Про `cert.pem` / `origin-ca-pool` в логе

Для **quick tunnel** без аккаунта Cloudflare это часто **можно игнорировать**, если туннель зарегистрирован и сайт открывается по HTTPS.

## Надёжная проверка Dashboard

Задеплой проект (например Vercel), выстави там `BETTER_AUTH_URL` / секреты — проверка не зависит от временного trycloudflare.

# Yayına alma

Hepsi ücretsiz katmanda kalır. Kredi kartı hiçbir adımda istenmez.

| Parça | Servis | Ücretsiz sınır |
| --- | --- | --- |
| Statik site | Cloudflare Pages | sınırsız istek, ayda 500 derleme |
| Form ucu | Pages Functions | günde 100.000 istek |
| Spam kontrolü | Cloudflare Turnstile | sınırsız |
| Mail teslimi | Resend | ayda 3.000, günde 100 |

## Senin yapman gerekenler

### 1. Repoyu GitHub'a koy

Uzak adres belli olunca:

```
git remote add origin <adres>
git push -u origin main
git push origin dev
git push --tags
```

### 2. Cloudflare Pages projesi

Cloudflare panelinde **Workers & Pages > Create > Pages > Connect to Git**, repoyu seç ve şunları gir:

- Framework preset: **Astro**
- Build command: `pnpm build`
- Build output directory: `dist`
- Production branch: **main**

İlk derleme `post-manager.pages.dev` gibi bir adres verir. Alan adı almadan da site bu adresten çalışır.

### 3. Turnstile anahtarları

**Turnstile > Add widget**. Widget modu **Managed**. Hostname olarak `post-manager.pages.dev` (ve varsa kendi alan adın) ekle. İki anahtar çıkar:

- **Site key**: herkese açık, sayfanın içine gömülür
- **Secret key**: yalnızca sunucuda durur

### 4. Resend hesabı

[resend.com](https://resend.com) üzerinde **tanertalas.dev@gmail.com ile kayıt ol**. Bu önemli: alan adın olmadığı sürece Resend yalnızca hesabın kendi adresine teslim eder, o da zaten mailleri almak istediğin adres. **API Keys > Create** ile bir anahtar üret.

### 5. Ortam değişkenlerini gir

Pages projesi > **Settings > Environment variables**. Production ve Preview için ayrı ayrı ekle:

| Ad | Değer | Tür |
| --- | --- | --- |
| `PUBLIC_TURNSTILE_SITE_KEY` | Turnstile site key | Plaintext |
| `TURNSTILE_SECRET_KEY` | Turnstile secret key | **Secret** |
| `RESEND_API_KEY` | Resend anahtarı | **Secret** |
| `CONTACT_TO` | `tanertalas.dev@gmail.com` | **Secret** |

`PUBLIC_TURNSTILE_SITE_KEY` derleme sırasında okunur, diğerleri çalışma anında. Değişkenleri ekledikten sonra **yeniden derlemen gerekir**, yoksa site key sayfaya gömülmez.

### 6. Kontrol et

Yayındaki `/contact` sayfasında Turnstile kutusu görünmeli. Kendine bir mesaj gönder, tanertalas.dev@gmail.com kutusuna düşmeli. Gelen mailde **Reply-To** yazan kişinin adresi olur, doğrudan yanıtlayabilirsin.

## İsteğe bağlı, sonradan

### Hız sınırı

Turnstile zaten botları eliyor. Bir kat daha isterlerse Cloudflare panelinde **KV > Create namespace** ile bir alan aç, Pages projesinde `RATE_LIMIT` adıyla bağla. Uç nokta bağlamayı kendiliğinden fark eder, yoksa sınırsız çalışır. Ücretsiz katman günde 1.000 yazma verir, bir iletişim formuna fazlasıyla yeter.

### Kendi alan adın

Alan adı alırsan iki şey değişir:

1. `astro.config.mjs` içindeki `site` alanını gerçek adrese çevir. Canonical ve OG adresleri oradan üretilir.
2. Resend'de alan adını doğrula, sonra `CONTACT_FROM` değişkenini `Post Manager <hello@alanadin.com>` gibi bir değerle ekle. Böylece mailler paylaşımlı test adresinden değil kendi alan adından çıkar ve teslim oranı yükselir.

Alan adı Cloudflare'de duruyorsa ayrıca ücretsiz WAF hız sınırı kuralı ve Cloudflare Email Routing kullanılabilir; ikincisi Resend'i tümden gereksiz kılar.

## Yerelde denemek

```
cp .dev.vars.example .dev.vars     # değerleri doldur
cp .env.example .env               # PUBLIC_TURNSTILE_SITE_KEY
pnpm build
pnpm preview:cf
```

`pnpm preview:cf` Pages Function'ı ve güvenlik başlıklarını da çalıştırır; `pnpm preview` yalnızca statik dosyaları sunar, form ucu orada yoktur.

Turnstile'ın test anahtarları, gerçek anahtar almadan akışı denemek için:

| Amaç | Site key | Secret key |
| --- | --- | --- |
| Her zaman geçer | `1x00000000000000000000AA` | `1x0000000000000000000000000000000AA` |
| Her zaman kalır | `2x00000000000000000000AB` | `2x0000000000000000000000000000000AA` |

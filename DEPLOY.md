# Yayına alma

Hepsi ücretsiz katmanda kalır. Kredi kartı hiçbir adımda istenmez.

| Parça | Servis | Ücretsiz sınır |
| --- | --- | --- |
| Statik site | Vercel Hobby | ayda 100 GB bant genişliği |
| Form ucu | Vercel Functions | Hobby planına dahil |
| Spam kontrolü | Cloudflare Turnstile | sınırsız |
| Mail teslimi | Resend | ayda 3.000, günde 100 |

## Senin yapman gerekenler

### 1. Vercel projesi

[vercel.com/new](https://vercel.com/new) üzerinde GitHub reposunu içe aktar. Vercel Astro'yu tanır ve şunları kendisi doldurur:

- Framework preset: **Astro**
- Build command: `pnpm build`
- Output directory: `dist`

Kökteki `api/contact.ts` dosyası ayrıca bir ayar istemez, Vercel onu `/api/contact` adresinde bir fonksiyon olarak yayına alır.

İlk derleme `post-manager.vercel.app` gibi bir adres verir.

### 2. Ortam değişkenleri

Vercel projesinde **Settings > Environment Variables**. Dördünü de Production, Preview ve Development için ekle:

| Ad | Değer |
| --- | --- |
| `PUBLIC_TURNSTILE_SITE_KEY` | Turnstile site key |
| `TURNSTILE_SECRET_KEY` | Turnstile secret key |
| `RESEND_API_KEY` | Resend anahtarı |
| `CONTACT_TO` | `tanertalas.dev@gmail.com` |

`PUBLIC_TURNSTILE_SITE_KEY` derleme sırasında sayfaya gömülür, diğer üçü çalışma anında okunur. Değişkenleri ekledikten sonra **yeniden derlemen gerekir**, yoksa site key sayfaya girmez.

### 3. Turnstile'a Vercel adresini ekle

Cloudflare panelinde **Turnstile > widget > Settings > Hostnames**. `post-manager.vercel.app` ekle. Kendi alan adını bağladığında onu da ekle.

Hostname listesi eksikse doğrulama sunucu tarafında başarısız olur ve form "That spam check did not pass" der.

### 4. `site` alanını güncelle

Gerçek adres belli olunca `astro.config.mjs` içindeki `site` alanını ona çevir. Canonical bağlantılar ve OG görselinin mutlak adresi oradan üretilir.

### 5. Kontrol et

Yayındaki `/contact` sayfasında Turnstile kutusu görünmeli. Kendine bir mesaj gönder, tanertalas.dev@gmail.com kutusuna düşmeli. Gelen mailde **Reply-To** yazan kişinin adresi olur, doğrudan yanıtlayabilirsin.

## Kendi alan adın

Alan adı alırsan üç şey değişir:

1. `astro.config.mjs` içindeki `site`.
2. Turnstile hostname listesi.
3. Resend'de alan adını doğrula, sonra `CONTACT_FROM` değişkenini `Post Manager <hello@alanadin.com>` gibi bir değerle ekle. Böylece mailler paylaşımlı test adresinden değil kendi alan adından çıkar ve teslim oranı yükselir.

## Yerelde denemek

```
cp .env.example .env.local     # değerleri doldur
pnpm dev
```

`pnpm dev` form ucunu çalıştırmaz, çünkü uç nokta bir Vercel fonksiyonu. Uçtan uca denemek için:

```
pnpm dlx vercel dev
```

Turnstile'ın test anahtarları, gerçek anahtar almadan akışı denemek için:

| Amaç | Site key | Secret key |
| --- | --- | --- |
| Her zaman geçer | `1x00000000000000000000AA` | `1x0000000000000000000000000000000AA` |
| Her zaman kalır | `2x00000000000000000000AB` | `2x0000000000000000000000000000000AA` |

## Hız sınırı

Şu an uç noktada sayaç yok: Turnstile, honeypot ve süre kontrolü birlikte çalışıyor. Bir kat daha istenirse Vercel tarafında Upstash Redis ücretsiz katmanı ya da Vercel'in kendi WAF hız sınırı kuralları kullanılabilir. `api/contact.ts` içindeki `handleContact` saf bir işlev olduğu için araya sayaç eklemek tek satırlık bir iş.

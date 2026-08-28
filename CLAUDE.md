# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Durum

v1 kuruldu ve çalışıyor: altı rota, beş platform bileşeni, tur ve kalıcılık yerinde.

```
src/
  data/          platforms.ts (PLATFORMS, FIELDS, LIMITS), legal.ts
  lib/           store.ts (tek yazma yolu), storage.ts, media.ts, chain.ts, tour.ts, anchors.ts, contact.ts
  layouts/       Base.astro, Shell.astro (home ve app), Legal.astro
  components/    PlatformRow.tsx, Icon.tsx, SiteFooter.astro, composers/*.tsx
  islands/       HeaderBar.tsx, AppScreen.tsx, TourGuide.tsx, ContactForm.tsx
  pages/         index, app, privacy, terms, cookies, contact
functions/api/   contact.ts (Cloudflare Pages Function)
scripts/         build-headers.mjs (derleme sonrası CSP ve önbellek başlıkları)
public/          favicon.svg, logo.png, og.png, icons/*.svg
```

Island sayısı dörtte tutuldu: `HeaderBar` (sekmeler, adlandırma, bilgi kutusu), `AppScreen` (seçici, notlar, editör satırları), `TourGuide`, `ContactForm`. Ana sayfadaki iki buton ve legal gezinme düz bağlantıdır, island değildir. Başlığın kaydırmada gizlenmesi ve legal sayfadaki Return `<script>` ile çözülür, island açmaz.

`.gitignore` `docs/`, `HANDOFF.md` ve `CLAUDE.code.md` dosyalarını dışarıda bırakır: bunlar yerel referanstır, sürüme girmez. `CLAUDE.md` sürüme girer.

Sitede yapılan değişiklik dokümanı da değiştirir. Kapsam, platform listesi, saklanan durum veya rota haritası değiştiğinde bu dosya aynı işin parçası olarak güncellenir, sonraya bırakılmaz. Doküman güncellemesi kendi commit'ini alır (`docs: ...`).

Legal sayfaların metinleri en son elden geçirilir. Uygulama davranışı oturduktan sonra gizlilik, şartlar ve çerez metinleri gerçekte olan bitene göre düzeltilir.

## Komutlar

pnpm, Node 22 LTS:

```
pnpm dev                                  # geliştirme sunucusu
pnpm build                                # statik çıktı ve dist/_headers
pnpm preview                              # yalnızca statik dosyalar
pnpm preview:cf                           # Pages Function ve başlıklarla birlikte
pnpm test                                 # birim testleri
pnpm test:watch                           # izleme kipi
pnpm vitest run src/lib/storage.test.ts   # tek dosya
pnpm vitest run -t "gerekli metin"        # tek test
pnpm test:e2e                             # akış testleri (build ve preview'i kendisi ayağa kaldırır)
pnpm exec playwright test -g "reload"     # tek akış testi
pnpm check                                # tip ve şablon denetimi
pnpm exec tsc -p functions/tsconfig.json  # Pages Function tip denetimi
```

## Referans tasarım

`docs/*.dc.html` Claude Design çıktısıdır ve tek doğruluk kaynağıdır. Ölçü, renk, boşluk ve etkileşim oradan okunur, tasarımdan sapılmaz. Kod kopyalanmaz: okunur, anlaşılır, hedef tech stack'e çevrilir.

Önemli olan tek dosya `docs/Post Manager.dc.html` (2210 satır). Diğer altı sayfa (`Home`, `Projects`, `Privacy Policy`, `Terms`, `Contact`) yalnızca bu bileşeni farklı `initial-route` / `initial-legal` değerleriyle çağıran ince sarmalayıcılardır, kendi içerikleri yoktur. `Logo & OG.dc.html` marka varlıklarını taşır.

`.dc.html` biçimi: şablon düz HTML, `{{ }}` delikleri ve `<sc-if>` / `<sc-for>` blokları içerir; mantık dosyanın sonundaki `class Component extends DCLogic` içindedir. Sabitler (`PLATFORMS`, `FIELDS`, `SEED`, `LEGAL`, `TOUR`, `RD_SUBS`, `RD_FLAIRS`, `EMOJIS`) sınıfın hemen üstündedir. Tüm türetilmiş görsel değerler tek bir `renderVals()` içinde toplanır; bir davranışı ararken önce oraya bak.

## Çeviride yapılacak temel dönüşüm

Tasarım tek bir client bileşenidir: `state.route` (`home` / `app` / `legal`) ile sayfa değiştirir, tüm ekranlar tek DOM ağacında yaşar. Hedef bunun tersidir: her rota kendi statik HTML sayfası, client router yok.

- Tasarımdaki `route` durumu Astro rotalarına açılır.
- Tasarımdaki `legal` durumu `/privacy`, `/terms`, `/cookies`, `/contact` sayfalarına açılır. `/cookies` rota haritasında yoktu ama gerekli: uygulama tarayıcıda veri saklıyor, bu sayfa onun karşılığıdır.
- `docs/Projects.dc.html` uygulama ekranının ta kendisidir (`initial-route="app"`). İki ada tek ekran düştüğü için `/projects` rotası `astro.config.mjs` içinde `/app`'e yönlendirilir.
- Ortak kabuk (header, proje sekmeleri, footer, alt linkler) tek layout: `src/layouts/Shell.astro`.
- Durum tutması zorunlu bloklar Preact island (`client:load`). Statik olabilen hiçbir şey island olmaz.

## Uygulama modeli

Durum ağacı proje merkezlidir:

```
tabs      [{ id, label, closable }]   sekme şeridi, 'home' sekmesi kapatılabilir, projeler değil
active    tabs içindeki id
projects  { [id]: { selected: string[], open: {}, content: {} } }
```

- `selected`: o projede etkinleştirilmiş platformlar. `open`: hangi editör satırı açık.
- `content`: düz anahtar/değer sözlüğü, anahtarlar `FIELDS` listesinden gelir ve `<platform>_<alan>` biçimindedir (`reddit_title`, `linkedin_body`, `instagram_caption`). Yeni bir alan eklerken hem `FIELDS` karşılığını hem editörü hem önizlemeyi hem kalıcılık şemasını güncelle.
- Yazma yolu tek noktadan geçer: `setField(key, value)` -> `patch(fn)` -> aktif projeyi kopyalayarak değiştirir. Bu tek yazma noktası korunmalı.

Platformlar (`PLATFORMS`): `reddit`, `linkedin`, `instagram`, `twitter` (Twitter / X), `threads`. Beş platform, hepsi bu. Yeni proje `selected: ['twitter']` ile açılır, ekran hiçbir zaman boş karşılamaz.

Zincir tutan iki bileşen (Twitter, Threads) `src/lib/chain.ts` üzerinden çalışır: ilk gönderi `<platform>_body`, devamı `<platform>_thread` dizisi. İkisi de kalıcıdır. Medya kovaları `<platform>#<index>` adıyla ayrılır.

dev.to yapılmayacak. Tasarımda editörü ve `devto_*` alanları var, bunlar taşınmaz: `PLATFORMS` listesine girmez, `FIELDS` içine `devto_*` anahtarı eklenmez, `devIns` benzeri markdown yardımcıları yazılmaz. Tasarımda görüp de kodda bulamadığın dev.to parçaları eksik değil, kapsam dışı.

Platforma özel kurallar tasarımda gömülüdür ve taşınmalıdır:

- Reddit: bağlantı, görsel ve video karşılıklı olarak birbirini kilitler; gövde `contentEditable`, seçim aralığı elle korunur ve yalnızca proje değişince `innerHTML` yeniden yazılır (her tuşta yazmak imleci düşürür).
- Twitter: 280 karakter, 260'ta sarı, 280 üstü kırmızı halka; zincir gönderiler `twMore`; gönderi başına en çok 4 medya.
- LinkedIn: 3000 karakterde sayaç rengi değişir.

## Kalıcılık

Bu bir gereksinim, ek özellik değil. Kullanıcı siteye tekrar girdiğinde her şeyi bıraktığı gibi bulmalı: aynı sekmeler, aynı açık proje, aynı metinler, aynı açık editör satırları.

`localStorage`'a yazılan durum:

```
tabs                          sekme listesi, sırasıyla
active                        açık proje
projects[id].content          tüm metin alanları
projects[id].selected         etkin platformlar
projects[id].open             açık editör satırları
lang, neverConfirm, tourSeen  tercihler
```

Kurallar:

- Yazma tek noktadan geçer. `setField` -> `patch` zinciri zaten aktif projeyi kopyalayarak değiştiriyor; kalıcılık da oraya bağlanır, her bileşen kendi başına `localStorage`'a yazmaz.
- Yazmalar kısılır (debounce), her tuş vuruşunda diske gidilmez.
- Depolanan veri bir şema sürümü taşır. Şekil değişince eski kaydı okuyup taşı ya da bilerek at, sessizce bozulmuş durum yükleme.
- Okuma yalnızca client tarafında olur. Sayfalar statik üretilir, ilk boyamada kayıtlı durum henüz yoktur; island'lar buna göre yazılır, sunucuda yokmuş gibi davranan bir kabuk çizip sonra doldururlar.
- Kayıt yoksa veya bozuksa uygulama boş projeyle açılır, hata vermez.

- Bekleyen yazma `pagehide` ve sekme gizlenmesinde boşaltılır. Bu olmadan hızlı bir yenileme son tuş vuruşlarını yutar, akış testi bunu yakalar.

Medya bunun dışındadır: görsel ve video sayfa açıkken bellekte tutulur, kapanınca gider, hiçbir zaman diske yazılmaz. Blob URL'leri sayfa ömrüyle sınırlıdır, kaydetmek zaten çalışmaz. Instagram alt metni de medyaya bağlı olduğu için aynı ömre sahiptir. Gizlilik ve çerez metinleri tam olarak bunu taahhüt eder, uygulama bu iki metinden sapmamalı.

Kalıcı olmayan tek arayüz durumu, bileşen içi akordeonlar (Instagram'ın Share to / Accessibility / Advanced bölümleri) ve sekme seçimleridir. Bunlar tasarımdaki gibi açık başlar.

## Tasarım tokenları

`_ds` stil paketi repoda yok, yalnızca değişken adları görünür. `src/styles/theme.css` içinde tanımlanacak tokenlar: `--color-bg`, `--color-surface`, `--color-text`, `--color-divider`, `--color-accent`, `--color-accent-700`, `--color-neutral-200`, `--radius-md`, `--font-heading`, `--font-body`, `--font-heading-weight`.

Somut değerler `Logo & OG.dc.html` içinden okunur: accent `#b68235`, accent-700 `#7d5411`, metin `#201f1d`, arka plan `#f3f2f2`, ayraç `rgba(32,31,29,0.12)`. Tipografi Public Sans (başlık ağırlığı 600) ve Newsreader, Google Fonts üzerinden yüklenir; gizlilik metni zaten "yazı tiplerini bir sağlayıcıdan yükler" der.

Marka varlıkları `public/` altında: `og.png` (1200x630, tüm sayfaların OG ve Twitter görseli), `logo.png` (apple touch icon), `favicon.svg` (pm sekme işaretinin vektör hali, 16px'te net durur). Başlıktaki ve ana sayfadaki işaret tasarımdaki gibi işaretleme ile çizilir, raster dosya değildir. Mutlak OG adresi için `astro.config.mjs` içindeki `site` alanı kullanılır, gerçek alan adı belli olunca oraya yazılır.

Tasarımda `_ds` paketinden gelen sınıflar da kullanılır: `btn` (`btn-primary`, `btn-secondary`, `btn-ghost`, `btn-icon`), `input`, `field`, `hr`, `elev-lg`, `dialog-backdrop`. Bunların Tailwind karşılıkları bir kez kurulur, sonra her yerde aynısı kullanılır.

Mobil eşiği 760px (`isMobile`). Başlık kaydırmada gizlenir: 130px altında ve 14px'ten büyük hareketlerde, en az 420ms aralıkla.

## Barındırma ve iletişim formu

Yığın tümüyle ücretsiz katmanda: Cloudflare Pages (statik), Pages Functions (form ucu), Turnstile (spam), Resend (mail teslimi). Adım adım kurulum `DEPLOY.md` içinde.

Site `output: 'static'` kalır. Form ucu Astro adaptörü değil, kökteki `functions/api/contact.ts` dosyasıdır; Cloudflare Pages onu `dist` ile yan yana kendisi ayağa kaldırır. Bu yüzden tek bir uç nokta için tüm siteyi SSR'a çevirmek gerekmedi.

Doğrulama `src/lib/contact.ts` içinde durur ve iki taraf da aynı dosyayı kullanır. Tarayıcıdaki kontrol nezakettir, sunucu hepsini baştan yapar ve asıl kapı odur.

Uç noktanın sırası: gövde boyu, JSON ayrıştırma, bot işaretleri, alan doğrulama, Turnstile, hız sınırı, mail. Karşılıkları:

- Bot işaretleri (dolu honeypot, üç saniyeden hızlı gönderim) `200 {ok:true}` alır. Sessizce düşer, çünkü gerçek yanıtı görmek bota neyin yakalandığını öğretir.
- Turnstile başarısız olursa `403` döner ve mail hiç denenmez.
- `onRequest` tek giriştir. Yalnızca `onRequestPost` yazılırsa GET isteği statik varlıklara düşüp ana sayfayı `200` ile döndürür, bu yüzden metot kontrolü elle yapılır.
- Ada gelen satır sonları `singleLine` ile silinir, mail başlığına fazladan alan sızmasın diye. Mesaj HTML gövdesine `escapeHtml` ile girer.
- `RATE_LIMIT` KV bağlaması isteğe bağlıdır. Yoksa uç nokta çalışır, sadece adres başına sayaç tutmaz.

Honeypot `display:none` değil, ekran dışıdır: bazı botlar tarayıcının boyamadığı alanları atlar. Klavye ve ekran okuyucu `tabindex="-1"` ve `aria-hidden` ile zaten atlar.

## Güvenlik başlıkları

`dist/_headers` her derlemede `scripts/build-headers.mjs` tarafından üretilir, elle düzenlenmez.

CSP satır içi script'lere `'unsafe-inline'` vermez. Astro sayfa başına birkaç satır içi script yayar (island çalışma zamanı, Shell ve Legal davranışları); script hepsinin sha256 özetini çıkarıp politikaya yazar. Bu yüzden Astro sürümü ya da o script'ler değişince özetler kendiliğinden yenilenir, ama `_headers` dosyasını elle taşımak siteyi kırar.

`style-src` içinde `'unsafe-inline'` kalmak zorunda: tasarımın bütün ölçüleri style özniteliğinde duruyor. Asıl korunan yüzey script.

`img-src` ve `media-src` içinde `blob:` var, medya önizlemeleri object URL olduğu için.

Değişiklikten sonra `pnpm preview:cf` ile açıp konsolda CSP ihlali olmadığını görmek gerekir; `pnpm preview` başlıkları uygulamaz.

## Tur

Yedi adım, `src/lib/tour.ts` içinde. Hedefler `src/lib/anchors.ts` üzerinden bulunur: tur `HeaderBar` içindeki artı, kalem ve soru işaretine de, `AppScreen` içindeki Twitter satırı ve silme düğmesine de aynı biçimde erişir, başka bir island'ın DOM'una uzanmaz.

Adımların bir kısmı anlattığı işi yapar: 2'den 3'e geçerken adlandırma kutusunu örnek adla açar, 3'ten 4'e geçerken projeyi oluşturur, 4'ten 5'e geçerken Twitter satırını açar. Bu işleri `HeaderBar` `registerTourCommands` ile devreder.

Tur açıkken `document.body.dataset.tour` işaretlenir, başlık kaydırmada gizlenmez. Tur `/app?tour=1` ile başlar ve bayrak `history.replaceState` ile silinir, yenileme turu baştan açmaz.

## Tasarımdan bilinçli sapmalar

Tasarım tek doğruluk kaynağıdır, ama şu noktalarda kendi içinde tutarsızdı. Sapmalar bilerek yapıldı:

- Threads bileşeninin arayüz metni tasarımda Türkçeydi ("Yeni yazışma", "Yazışmaya ekle"), sitenin geri kalanı İngilizce. İngilizceye çevrildi.
- `instagram_location` ve `instagram_alt` alanları `FIELDS` içinde vardı ama hiçbir yere bağlı değildi, atıldı. Alt metin tasarımda zaten medya nesnesinin üstünde duruyor.
- Instagram anahtarları (AI etiketi, yorumları kapatma, Threads paylaşımı) tasarımda bileşen durumundaydı, kalıcı değildi. Kullanıcı seçimi oldukları için `instagram_*` alanlarına taşındı ve saklanıyor.
- Twitter ve Threads zincirlerinin metni tasarımda kalıcı değildi. Yazılan metin olduğu için saklanıyor.
- Medya tasarımda projeden bağımsız tek bir listeydi, sekme değiştirince öteki projeye taşıyordu. Proje ve platform başına ayrıldı.
- `thCount` ve `liCount` tasarımda hesaplanıp hiç kullanılmıyordu. Threads'te sayaç yok, LinkedIn 3000 eşiği korundu.

## Bilinen eksikler

- Dil düğmesi yalnızca EN ve TR arasında etiketi çevirir ve tercihi saklar, arayüz metinleri hâlâ İngilizcedir. Tasarımda da böyle.
- Legal metinler taslak, sayfalarda bunu söyleyen bir not var.

## Dallar ve commit

- Geliştirme `dev` dalında yapılır. `main` yalnızca tamamlanmış sürümleri alır (`v1`, `v2`), her sürüm etiketlenir (`git tag v1`). `main`'e doğrudan commit atılmaz, sadece `dev` birleştirilir.
- Commit mesajları İngilizce. Kendinden, araçtan veya yapay zekadan söz edilmez: imza, "generated by" ve eş yazar satırı yok.
- Her küçük kod bloğu değişikliği kendi commit'i olur. Bir commit tek bir işi anlatır, "wip" commit yok.
- Biçim: `<type>: <short imperative summary>`. Tipler: `feat`, `fix`, `refactor`, `style`, `chore`, `docs`, `test`.
- Uzak repo sonradan verilecek. Adres gelene kadar yerel çalış, geldiğinde `origin` olarak ekle.

## Yazım

Em dash (—) ve en dash (–) hiçbir yerde kullanılmaz: ne kodda, ne arayüz metninde, ne commit mesajında, ne dokümanda. Yerine nokta, virgül, iki nokta veya parantez.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Durum

Repo henüz kurulmadı. Kökte yalnızca referans tasarımlar (`docs/`), devir notu (`HANDOFF.md`) ve taslak kural dosyası (`CLAUDE.code.md`) var. `package.json`, `src/` ve git geçmişi yok. İlk iş Astro projesini kurmak.

`.gitignore` `docs/`, `HANDOFF.md` ve `CLAUDE.code.md` dosyalarını dışarıda bırakır: bunlar yerel referanstır, sürüme girmez. `CLAUDE.md` sürüme girer.

Sitede yapılan değişiklik dokümanı da değiştirir. Kapsam, platform listesi, saklanan durum veya rota haritası değiştiğinde bu dosya aynı işin parçası olarak güncellenir, sonraya bırakılmaz. Doküman güncellemesi kendi commit'ini alır (`docs: ...`).

Legal sayfaların metinleri en son elden geçirilir. Uygulama davranışı oturduktan sonra gizlilik, şartlar ve çerez metinleri gerçekte olan bitene göre düzeltilir.

## Komutlar

Proje kurulduktan sonra (pnpm, Node 22 LTS):

```
pnpm dev                                  # geliştirme sunucusu
pnpm build                                # statik çıktı
pnpm preview                              # çıktıyı yerel sun
pnpm vitest                               # birim testleri (izleme)
pnpm vitest run src/lib/foo.test.ts       # tek dosya
pnpm vitest run -t "gerekli metin"        # tek test
pnpm playwright test                      # akış testleri
pnpm playwright test tests/app.spec.ts    # tek akış dosyası
pnpm astro check                          # tip ve şablon denetimi
```

## Referans tasarım

`docs/*.dc.html` Claude Design çıktısıdır ve tek doğruluk kaynağıdır. Ölçü, renk, boşluk ve etkileşim oradan okunur, tasarımdan sapılmaz. Kod kopyalanmaz: okunur, anlaşılır, hedef tech stack'e çevrilir.

Önemli olan tek dosya `docs/Post Manager.dc.html` (2210 satır). Diğer altı sayfa (`Home`, `Projects`, `Privacy Policy`, `Terms`, `Contact`) yalnızca bu bileşeni farklı `initial-route` / `initial-legal` değerleriyle çağıran ince sarmalayıcılardır, kendi içerikleri yoktur. `Logo & OG.dc.html` marka varlıklarını taşır.

`.dc.html` biçimi: şablon düz HTML, `{{ }}` delikleri ve `<sc-if>` / `<sc-for>` blokları içerir; mantık dosyanın sonundaki `class Component extends DCLogic` içindedir. Sabitler (`PLATFORMS`, `FIELDS`, `SEED`, `LEGAL`, `TOUR`, `RD_SUBS`, `RD_FLAIRS`, `EMOJIS`) sınıfın hemen üstündedir. Tüm türetilmiş görsel değerler tek bir `renderVals()` içinde toplanır; bir davranışı ararken önce oraya bak.

## Çeviride yapılacak temel dönüşüm

Tasarım tek bir client bileşenidir: `state.route` (`home` / `app` / `legal`) ile sayfa değiştirir, tüm ekranlar tek DOM ağacında yaşar. Hedef bunun tersidir: her rota kendi statik HTML sayfası, client router yok.

- Tasarımdaki `route` durumu Astro rotalarına açılır.
- Tasarımdaki `legal` durumu `/privacy`, `/terms`, `/cookies`, `/contact` sayfalarına açılır. `/cookies` rota haritasında yoktu ama gerekli: uygulama tarayıcıda veri saklıyor, bu sayfa onun karşılığıdır.
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

Platformlar (`PLATFORMS`): `reddit`, `linkedin`, `instagram`, `twitter` (Twitter / X), `threads`. Beş platform, hepsi bu.

dev.to yapılmayacak. Tasarımda editörü ve `devto_*` alanları var, bunlar taşınmaz: `PLATFORMS` listesine girmez, `FIELDS` içine `devto_*` anahtarı eklenmez, `devIns` benzeri markdown yardımcıları yazılmaz. Tasarımda görüp de kodda bulamadığın dev.to parçaları eksik değil, kapsam dışı.

Platforma özel kurallar tasarımda gömülüdür ve taşınmalıdır:

- Reddit: bağlantı, görsel ve video karşılıklı olarak birbirini kilitler (`rdLocked`); gövde `contentEditable`, seçim aralığı (`_rdRange`) elle korunur ve proje değişince `innerHTML` yeniden yazılır.
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

Medya bunun dışındadır: görsel ve video sayfa açıkken bellekte tutulur, kapanınca gider, hiçbir zaman diske yazılmaz. Blob URL'leri sayfa ömrüyle sınırlıdır, kaydetmek zaten çalışmaz. Gizlilik ve çerez metinleri tam olarak bunu taahhüt eder, uygulama bu iki metinden sapmamalı.

## Tasarım tokenları

`_ds` stil paketi repoda yok, yalnızca değişken adları görünür. `src/styles/theme.css` içinde tanımlanacak tokenlar: `--color-bg`, `--color-surface`, `--color-text`, `--color-divider`, `--color-accent`, `--color-accent-700`, `--color-neutral-200`, `--radius-md`, `--font-heading`, `--font-body`, `--font-heading-weight`.

Somut değerler `Logo & OG.dc.html` içinden okunur: accent `#b68235`, accent-700 `#7d5411`, metin `#201f1d`, arka plan `#f3f2f2`, ayraç `rgba(32,31,29,0.12)`. Tipografi Public Sans (başlık ağırlığı 600) ve Newsreader. OG görseli 1200x630.

Tasarımda `_ds` paketinden gelen sınıflar da kullanılır: `btn` (`btn-primary`, `btn-secondary`, `btn-ghost`, `btn-icon`), `input`, `field`, `hr`, `elev-lg`, `dialog-backdrop`. Bunların Tailwind karşılıkları bir kez kurulur, sonra her yerde aynısı kullanılır.

Mobil eşiği 760px (`isMobile`). Başlık kaydırmada gizlenir: 130px altında ve 14px'ten büyük hareketlerde, en az 420ms aralıkla.

## Dallar ve commit

- Geliştirme `dev` dalında yapılır. `main` yalnızca tamamlanmış sürümleri alır (`v1`, `v2`), her sürüm etiketlenir (`git tag v1`). `main`'e doğrudan commit atılmaz, sadece `dev` birleştirilir.
- Commit mesajları İngilizce. Kendinden, araçtan veya yapay zekadan söz edilmez: imza, "generated by" ve eş yazar satırı yok.
- Her küçük kod bloğu değişikliği kendi commit'i olur. Bir commit tek bir işi anlatır, "wip" commit yok.
- Biçim: `<type>: <short imperative summary>`. Tipler: `feat`, `fix`, `refactor`, `style`, `chore`, `docs`, `test`.
- Uzak repo sonradan verilecek. Adres gelene kadar yerel çalış, geldiğinde `origin` olarak ekle.

## Yazım

Em dash (—) ve en dash (–) hiçbir yerde kullanılmaz: ne kodda, ne arayüz metninde, ne commit mesajında, ne dokümanda. Yerine nokta, virgül, iki nokta veya parantez.

## Sıralama

1. Astro projesini kur, layout ve tokenları çıkar.
2. Statik sayfalar: Home, Projects, Privacy, Terms, Cookies, Contact.
3. `/app` kabuğu: proje sekmeleri, platform seçici, notlar.
4. Platform editörleri ve önizlemeleri, sırayla: Reddit, LinkedIn, Instagram, X, Threads.
5. Tur (onboarding) akışı: 7 adım, hedeflere `anchor` ile bağlanır, ilerledikçe gerçek arayüzü kullanır (proje açar, adlandırma kutusunu doldurur).
6. `main`'e `v1` olarak birleştir ve etiketle.

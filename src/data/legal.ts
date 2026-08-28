import type { Lang } from '~/i18n/routing';

export type LegalSlug = 'privacy' | 'terms' | 'cookies' | 'contact';
export type LegalDoc = Exclude<LegalSlug, 'contact'>;

export interface LegalSection {
  head: string;
  text: string;
}

export interface LegalPage {
  slug: LegalDoc;
  title: string;
  kicker: string;
  body: LegalSection[];
}

/**
 * Draft wording carried over from the reference design, in both languages.
 * These pages are revisited last, once the app behaviour has settled; when the
 * final wording lands, both languages are rewritten together.
 */
const EN: Record<LegalDoc, LegalPage> = {
  privacy: {
    slug: 'privacy',
    title: 'Privacy Policy',
    kicker: 'Last revised 28 August 2026',
    body: [
      {
        head: 'What is collected',
        text: 'Nothing leaves your browser. Post Manager has no account system, no analytics and no server that receives your drafts. The text you type is written to your browser’s local storage and read back from it the next time you open the page.',
      },
      {
        head: 'What is not stored',
        text: 'Images and video are never saved. They are held in memory while the page is open and discarded when you close or reload it. If a draft depends on a specific image, keep the file yourself.',
      },
      {
        head: 'Clearing your data',
        text: 'Because everything lives in your browser, clearing your browsing data removes every project. There is no copy anywhere else and no way for us to restore one. Your browser settings are the only control you need.',
      },
      {
        head: 'When you write to me',
        text: 'The contact page is the one place where something does leave your browser, and only because you pressed send. Your name, your address and your message are passed to a mail service that delivers them to my inbox. Your address is used to reply and nothing else. Your drafts are never part of it.',
      },
      {
        head: 'Third parties',
        text: 'Three, and only three. Vercel serves the pages. Google Fonts serves the typefaces. Cloudflare Turnstile runs the spam check, and it runs on the contact page alone. Messages you send are handed to Resend, which delivers them to my inbox. No advertising, no analytics, no embedded social scripts.',
      },
    ],
  },
  terms: {
    slug: 'terms',
    title: 'Terms of Use',
    kicker: 'Last revised 28 August 2026',
    body: [
      {
        head: 'What this tool is',
        text: 'Post Manager is a drafting aid. It shows you approximations of each platform’s composer so you can write with the right shape in mind. It does not publish anything, and it is not affiliated with any of the platforms it imitates.',
      },
      {
        head: 'Your content is yours',
        text: 'You keep every right to what you write here. No licence is granted to anyone by using the tool, because your drafts are never transmitted anywhere. A message you deliberately send from the contact page is the one exception, and it goes only to me.',
      },
      {
        head: 'Availability',
        text: 'The tool is offered as it is, without a promise that it will keep working, stay online, or preserve your drafts. Treat it as a scratchpad, not an archive.',
      },
      {
        head: 'Fair use',
        text: 'Do not use the tool to prepare content that is unlawful where you are, or that you intend to publish in violation of a platform’s own rules.',
      },
    ],
  },
  cookies: {
    slug: 'cookies',
    title: 'Cookies',
    kicker: 'Last revised 28 August 2026',
    body: [
      {
        head: 'No cookies are set',
        text: 'Post Manager sets no cookies of its own. It uses local storage, which behaves differently: it is not sent with network requests and it never leaves your device.',
      },
      {
        head: 'What is kept there',
        text: 'Your projects, their names, the platforms you have activated, which composers you left open, and whether you have already seen the tour. Nothing that identifies you.',
      },
      {
        head: 'Why it is kept',
        text: 'So that reopening the page puts you back exactly where you were: the same tabs, the same project in front of you, the same text in every box. Without it every reload would start from an empty page.',
      },
      {
        head: 'The spam check',
        text: 'The contact page runs Cloudflare Turnstile, which may set a short lived cookie of its own to remember that you already passed it. It is there to tell people from bots, it does not follow you across sites, and it appears on that one page only.',
      },
      {
        head: 'Removing it',
        text: 'Clearing site data for this page in your browser settings removes all of it at once. Deleting a project from inside the tool removes just that project.',
      },
    ],
  },
};

const TR: Record<LegalDoc, LegalPage> = {
  privacy: {
    slug: 'privacy',
    title: 'Gizlilik Politikası',
    kicker: 'Son güncelleme 28 Ağustos 2026',
    body: [
      {
        head: 'Neler toplanıyor',
        text: 'Hiçbir şey tarayıcından çıkmıyor. Post Manager’ın hesap sistemi yok, analitiği yok, taslaklarını alan bir sunucusu da yok. Yazdığın metin tarayıcının yerel deposuna yazılır ve sayfayı bir dahaki açışında oradan geri okunur.',
      },
      {
        head: 'Neler saklanmıyor',
        text: 'Görsel ve video hiçbir zaman kaydedilmez. Sayfa açıkken bellekte tutulur, sayfayı kapattığında ya da yenilediğinde gider. Bir taslak belirli bir görsele bağlıysa dosyayı sen sakla.',
      },
      {
        head: 'Verilerini temizlemek',
        text: 'Her şey tarayıcında durduğu için, tarayıcı verilerini temizlemek bütün projeleri siler. Başka hiçbir yerde kopyası yok ve bizim geri getirmemizin bir yolu da yok. İhtiyacın olan tek denetim tarayıcı ayarların.',
      },
      {
        head: 'Bana yazdığında',
        text: 'İletişim sayfası, bir şeyin gerçekten tarayıcından çıktığı tek yer, o da sen gönder dediğin için. Adın, adresin ve mesajın, bunları gelen kutuma ileten bir posta servisine geçer. Adresin yalnızca yanıt vermek için kullanılır, başka hiçbir şey için değil. Taslakların bunun parçası değildir.',
      },
      {
        head: 'Üçüncü taraflar',
        text: 'Üç tane, o kadar. Sayfaları Vercel sunuyor. Yazı tiplerini Google Fonts sunuyor. Spam kontrolünü Cloudflare Turnstile yapıyor ve yalnızca iletişim sayfasında çalışıyor. Gönderdiğin mesajlar, gelen kutuma ileten Resend’e verilir. Reklam yok, analitik yok, gömülü sosyal medya betiği yok.',
      },
    ],
  },
  terms: {
    slug: 'terms',
    title: 'Kullanım Şartları',
    kicker: 'Son güncelleme 28 Ağustos 2026',
    body: [
      {
        head: 'Bu araç nedir',
        text: 'Post Manager bir taslak hazırlama yardımcısıdır. Her platformun düzenleyicisinin yakın bir benzerini gösterir, böylece doğru biçimi aklında tutarak yazarsın. Hiçbir şey yayınlamaz ve taklit ettiği platformların hiçbiriyle bağlantısı yoktur.',
      },
      {
        head: 'Yazdıkların senindir',
        text: 'Burada yazdıkların üzerindeki bütün haklar sende kalır. Aracı kullanmakla kimseye bir lisans verilmiş olmaz, çünkü taslakların hiçbir yere iletilmez. İletişim sayfasından bilerek gönderdiğin bir mesaj tek istisnadır ve o da yalnızca bana gelir.',
      },
      {
        head: 'Erişilebilirlik',
        text: 'Araç olduğu gibi sunulur; çalışmaya devam edeceğine, çevrimiçi kalacağına ya da taslaklarını koruyacağına dair bir söz verilmez. Bunu bir arşiv değil, bir karalama defteri olarak gör.',
      },
      {
        head: 'Adil kullanım',
        text: 'Aracı, bulunduğun yerde hukuka aykırı olan ya da bir platformun kendi kurallarını çiğneyerek yayınlamayı düşündüğün içerikleri hazırlamak için kullanma.',
      },
    ],
  },
  cookies: {
    slug: 'cookies',
    title: 'Çerezler',
    kicker: 'Son güncelleme 28 Ağustos 2026',
    body: [
      {
        head: 'Çerez konmuyor',
        text: 'Post Manager kendine ait hiçbir çerez koymaz. Yerel depolama kullanır, o da farklı çalışır: ağ istekleriyle birlikte gönderilmez ve cihazından hiç çıkmaz.',
      },
      {
        head: 'Orada ne duruyor',
        text: 'Projelerin, adları, etkinleştirdiğin platformlar, açık bıraktığın editörler ve turu daha önce görüp görmediğin. Seni tanımlayan hiçbir şey yok.',
      },
      {
        head: 'Neden duruyor',
        text: 'Sayfayı yeniden açtığında tam bıraktığın yerde olasın diye: aynı sekmeler, önünde aynı proje, her kutuda aynı metin. Bu olmasa her yenileme boş bir sayfadan başlardı.',
      },
      {
        head: 'Spam kontrolü',
        text: 'İletişim sayfası Cloudflare Turnstile çalıştırır; bu da kontrolü geçtiğini hatırlamak için kısa ömürlü kendi çerezini koyabilir. Amacı insanı bottan ayırmaktır, siteler arasında seni izlemez ve yalnızca o tek sayfada görünür.',
      },
      {
        head: 'Kaldırmak',
        text: 'Tarayıcı ayarlarından bu sayfanın site verilerini temizlemek hepsini bir anda siler. Araç içinden bir projeyi silmek yalnızca o projeyi kaldırır.',
      },
    ],
  },
};

const BY_LANG: Record<Lang, Record<LegalDoc, LegalPage>> = { en: EN, tr: TR };

export function legalPage(lang: Lang, slug: LegalDoc): LegalPage {
  return BY_LANG[lang][slug];
}

export const LEGAL_SLUGS: LegalSlug[] = ['privacy', 'terms', 'cookies', 'contact'];

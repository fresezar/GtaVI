import type { Locale } from "@/i18n/locale";

/**
 * Privacy notice and credits, per language. Describes what the site actually does (worker/index.ts, the
 * browser storage keys, Cloudflare services). Update `UPDATED` and the text whenever a data flow changes.
 */
export const PRIVACY_UPDATED = "2026-11-22";

export interface PrivacyBlock {
  h: string;
  p?: string[];
  list?: string[];
}
export interface PrivacyDoc {
  title: string;
  lead: string;
  updated: string;
  blocks: PrivacyBlock[];
  creditsTitle: string;
  credits: { name: string; url: string; what: string }[];
}

const CREDITS_URLS = {
  gtadb: "https://map.gtadb.org",
  og6: "https://github.com/fbritoferreira/gta6",
  intel: "https://gta6intel.com/cheats",
  ccby: "https://creativecommons.org/licenses/by/4.0/",
};

export const PRIVACY: Record<Locale, PrivacyDoc> = {
  en: {
    title: "Privacy",
    lead: "Six Star is a fan project. We collect as little as we can, never sell anything, and say here exactly what is stored and why.",
    updated: "Last updated {date}",
    blocks: [
      {
        h: "What stays on your device",
        p: ["Your progress (what you marked as found), your backup code, the theme, your console choice on the cheats page and similar settings are kept in your browser's storage. They are never sent to us. Clearing your browser data removes them."],
      },
      {
        h: "Pin suggestions",
        list: [
          "When you suggest a pin we store: the category, title, map position, your proof link or screenshot, your note, the name you want credited (optional), the page language and, if you came from a partner page, which partner.",
          "Approved pins are published with the name you gave. Leave the name empty to stay anonymous.",
          "Screenshots are only seen by our moderators and are deleted as soon as the suggestion is approved or rejected.",
          "We do not store your IP address. To stop spam we keep a one-way, salted hash of it that changes every day and cannot be turned back into your address.",
        ],
      },
      {
        h: "E-mail list",
        list: [
          "If you sign up, we store your e-mail address, what you asked for (Online launch alert, weekly digest), the language, the page you signed up on and the time you agreed.",
          "We only send what you ticked. Every e-mail has a one-click unsubscribe link.",
          "We never sell or share your address. When we start sending, an e-mail provider will deliver the messages for us; it will be named here.",
        ],
      },
      {
        h: "Partner pages",
        p: ["Visits to a partner page (/p/…) are counted once per person per day, using the same daily hash as above, so we can tell partners how many people they sent. No IP addresses are kept."],
      },
      {
        h: "Services we use",
        list: [
          "Cloudflare hosts the site and protects it. Cloudflare Web Analytics counts visits without cookies and without tracking you across sites.",
          "Cloudflare Turnstile checks that forms are sent by people, not bots. It runs only on the forms.",
          "YouTube videos load only when you tap play, and then through youtube-nocookie.com.",
          "Fonts are served from our own site; no third-party font requests.",
        ],
      },
      {
        h: "Cookies",
        p: ["We set no cookies. The browser storage described above is not sent with requests and is not used for advertising."],
      },
      {
        h: "Your rights",
        p: [
          "You can ask what we hold about you, ask us to correct it or delete it, and leave the e-mail list at any time. Contact us through our Discord server (link in the footer). We answer within 30 days.",
          "Six Star is not meant for children under 13.",
        ],
      },
    ],
    creditsTitle: "Data sources and credits",
    credits: [
      { name: "GTADB.org", url: CREDITS_URLS.gtadb, what: "Map tiles and landmark data (CC BY 4.0). Region outlines on our map are derived from this data by Six Star." },
      { name: "Open GTA 6 Map (fbritoferreira)", url: CREDITS_URLS.og6, what: "Collectible, activity and service locations, screenshots and coastline (CC BY 4.0). Imported and adapted by Six Star." },
      { name: "GTA 6 Intel", url: CREDITS_URLS.intel, what: "Cheat codes and unlock conditions, shared by its founder for reuse." },
      { name: "Rockstar Games", url: "https://www.rockstargames.com/VI", what: "Grand Theft Auto VI, its names and artwork belong to Rockstar Games and Take-Two Interactive. Six Star is not affiliated with them." },
    ],
  },
  tr: {
    title: "Gizlilik",
    lead: "Six Star bir hayran projesi. Olabildiğince az veri topluyoruz, hiçbir şey satmıyoruz ve neyin neden saklandığını burada açıkça yazıyoruz.",
    updated: "Son güncelleme: {date}",
    blocks: [
      {
        h: "Cihazında kalanlar",
        p: ["İlerlemen (bulundu olarak işaretlediklerin), yedek kodun, tema, hile sayfasındaki konsol seçimin ve benzeri ayarlar tarayıcının depolama alanında tutulur. Bize hiç gönderilmez. Tarayıcı verilerini silersen bunlar da silinir."],
      },
      {
        h: "Pin önerileri",
        list: [
          "Bir pin önerdiğinde şunları saklarız: kategori, başlık, haritadaki konum, kanıt linkin ya da ekran görüntün, notun, anılmak istediğin ad (isteğe bağlı), sayfa dili ve bir partner sayfasından geldiysen hangi partner olduğu.",
          "Onaylanan pinler verdiğin adla yayınlanır. Anonim kalmak için adı boş bırak.",
          "Ekran görüntülerini sadece moderatörlerimiz görür; öneri onaylanır ya da reddedilir edilmez silinir.",
          "IP adresini saklamayız. Spamı önlemek için her gün değişen, geri çevrilemeyen tuzlu bir özetini tutarız; bu özetten adresine ulaşılamaz.",
        ],
      },
      {
        h: "E-posta listesi",
        list: [
          "Kaydolursan e-posta adresini, ne istediğini (Online çıkış haberi, haftalık bülten), dili, kaydolduğun sayfayı ve onay verdiğin zamanı saklarız.",
          "Sadece işaretlediklerini göndeririz. Her e-postada tek tıkla ayrılma bağlantısı vardır.",
          "Adresini asla satmaz ya da paylaşmayız. Gönderime başladığımızda mesajları bizim adımıza bir e-posta hizmeti iletecek; adı burada yazacak.",
        ],
      },
      {
        h: "Partner sayfaları",
        p: ["Bir partner sayfasına (/p/…) yapılan ziyaretler, yukarıdaki günlük özetle kişi başına günde bir kez sayılır; böylece partnerlere kaç kişi gönderdiklerini söyleyebiliriz. IP adresi tutulmaz."],
      },
      {
        h: "Kullandığımız hizmetler",
        list: [
          "Siteyi Cloudflare barındırıyor ve koruyor. Cloudflare Web Analytics ziyaretleri çerez kullanmadan ve seni siteler arasında izlemeden sayar.",
          "Cloudflare Turnstile formların bot değil insan tarafından gönderildiğini kontrol eder. Sadece formlarda çalışır.",
          "YouTube videoları sadece oynat'a dokunduğunda ve youtube-nocookie.com üzerinden yüklenir.",
          "Yazı tipleri kendi sitemizden gelir; üçüncü taraf yazı tipi isteği yoktur.",
        ],
      },
      {
        h: "Çerezler",
        p: ["Hiç çerez kullanmıyoruz. Yukarıda anlatılan tarayıcı depolaması isteklerle gönderilmez ve reklam için kullanılmaz."],
      },
      {
        h: "Hakların",
        p: [
          "Hakkında neyi tuttuğumuzu sorabilir, düzeltilmesini ya da silinmesini isteyebilir, e-posta listesinden istediğin an ayrılabilirsin. Bize Discord sunucumuzdan ulaş (bağlantı alt bilgide). 30 gün içinde cevap veririz.",
          "Six Star 13 yaşından küçükler için değildir.",
        ],
      },
    ],
    creditsTitle: "Veri kaynakları ve atıflar",
    credits: [
      { name: "GTADB.org", url: CREDITS_URLS.gtadb, what: "Harita karoları ve simge yapı verisi (CC BY 4.0). Haritamızdaki bölge sınırları bu veriden Six Star tarafından türetildi." },
      { name: "Open GTA 6 Map (fbritoferreira)", url: CREDITS_URLS.og6, what: "Koleksiyon, aktivite ve hizmet konumları, ekran görüntüleri ve kıyı çizgisi (CC BY 4.0). Six Star tarafından içe aktarılıp uyarlandı." },
      { name: "GTA 6 Intel", url: CREDITS_URLS.intel, what: "Hile kodları ve açılma koşulları; kurucusu yeniden kullanım için paylaştı." },
      { name: "Rockstar Games", url: "https://www.rockstargames.com/VI", what: "Grand Theft Auto VI, adları ve görselleri Rockstar Games ve Take-Two Interactive'e aittir. Six Star onlarla bağlantılı değildir." },
    ],
  },
  es: {
    title: "Privacidad",
    lead: "Six Star es un proyecto de fans. Recogemos lo mínimo, nunca vendemos nada y aquí contamos exactamente qué se guarda y por qué.",
    updated: "Última actualización: {date}",
    blocks: [
      {
        h: "Lo que se queda en tu dispositivo",
        p: ["Tu progreso (lo que marcaste como encontrado), tu código de copia de seguridad, el tema, la consola que elegiste en la página de trucos y ajustes similares se guardan en el almacenamiento de tu navegador. Nunca nos llegan. Si borras los datos del navegador, se borran también."],
      },
      {
        h: "Sugerencias de puntos",
        list: [
          "Cuando sugieres un punto guardamos: la categoría, el título, la posición en el mapa, tu enlace de prueba o captura, tu nota, el nombre con el que quieres aparecer (opcional), el idioma de la página y, si llegaste desde una página de socio, qué socio.",
          "Los puntos aprobados se publican con el nombre que diste. Déjalo vacío para quedar en el anonimato.",
          "Las capturas solo las ven nuestros moderadores y se borran en cuanto la sugerencia se aprueba o se rechaza.",
          "No guardamos tu dirección IP. Para frenar el spam guardamos un resumen cifrado de un solo sentido que cambia cada día y no permite recuperar tu dirección.",
        ],
      },
      {
        h: "Lista de correo",
        list: [
          "Si te apuntas, guardamos tu correo, lo que pediste (aviso del lanzamiento de Online, resumen semanal), el idioma, la página donde te apuntaste y el momento en que diste tu consentimiento.",
          "Solo enviamos lo que marcaste. Cada correo lleva un enlace para darte de baja con un clic.",
          "Nunca vendemos ni compartimos tu correo. Cuando empecemos a enviar, un proveedor de correo entregará los mensajes por nosotros; lo nombraremos aquí.",
        ],
      },
      {
        h: "Páginas de socios",
        p: ["Las visitas a una página de socio (/p/…) se cuentan una vez por persona y día, con el mismo resumen diario de arriba, para poder decirles a los socios cuánta gente enviaron. No se guardan direcciones IP."],
      },
      {
        h: "Servicios que usamos",
        list: [
          "Cloudflare aloja y protege la web. Cloudflare Web Analytics cuenta las visitas sin cookies y sin seguirte entre webs.",
          "Cloudflare Turnstile comprueba que los formularios los envían personas y no bots. Solo funciona en los formularios.",
          "Los vídeos de YouTube solo se cargan cuando pulsas reproducir, y a través de youtube-nocookie.com.",
          "Las fuentes se sirven desde nuestra propia web; no hay peticiones a terceros.",
        ],
      },
      {
        h: "Cookies",
        p: ["No usamos cookies. El almacenamiento del navegador descrito arriba no se envía con las peticiones y no se usa para publicidad."],
      },
      {
        h: "Tus derechos",
        p: [
          "Puedes preguntar qué datos tenemos sobre ti, pedir que los corrijamos o borremos y salir de la lista de correo cuando quieras. Escríbenos a través de nuestro servidor de Discord (enlace en el pie de página). Respondemos en un plazo de 30 días.",
          "Six Star no está pensado para menores de 13 años.",
        ],
      },
    ],
    creditsTitle: "Fuentes de datos y créditos",
    credits: [
      { name: "GTADB.org", url: CREDITS_URLS.gtadb, what: "Teselas del mapa y datos de lugares (CC BY 4.0). Los límites de las regiones de nuestro mapa los deriva Six Star a partir de estos datos." },
      { name: "Open GTA 6 Map (fbritoferreira)", url: CREDITS_URLS.og6, what: "Ubicaciones de coleccionables, actividades y servicios, capturas y costa (CC BY 4.0). Importado y adaptado por Six Star." },
      { name: "GTA 6 Intel", url: CREDITS_URLS.intel, what: "Códigos de trucos y condiciones de desbloqueo, compartidos por su fundador para que se reutilicen." },
      { name: "Rockstar Games", url: "https://www.rockstargames.com/VI", what: "Grand Theft Auto VI, sus nombres y sus ilustraciones pertenecen a Rockstar Games y Take-Two Interactive. Six Star no tiene relación con ellos." },
    ],
  },
};

export const LICENSE_URL = CREDITS_URLS.ccby;

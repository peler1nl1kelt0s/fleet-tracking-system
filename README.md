# Filo Takip Sistemi

Bu proje, gerçek zamanlı filo takibi için tasarlanmış modern bir web uygulamasıdır. Uçakların anlık konumlarını, telemetri verilerini (hız, irtifa) harita üzerinde gösterir, yönetici panelinden duyurular yapılmasına ve sistem konfigürasyonlarının ayarlanmasına olanak tanır.

## Özellikler

- **Gerçek Zamanlı Uçak Takibi:** Uçakların harita üzerinde anlık konumlarını görüntüleme.
- **Detaylı Telemetri:** Seçilen uçağın hız ve irtifa gibi telemetri verilerinin grafiklerle görselleştirilmesi.
- **Yönetici Paneli:** Duyurular gönderme, sohbet senaryolarını ve squawk kodlarını yönetme, sistem konfigürasyonlarını ayarlama.
- **Koyu/Açık Tema Desteği:** Kullanıcı tercihlerine göre tema değiştirme.
- **Duyarlı Tasarım:** Mobil, tablet ve masaüstü cihazlarda sorunsuz kullanıcı deneyimi.
- **Bildirim Sistemi:** Hata ve başarı durumları için kullanıcı dostu toast bildirimleri.

## Teknoloji Yığını

### Ön Uç (Front-end)

Ön uç uygulaması modern web standartları ve araçları kullanılarak geliştirilmiştir.

-   **React:** Kullanıcı arayüzünü oluşturmak için kullanılan popüler bir JavaScript kütüphanesi. Bileşen tabanlı yapısıyla yeniden kullanılabilir ve yönetilebilir UI'lar sağlar.
-   **Vite:** Hızlı geliştirme ortamı ve performanslı üretim derlemeleri için kullanılan yeni nesil bir ön uç geliştirme aracı. Hızlı başlatma süreleri ve anında modül güncellemeleri sunar.
-   **Tailwind CSS:** Utility-first prensibiyle çalışan bir CSS çerçevesi. Hızlı stil geliştirme ve tutarlı tasarım sağlar.
-   **React Router:** Uygulama içinde sayfalar arası navigasyonu yönetmek için kullanılır.
-   **React Leaflet:** Harita bileşenlerini React uygulamalarına entegre etmek için bir kütüphane.
-   **Recharts:** Telemetri verilerini görselleştirmek için kullanılan esnek bir grafik kütüphanesi.
-   **Material-UI (Yönetici Paneli için):** Yönetici paneli için önceden tasarlanmış, erişilebilir ve özelleştirilebilir UI bileşenleri seti sunar.
-   **Lucide React:** Uygulamada kullanılan ikon setini sağlar.

**Neden Bu Teknolojiler?**
React, bileşen tabanlı yapısıyla karmaşık UI'ları yönetmeyi kolaylaştırır. Vite, hızlı geliştirme döngüleri sunarken, Tailwind CSS hızlı ve tutarlı stilizasyon sağlar. Material-UI, yönetici paneli için hazır ve erişilebilir bileşenler sunarak geliştirme hızını artırır. React Router, uygulamayı SPA (Tek Sayfa Uygulaması) olarak yönetmeye yardımcı olurken, React Leaflet ve Recharts gibi kütüphaneler özel görselleştirme ihtiyaçlarını karşılar.

### Arka Uç (Back-end)

Arka uç, verimli ve ölçeklenebilir bir şekilde veri işleme ve gerçek zamanlı iletişim sağlamak üzere tasarlanmıştır.

-   **Node.js & Express.js:** Hızlı, ölçeklenebilir ağ uygulamaları geliştirmek için tercih edilen JavaScript çalışma zamanı ortamı ve web uygulama çerçevesi. API servislerini ve sunucu mantığını sağlar.
-   **Socket.io:** Gerçek zamanlı, çift yönlü ve olay tabanlı iletişim için kullanılan bir kütüphane. Uçak telemetri verilerinin anlık olarak ön uca aktarılmasını sağlar.
-   **Redis:** Verileri hafızada tutarak hızlı erişim sağlayan bir anahtar-değer depolama sistemi. Özellikle önbellekleme ve yayın/abonelik (pub/sub) mekanizmaları için kullanılır.
-   **PostgreSQL:** Güçlü, açık kaynaklı bir ilişkisel veritabanı sistemi. Projenin kalıcı veri depolama ihtiyaçlarını karşılar.
-   **MQTT (Aedes):** Gerçek zamanlı telemetri verilerinin toplanması ve dağıtılması için hafif bir mesajlaşma protokolü ve broker uygulaması.
-   **node-fetch:** Sunucu tarafında HTTP istekleri yapmak için tarayıcı `fetch` API'sinin bir uygulaması.

**Neden Bu Teknolojiler?**
Node.js ve Express.js, JavaScript'in hem ön uçta hem de arka uçta kullanılmasını sağlayarak geliştirme sürecini birleştirir. Socket.io, gerçek zamanlı veri akışı için idealdir. Redis, yüksek performanslı önbellekleme ve pub/sub yetenekleri sunarken, PostgreSQL güvenilir ve yapısal veri depolama sağlar. MQTT, telemetri verileri gibi IoT senaryoları için düşük bant genişliği ve güvenilirlik sunar.

## Kurulum (Installation)

Projenin kurulum adımları için [installation.md](installation.md) dosyasına göz atın.

# Kurulum Rehberi

Bu rehber, Filo Takip Sistemi projesini yerel geliştirme ortamınızda nasıl kuracağınızı ve çalıştıracağınızı açıklar.

## Ön Gereksinimler

Projenin başarıyla kurulabilmesi ve çalışabilmesi için sisteminizde aşağıdaki yazılımların yüklü olması gerekmektedir:

-   **Git:** Proje kaynak kodunu indirmek için.
-   **Node.js (LTS sürümü önerilir):** JavaScript çalışma zamanı ortamı. `npm` paket yöneticisi Node.js ile birlikte gelir.
-   **Docker ve Docker Compose:** PostgreSQL, Redis ve MQTT broker gibi servisleri çalıştırmak için.
-   **pnpm:** Paket bağımlılıklarını yönetmek için `npm` yerine `pnpm` kullanılması önerilir.
    ```bash
    npm install -g pnpm
    ```

## 1. Projeyi Klonlayın

İlk olarak, proje deposunu yerel makinenize klonlayın:

```bash
git clone https://github.com/your-username/fleet-tracking-system.git
cd fleet-tracking-system
```
_(Lütfen `your-username/fleet-tracking-system.git` kısmını projenin gerçek depo URL'si ile değiştirin.)_

## 2. Arka Uç (Back-end) Kurulumu ve Çalıştırma

Arka uç servisi, veritabanı, Redis ve MQTT broker gibi bağımlılıkları Docker Compose ile yönetilir.

```bash
# back-end dizinine gidin
cd back-end

# Bağımlılıkları yükleyin
pnpm install

# .env dosyasını yapılandırın (örnek: .env.example dosyasından kopyalayabilirsiniz)
cp .env.example .env

# Docker Compose servislerini başlatın (PostgreSQL, Redis, Aedes MQTT)
# Docker Compose'un kurulu ve çalışır olduğundan emin olun.
docker compose up -d

# Veritabanını başlatın ve gerekirse migrasyonları çalıştırın
# (Veritabanı başlatıldıktan sonra, bazen birkaç saniye beklemeniz gerekebilir.)
# Bu komutlar `database` klasöründeki init.sql ve migration.sql'i kullanacaktır.
# back-end/src/db/index.js veya back-end/src/server.js içinde db bağlantısı ve init mantığı olmalıdır.
# Uygulamanın kendi içindeki veritabanı başlatma/migrasyon komutunu kullanın.
# Eğer böyle bir komut yoksa, direkt arka ucu başlatın,
# uygulama otomatik olarak veritabanı bağlantısını kuracaktır.

# Arka uç servisini başlatın
pnpm start

# Tarayıcınızda http://localhost:3000 adresinden erişilebilir olacaktır (eğer front-end'i de bu porta yönlendirdiyseniz).
```

## 3. Ön Uç (Front-end) Kurulumu ve Çalıştırma

Ön uç uygulaması bir React projesidir ve Vite ile geliştirilmiştir.

```bash
# Projenin kök dizinine geri dönün
cd ..

# front-end dizinine gidin
cd front-end/fleet-tracking-system

# Bağımlılıkları yükleyin
pnpm install

# Geliştirme sunucusunu başlatın
pnpm run dev

# Uygulama tarayıcınızda genellikle http://localhost:5173 adresinde açılacaktır (Vite'ın varsayılan portu).
# Eğer back-end servisi farklı bir adreste çalışıyorsa (örn: http://localhost:3000),
# ön uç uygulamasının `import.meta.env.PROD ? '/' : 'http://localhost:3000'` gibi bir konfigürasyonda
# doğru back-end adresini işaret ettiğinden emin olun.
```

## 4. Projeyi Derleme (Production Build)

Üretim için projeyi derlemek isterseniz:

```bash
# back-end dizini
cd back-end
pnpm install
pnpm run build # Eğer bir build script'i varsa

# front-end dizini
cd ../front-end/fleet-tracking-system
pnpm install
pnpm run build
```
Bu komutlar, `dist` klasörüne optimize edilmiş üretim dosyalarını oluşturacaktır.

---
**Not:** `.env.example` dosyasını kopyaladıktan sonra, içinde bulunan değişkenleri (örneğin veritabanı bağlantı bilgileri, API anahtarları vb.) kendi ortamınıza göre düzenlemeniz gerekebilir.

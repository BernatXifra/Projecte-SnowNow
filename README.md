# ❄️ SnowNow

> **Plataforma mòbil integral per a estacions d'esquí**  
> Projecte acadèmic per a l'assignatura de **Sistemes de Gestió de Bases de Dades (SGBD)**.

---

## 📌 1. Resum Executiu del Projecte

- **Nom del producte:** SnowNow (anteriorment SnowPulse 360).
- **Objectiu:** Crear una plataforma mòbil per a estacions d'esquí que unifiqui la gestió operativa en temps real amb l'experiència digital de l'esquiador.
- **Enfocament de l'equip:** El projecte integra 4 mòduls funcionals interconnectats sobre una mateixa infraestructura no relacional per distribuir el treball equitativament entre els 5 integrants del grup.

---

## 🗄️ 2. SGBD Escollit i Justificació Tècnica

- **SGBD Escollit:** MongoDB (Sistema de Gestió de Bases de Dades Orientat a Documents / JSON) allotjat a **MongoDB Atlas (AWS - M0 Free Tier)**.
- **Justificació respecte al model relacional:**
  - **Flexibilitat d'Esquema (*Schema-Free*):** Permet emmagatzemar l'inventari de lloguer heterogeni (esquís, botes, cascs, taules) amb atributs propis i dinàmics sense taules intermèdies buides ni columnes nul·les.
  - **Consultes Geoespacials (`2dsphere`):** Permet indexar i filtrar les coordenades GPS dels esquiadors en format GeoJSON sobre les pistes en temps real.
  - **Processament de Rànquings i Analítica (*Aggregation Framework*):** Permet calcular taules de classificació (*leaderboards*) de velocitat i distància mitjançant canonades d'agregació optimitzades.
  - **Actualitzacions en Temps Real (*Change Streams*):** Permet escoltar canvis d'estat a pistes i cues de remuntadors directament des del conjunt de rèpliques i notificar l'aplicació sense necessitat de sondeig continu (*polling*).

---

## 🚀 3. Definició del MVP (Mòduls Funcionals)

1. **Mòdul 1: Estat de Pistes i Remuntadors en Temps Real**
   - Tauler d'administració per obrir/tancar pistes o actualitzar temps d'espera dels remuntadors.
   - Notificació instantània als usuaris mitjançant **Change Streams** de MongoDB.

2. **Mòdul 2: Cercador i Comparador d'Estacions i Pistes**
   - Cerca avançada i filtratge multidimensional per dificultat, tipus de neu, visibilitat i serveis.
   - Utilització d'índexs de text i consultes complexes amb l'**Aggregation Framework**.

3. **Mòdul 3: Telemetria GPS i Rànquing d'Esquiadors**
   - Registre de trajectòries que rep coordenades GPS i velocitat durant la jornada.
   - Generació d'una taula de classificació (*leaderboard*) diària utilitzant índexs **`2dsphere`**.

4. **Mòdul 4: Gestió i Lloguer de Material Heterogeni**
   - Catàleg d'equipament multiformat amb atributs variables per categoria.
   - Reserva i assignació automàtica segons les característiques antropomètriques de l'usuari.

---

## 👥 4. Repartiment de Treball per a l'Equip (5 Persones)

- **Integrant 1 (Backend - Estat de Pistes & Change Streams):**
  - Disseny de la col·lecció `slopes_and_lifts`.
  - Implementació de l'API i la reactivitat en temps real mitjançant Change Streams de MongoDB.
- **Integrant 2 (Backend - Cercador & Aggregations):**
  - Disseny de la col·lecció `resorts`.
  - Implementació d'índexs de text i canonades d'agregació per a cerques i mètriques.
- **Integrant 3 (Backend - Telemetria & Consultes Geoespacials):**
  - Disseny de la col·lecció `skier_sessions`.
  - Implementació d'índexs geoespacials `2dsphere` i càlcul de rànquings diaris.
- **Integrant 4 (Backend - Inventari Heterogeni de Lloguer):**
  - Disseny de la col·lecció `rental_inventory` amb model *schema-free*.
  - Lògica de validació, compatibilitat de talles i registre de reserves.
- **Integrant 5 (Frontend Mòbil, Desplegament & Coordinació Demo):**
  - Desenvolupament de la interfície d'usuari a React Native/Expo.
  - Empaquetament amb Docker per a proves de laboratori i coordinació tècnica de la presentació.

---

## 🛠️ 5. Stack Tecnològic

- **Base de Dades:** MongoDB Atlas (AWS, M0 Sandbox Free Tier, Replica Set).
- **Backend API:** Node.js, Express, TypeScript, Mongoose, `tsx`.
- **Frontend Mòbil:** React Native, Expo (TypeScript), Expo Go.
- **Contenització / Desplegament:** Docker.

---

## 📁 6. Estructura del Repositori

```text
SnowNow/
├── snownow-backend/       # Servidor REST API i lògica de MongoDB
│   ├── src/
│   │   ├── models/        # Esquemes de Mongoose de les 4 col·leccions
│   │   ├── routes/        # Rutes i controladors de l'API
│   │   └── index.ts       # Punt d'entrada del servidor Express
│   ├── .env               # Variables d'entorn locals (ignorat a Git)
│   ├── package.json
│   └── tsconfig.json
│
├── snownow-mobile/        # Aplicació mòbil React Native (Expo)
│   ├── App.tsx            # Component principal de l'aplicació
│   ├── app.json           # Configuració d'Expo
│   ├── package.json
│   └── tsconfig.json
│
├── .gitignore             # Filtre de dependències i fitxers sensibles
└── README.md              # Documentació general del projecte
```

---

## 🗃️ 7. Model de Dades (Col·leccions)

- **`slopes_and_lifts`**: Estat d'obertura, dificultat i cues en pistes (utilitza *Change Streams*).
- **`resorts`**: Característiques de l'estació, serveis i metres esquiables (índexs de cerca i agregacions).
- **`skier_sessions`**: Telemetria, velocitats i punts GPS en format GeoJSON (*índex 2dsphere*).
- **`rental_inventory`**: Catàleg de material heterogeni (esquís, cascs, botes) amb atributs flexibles (*Schema-Free*).

---

## ⚙️ 8. Guia d'Instal·lació i Execució

### Requisits Previs
- **Node.js** instal·lat (v18 o superior).
- **Git** instal·lat.
- L'aplicació **Expo Go** instal·lada al telèfon mòbil (iOS o Android).

---

### Pas 1: Clonar el repositori
```bash
git clone https://github.com/Pujiiiii/Projecte-SnowNow.git
cd SnowNow
```

---

### Pas 2: Configuració i arrencada del Backend (`snownow-backend`)

1. Entra a la carpeta del backend:
   ```bash
   cd snownow-backend
   ```
2. Instal·la les dependències del servidor:
   ```bash
   npm install
   ```
3. Crea un fitxer anomenat `.env` a l'arrel de `snownow-backend`:
   ```env
   PORT=5000
   MONGO_URI=mongodb+srv://<usuari>:<contrasenya>@cluster0.xxxx.mongodb.net/snownow_db?retryWrites=true&w=majority
   ```
   *(Substitueix `<usuari>`, `<contrasenya>` i el subdomini per les teves dades d'accés a MongoDB Atlas).*

4. Inicia el servidor amb recàrrega automàtica:
   ```bash
   npm run dev
   ```
   *Sortida esperada per consola:*
   ```text
   ✅ Connectat correctament a MongoDB Atlas (SnowNow)
   🚀 Servidor backend escoltant al port 5000
   ```

---

### Pas 3: Configuració i arrencada de l'App Mòbil (`snownow-mobile`)

1. Obre una **segona terminal** i entra al directori de l'app mòbil:
   ```bash
   cd SnowNow/snownow-mobile
   ```
2. Instal·la les dependències mòbils:
   ```bash
   npm install
   ```
3. Executa Metro Bundler en mode túnel:
   ```bash
   npx expo start --tunnel
   ```
4. Obre l'aplicació al mòbil:
   - **Android:** Obre l'aplicació **Expo Go**, prem **Scan QR code** i escaneja el codi del terminal.
   - **iOS (iPhone):** Obre l'aplicació nativa de la **Càmera**, enfoca el codi QR i toca la notificació groga per obrir-lo amb Expo Go.

---

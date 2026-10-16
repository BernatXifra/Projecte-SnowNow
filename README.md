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

## 📊 7. Esquemes JSON de les Col·leccions

### Col·lecció 1: `slopes_and_lifts` (Mòdul 1)
```json
{
  "_id": "pista_aliga_01",
  "name": "Àliga",
  "type": "slope",
  "difficulty": "black",
  "status": "closed",
  "closure_reason": "Vent fort a cota alta",
  "snow_type": "hard_pack",
  "last_updated": "2026-10-15T09:00:00Z"
}
```

### Col·lecció 2: `resorts` (Mòdul 2)
```json
{
  "_id": "grandvalira",
  "name": "Grandvalira Resorts",
  "location": {
    "region": "Andorra",
    "country": "AD"
  },
  "total_km": 210,
  "services": ["wifi", "restaurant", "ski_school", "snowpark"],
  "open_slopes_count": 85,
  "snow_quality": "powder"
}
```

### Col·lecció 3: `skier_sessions` (Mòdul 3)
```json
{
  "_id": "session_user_42_20261015",
  "user_id": "marc_42",
  "resort_id": "grandvalira",
  "date": "2026-10-15",
  "current_location": {
    "type": "Point",
    "coordinates": [1.7333, 42.5406]
  },
  "max_speed_kmh": 68.4,
  "total_distance_km": 24.2
}
```

### Col·lecció 4: `rental_inventory` (Mòdul 4)
```json
{
  "_id": "mat_9812",
  "category": "skis",
  "brand": "Atomic",
  "model": "Redster S9",
  "status": "available",
  "attributes": {
    "length_cm": 165,
    "turning_radius_m": 12.5,
    "level": "expert"
  }
}
```

---

## ⚙️ 8. Guia d'Instal·lació i Execució

### Requisits Previs
- **Node.js** instal·lat (v18 o superior).
- **Git** instal·lat.
- L'aplicació **Expo Go** instal·lada al telèfon mòbil (iOS o Android).

---

### Pas 1: Clonar el repositori
```bash
git clone https://github.com/<el-teu-usuari>/SnowNow.git
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

## 🎤 9. Estratègia de la Presentació i Demostració en Viu

Estructura temporal establerta per a l'avaluació (45 minuts de presentació + 15 minuts de preguntes):

1. **Part 1: Presentació de la Idea i Model de Negoci (10 min):**
   - Contextualització del repte a les estacions d'esquí i proposta de valor de SnowNow.
2. **Part 2: Explicació Teòrica de la Tecnologia (15 min):**
   - Justificació de MongoDB vs bases de dades SQL relacionals.
   - Modelat de documents JSON, funcionament d'índexs `2dsphere`, índexs de text i Change Streams.
3. **Part 3: Demostració en Viu (20 min):**
   - **Prova 1:** Modificació d'estat d'una pista a "Tancada per vent" i recepció immediata al mòbil via Change Streams.
   - **Prova 2:** Cerca complexa de pistes aplicant filtres de dificultat i qualitat de la neu mitjançant agregacions.
   - **Prova 3:** Enviament de telemetria GPS amb reordenació dinàmica del rànquing de velocitat.
   - **Prova 4:** Registre d'un nou article de lloguer amb atributs heterogenis i reserva associada.
4. **Torn de Preguntes (15 min):**
   - Defensiva tècnica davant del tribunal i resposta a consultes sobre el disseny de la base de dades.

---

## 📦 10. Entregables del Projecte

- **Presentació:** Diapositives digitals d'exposició teòrica i funcional.
- **Codi Font:** Repositori complet a GitHub amb frontend, backend i scripts de càrrega de dades inicials.
- **Entorn de Desplegament:** Configuració Docker per a l'aixecament reproduïble dels serveis.
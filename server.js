require("dotenv").config();
const express = require("express"), bcrypt = require("bcryptjs"), jwt = require("jsonwebtoken");
const { DatabaseSync } = require("node:sqlite");
const crypto = require("crypto");
const E = process.env, PORT = E.PORT || 3000, BASE = E.BASE_URL || `http://localhost:${PORT}`;
if (!E.JWT_SECRET || E.JWT_SECRET.length < 16) { console.error("Defina JWT_SECRET (16+ caracteres) no arquivo .env"); process.exit(1); }

/* ---------- Banco (SQLite) ---------- */
// SQLite nativo do Node.js 24: elimina better-sqlite3 e a necessidade de compilar C++.
const nodeMajor = Number(process.versions.node.split(".")[0]);
if (nodeMajor < 24) {
  console.error(`Este projeto requer Node.js 24 ou superior. Versão atual: ${process.version}`);
  process.exit(1);
}
const db = new DatabaseSync(E.DB_FILE || "praia.db");
db.exec("PRAGMA journal_mode = WAL;");
db.exec(`
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE, phone TEXT, pass_hash TEXT, fb_id TEXT UNIQUE, g_id TEXT UNIQUE, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS resets(token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL, expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS orders(id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL, place_id TEXT NOT NULL, name TEXT, address TEXT, url TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, UNIQUE(user_id,place_id));`);

// Modo de demonstração local. Nunca equivale a uma autenticação real do Google/Facebook.
const DEMO_MODE = String(E.DEMO_MODE || (E.NODE_ENV === "production" ? "false" : "true")).toLowerCase() === "true";
if (DEMO_MODE) {
  const demoHash = bcrypt.hashSync("teste01", 10);
  db.prepare(`INSERT INTO users(name,email,phone,pass_hash)
    VALUES(?,?,?,?)
    ON CONFLICT(email) DO UPDATE SET name=excluded.name, phone=excluded.phone, pass_hash=excluded.pass_hash`)
    .run("Conta de Demonstração", "teste01@gmail.com", "(81) 99999-0000", demoHash);
}

/* ---------- Helpers ---------- */
const app = express(); app.use(express.json({ limit: "50kb" })); app.set("trust proxy", 1);
const clean = s => String(s || "").trim(), okEmail = e => /^\S+@\S+\.\S+$/.test(e);
const sign = u => jwt.sign({ id: u.id }, E.JWT_SECRET, { expiresIn: "30d" });
const pub = u => ({ id: u.id, name: u.name, email: u.email, phone: u.phone, hasPassword: !!u.pass_hash });
const getUser = id => db.prepare("SELECT * FROM users WHERE id=?").get(id);
const bad = (res, m, code = 400) => res.status(code).json({ error: m });
const hits = new Map();
const limit = max => (req, res, next) => {
  const k = req.ip + req.path, now = Date.now(), h = (hits.get(k) || []).filter(t => now - t < 9e5);
  if (h.length >= max) return bad(res, "Muitas tentativas. Aguarde alguns minutos.", 429);
  h.push(now); hits.set(k, h); next();
};
const auth = (req, res, next) => {
  try { req.uid = jwt.verify((req.headers.authorization || "").replace("Bearer ", ""), E.JWT_SECRET).id; if (!getUser(req.uid)) throw 0; next(); }
  catch (e) { bad(res, "Sessão inválida. Faça login novamente.", 401); }
};

/* ---------- Config pública ---------- */
const LOC = { name: E.BEACH_NAME || "Praia de Boa Viagem, Recife", lat: +(E.BEACH_LAT || -8.1186), lon: +(E.BEACH_LON || -34.9006), radius: +(E.BEACH_RADIUS || 2500) };
const P = {
  facebook: { id: E.FB_APP_ID, secret: E.FB_APP_SECRET, auth: "https://www.facebook.com/v27.0/dialog/oauth", token: "https://graph.facebook.com/v27.0/oauth/access_token", info: "https://graph.facebook.com/v27.0/me?fields=id,name,email", scope: "public_profile,email" },
  google: { id: E.GOOGLE_CLIENT_ID, secret: E.GOOGLE_CLIENT_SECRET, auth: "https://accounts.google.com/o/oauth2/v2/auth", token: "https://oauth2.googleapis.com/token", info: "https://openidconnect.googleapis.com/v1/userinfo", scope: "openid email profile" }
};
app.get("/api/config", (req, res) => res.json({ facebook: !!P.facebook.id && !!P.facebook.secret, google: !!P.google.id && !!P.google.secret, placesSource: E.GOOGLE_PLACES_KEY ? "Google Places" : "OpenStreetMap", assistantEnabled: !!E.OPENAI_API_KEY, demoMode: DEMO_MODE, loc: LOC }));

/* ---------- Conta e login ---------- */
app.post("/api/signup", limit(20), (req, res) => {
  const b = req.body, name = clean(b.name), email = clean(b.email).toLowerCase(), phone = clean(b.phone), pass = String(b.pass || "");
  if (name.length < 2) return bad(res, "Informe seu nome.");
  if (!okEmail(email)) return bad(res, "Informe um e-mail válido.");
  if (phone.replace(/\D/g, "").length < 10) return bad(res, "Informe o telefone com DDD.");
  if (pass.length < (DEMO_MODE ? 7 : 8)) return bad(res, DEMO_MODE ? "A senha precisa ter pelo menos 7 caracteres no modo demonstração." : "A senha precisa ter pelo menos 8 caracteres.");
  if (!b.terms) return bad(res, "Você precisa concordar com os Termos de Uso.");
  if (db.prepare("SELECT 1 FROM users WHERE email=?").get(email)) return res.status(409).json({ error: "Já existe uma conta com este e-mail. Faça login.", exists: true });
  const r = db.prepare("INSERT INTO users(name,email,phone,pass_hash) VALUES(?,?,?,?)").run(name, email, phone, bcrypt.hashSync(pass, 10));
  const u = getUser(r.lastInsertRowid); res.json({ token: sign(u), user: pub(u) });
});
app.post("/api/demo-social", limit(20), (req, res) => {
  if (!DEMO_MODE) return bad(res, "O modo de demonstração está desativado.", 404);
  const provider = clean(req.body.provider).toLowerCase();
  if (!["google", "facebook"].includes(provider)) return bad(res, "Provedor de demonstração inválido.");
  const u = db.prepare("SELECT * FROM users WHERE email=?").get("teste01@gmail.com");
  if (!u) return bad(res, "A conta de demonstração não foi encontrada.", 500);
  res.json({ token: sign(u), user: pub(u), demo: true, provider });
});

app.post("/api/login", limit(20), (req, res) => {
  const u = db.prepare("SELECT * FROM users WHERE email=?").get(clean(req.body.email).toLowerCase());
  if (!u || !u.pass_hash || !bcrypt.compareSync(String(req.body.pass || ""), u.pass_hash)) return bad(res, "E-mail ou senha incorretos.", 401);
  res.json({ token: sign(u), user: pub(u) });
});
app.get("/api/me", auth, (req, res) => res.json({ user: pub(getUser(req.uid)) }));
app.put("/api/me", auth, (req, res) => {
  const name = clean(req.body.name), email = clean(req.body.email).toLowerCase() || null, phone = clean(req.body.phone);
  if (name.length < 2) return bad(res, "Informe seu nome.");
  if (email && !okEmail(email)) return bad(res, "Informe um e-mail válido.");
  if (email && db.prepare("SELECT 1 FROM users WHERE email=? AND id<>?").get(email, req.uid)) return bad(res, "Este e-mail já está em uso.", 409);
  db.prepare("UPDATE users SET name=?,email=?,phone=? WHERE id=?").run(name, email, phone, req.uid);
  res.json({ user: pub(getUser(req.uid)) });
});
app.post("/api/me/password", auth, limit(10), (req, res) => {
  const u = getUser(req.uid), next = String(req.body.next || "");
  if (u.pass_hash && !bcrypt.compareSync(String(req.body.current || ""), u.pass_hash)) return bad(res, "Senha atual incorreta.");
  if (next.length < 8) return bad(res, "A nova senha precisa ter pelo menos 8 caracteres.");
  db.prepare("UPDATE users SET pass_hash=? WHERE id=?").run(bcrypt.hashSync(next, 10), req.uid); res.json({ ok: true });
});

/* ---------- Esqueci a senha ---------- */
const sha = s => crypto.createHash("sha256").update(s).digest("hex");
app.post("/api/forgot", limit(5), (req, res) => {
  const u = db.prepare("SELECT * FROM users WHERE email=?").get(clean(req.body.email).toLowerCase());
  const out = { ok: true };
  if (u) {
    const t = crypto.randomBytes(32).toString("hex");
    db.prepare("INSERT INTO resets VALUES(?,?,?)").run(sha(t), u.id, Date.now() + 36e5);
    const link = `${BASE}/#reset=${t}`;
    console.log(`[reset de senha] ${u.email}: ${link}`); // troque por envio de e-mail (SMTP/SendGrid) em produção
    if (E.NODE_ENV !== "production") out.devLink = link;
  }
  res.json(out);
});
app.post("/api/reset", limit(10), (req, res) => {
  const r = db.prepare("SELECT * FROM resets WHERE token_hash=? AND expires>?").get(sha(String(req.body.token || "")), Date.now());
  if (!r) return bad(res, "Link inválido ou expirado.");
  if (String(req.body.pass || "").length < 8) return bad(res, "A senha precisa ter pelo menos 8 caracteres.");
  db.prepare("UPDATE users SET pass_hash=? WHERE id=?").run(bcrypt.hashSync(String(req.body.pass), 10), r.user_id);
  db.prepare("DELETE FROM resets WHERE user_id=?").run(r.user_id); res.json({ ok: true });
});

/* ---------- Login com Facebook e Google (OAuth 2.0) ---------- */
const cookie = (req, n) => ((req.headers.cookie || "").split("; ").find(c => c.startsWith(n + "=")) || "").slice(n.length + 1);
app.get("/auth/:p", (req, res) => {
  if (DEMO_MODE && ["google", "facebook"].includes(req.params.p)) {
    return res.redirect("/#demo_provider=" + req.params.p);
  }
  const p = P[req.params.p];
  if (!p || !p.id || !p.secret) return res.redirect("/#oauth_error=" + encodeURIComponent("Login social não configurado no servidor (.env)."));
  const st = crypto.randomBytes(16).toString("hex");
  res.setHeader("Set-Cookie", `oauth_state=${st}; HttpOnly; SameSite=Lax; Path=/; Max-Age=600`);
  res.redirect(p.auth + "?" + new URLSearchParams({ client_id: p.id, redirect_uri: `${BASE}/auth/${req.params.p}/callback`, response_type: "code", scope: p.scope, state: st }));
});
app.get("/auth/:p/callback", async (req, res) => {
  const k = req.params.p, p = P[k], fail = m => res.redirect("/#oauth_error=" + encodeURIComponent(m));
  try {
    if (!p || !p.id) return fail("Login social não configurado.");
    if (!req.query.code || req.query.state !== cookie(req, "oauth_state")) return fail("Login cancelado ou inválido.");
    const t = await (await fetch(p.token, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: p.id, client_secret: p.secret, code: req.query.code, redirect_uri: `${BASE}/auth/${k}/callback`, grant_type: "authorization_code" }) })).json();
    if (!t.access_token) return fail("Não foi possível entrar com " + k + ".");
    const i = await (await fetch(p.info + (k === "facebook" ? "&access_token=" + t.access_token : ""), { headers: { Authorization: "Bearer " + t.access_token } })).json();
    const pid = String(i.id || i.sub || ""); if (!pid) return fail("Resposta inválida do provedor.");
    const email = i.email ? String(i.email).toLowerCase() : null, col = k === "facebook" ? "fb_id" : "g_id";
    let u = db.prepare(`SELECT * FROM users WHERE ${col}=?`).get(pid);
    if (!u && email) { u = db.prepare("SELECT * FROM users WHERE email=?").get(email); if (u) db.prepare(`UPDATE users SET ${col}=? WHERE id=?`).run(pid, u.id); }
    if (!u) u = getUser(db.prepare(`INSERT INTO users(name,email,${col}) VALUES(?,?,?)`).run(i.name || "Usuário", email, pid).lastInsertRowid);
    res.redirect("/#token=" + sign(u));
  } catch (e) { console.error(e); fail("Erro ao entrar com " + k + "."); }
});

/* ---------- Pedidos (locais salvos pelo usuário) ---------- */
app.get("/api/orders", auth, (req, res) => res.json({ orders: db.prepare("SELECT place_id id,name n,address a,url FROM orders WHERE user_id=? ORDER BY id DESC").all(req.uid) }));
app.post("/api/orders", auth, (req, res) => {
  const b = req.body; if (!clean(b.id) || !clean(b.n)) return bad(res, "Dados do local ausentes.");
  db.prepare("INSERT OR IGNORE INTO orders(user_id,place_id,name,address,url) VALUES(?,?,?,?,?)").run(req.uid, clean(b.id).slice(0, 120), clean(b.n).slice(0, 200), clean(b.a).slice(0, 300), clean(b.url).slice(0, 500)); res.json({ ok: true });
});
app.delete("/api/orders/:id", auth, (req, res) => { db.prepare("DELETE FROM orders WHERE user_id=? AND place_id=?").run(req.uid, req.params.id); res.json({ ok: true }); });


/* ---------- Catálogo de referência: Boa Viagem ---------- */
/* Complementa o OpenStreetMap para garantir resultados úteis no bairro.
   Endereços e presença devem ser revisados periodicamente pelo administrador. */
const BOA_VIAGEM_PLACES = [
  ["local-entreamigos-praia","Entre Amigos Praia","Comida","Av. Boa Viagem, 760 - Boa Viagem, Recife - PE"],
  ["local-bode-no","Bode do Nô Boa Viagem","Comida","Rua Dr. João Guilherme Pontes Sobrinho, 245 - Boa Viagem, Recife - PE"],
  ["local-bar-cuscuz","Bar do Cuscuz","Comida","Av. Fernando Simões Barbosa, 170 - Boa Viagem, Recife - PE"],
  ["local-entreamigos-bode","Entre Amigos O Bode","Comida","Rua Marquês de Valença, 50 - Boa Viagem, Recife - PE"],
  ["local-parraxaxa","Parraxaxá","Comida","Av. Fernando Simões Barbosa, 1200 - Boa Viagem, Recife - PE"],
  ["local-chica-pitanga","Chica Pitanga","Comida","Rua Petrolina, 19 - Boa Viagem, Recife - PE"],
  ["local-ilha-navegantes","Ilha dos Navegantes","Comida","Rua Antônio Falcão, 55 - Boa Viagem, Recife - PE"],
  ["local-ponteio","Ponteio Churrascaria","Comida","Av. Visconde de Jequitinhonha, 138 - Boa Viagem, Recife - PE"],
  ["local-cia-chopp","Cia do Chopp","Comida","Av. Conselheiro Aguiar, 2775 - Boa Viagem, Recife - PE"],
  ["local-alphaiate","Cervejaria Alphaiate","Comida","Rua Artur Muniz, 82 - Boa Viagem, Recife - PE"],
  ["local-quiosque44","Quiosque 44","Comida","Av. Boa Viagem, 5600 - Boa Viagem, Recife - PE"],
  ["local-quiosque13","Quiosque 13","Comida","Av. Boa Viagem, Quiosque 13 - Boa Viagem, Recife - PE"],
  ["local-tapiocas-se","Tapiocas da Sé","Comida","Av. Boa Viagem, 5526 - Boa Viagem, Recife - PE"],
  ["local-quiosque51","Quiosque 51","Comida","Av. Boa Viagem, Calçadão, Quiosque 51 - Recife - PE"],
  ["local-pingo-tent","Barraca do Pingo","Comida","Av. Boa Viagem, 940 - Boa Viagem, Recife - PE"],
  ["local-manu-tenorio","Manu Tenório - Culinária Saudável","Comida","Rua Amazonas, 42 - Boa Viagem, Recife - PE"],
  ["local-voar","Voar Restaurante","Comida","Rua Baltazar Pereira, 130 - Boa Viagem, Recife - PE"],
  ["local-mingus","Mingus","Comida","Rua do Atlântico, 102 - Boa Viagem, Recife - PE"],
  ["local-giro-praia","Giro Praia Bar e Restaurante","Comida","Rua dos Navegantes, 2277 - Boa Viagem, Recife - PE"],
  ["local-pilo-cucina","Pilo Cucina","Comida","Rua Dhalia, 67 - Boa Viagem, Recife - PE"]
].map(([id,n,c,a]) => ({
  id, n, c, t:"Serviço", a, d:null, kiosk:/quiosque|barraca/i.test(n),
  url:"https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(n+" "+a),
  src:"curated"
}));

app.post("/api/chat", auth, limit(30), async (req, res) => {
  const message = clean(req.body.message);
  if (!message) return bad(res, "Digite uma pergunta.");
  if (message.length > 4000) return bad(res, "A pergunta deve ter até 4.000 caracteres.");
  if (!E.OPENAI_API_KEY) {
    return res.status(503).json({
      error: "O assistente geral ainda não foi ativado. Configure OPENAI_API_KEY no arquivo .env e reinicie o servidor. As consultas locais de clima e estabelecimentos continuam disponíveis."
    });
  }
  const history = Array.isArray(req.body.history) ? req.body.history.slice(-12) : [];
  const safeHistory = history
    .filter(x => x && ["user","assistant"].includes(x.role) && typeof x.content === "string")
    .map(x => ({ role:x.role, content:x.content.slice(0,3000) }));
  const weather = req.body.weather && typeof req.body.weather === "object" ? req.body.weather : null;
  const places = BOA_VIAGEM_PLACES.slice(0,20).map(p => `${p.n} — ${p.a}`).join("\n");
  const instructions = [
    "Você é o assistente virtual do Praia Fácil, em português brasileiro, cordial, objetivo e útil.",
    "Responda perguntas gerais de forma ampla, não apenas sobre praia. Se não souber ou não puder verificar algo, diga isso claramente.",
    "Não invente fatos, preços, horários, avaliações, disponibilidade, endereços ou condições em tempo real.",
    "Para perguntas sobre Boa Viagem, use o catálogo de referência abaixo como sugestões e avise que horários e funcionamento devem ser confirmados antes da visita.",
    "Para clima, use somente os dados meteorológicos fornecidos; não afirme que são previsão para outro local.",
    "Não afirme que mar, balneabilidade, marés ou segurança para banho estão verificados se esses dados não forem fornecidos.",
    "Se a pergunta exigir informação atualizada que você não possui, oriente o usuário a consultar uma fonte oficial ou atualizada.",
    "Catálogo de referência de Boa Viagem:\n"+places,
    "Dados meteorológicos disponíveis nesta sessão:\n"+(weather?JSON.stringify(weather):"Não fornecidos.")
  ].join("\n\n");
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method:"POST",
      headers:{ "Authorization":"Bearer "+E.OPENAI_API_KEY, "Content-Type":"application/json" },
      body:JSON.stringify({
        model:E.OPENAI_MODEL || "gpt-6.2-astra",
        instructions,
        input:[...safeHistory,{role:"user",content:message}],
        max_output_tokens:700,
        tools:[{type:"web_search"}]
      }),
      signal:AbortSignal.timeout(45000)
    });
    const data = await response.json().catch(()=>({}));
    if (!response.ok) {
      console.error("OpenAI API:", response.status, data.error?.message || "erro");
      return bad(res, response.status===401 ? "A chave da IA é inválida. Confira OPENAI_API_KEY no .env." : "Não consegui consultar o assistente agora. Verifique a chave, os créditos e tente novamente.", 502);
    }
    const answer = data.output_text || (data.output||[]).flatMap(o=>o.content||[]).filter(c=>c.type==="output_text").map(c=>c.text).join("\n");
    if (!answer) return bad(res, "O assistente não retornou uma resposta. Tente novamente.", 502);
    res.json({ answer });
  } catch (e) {
    console.error("Falha no assistente:", e.message);
    bad(res, "Não foi possível conectar ao assistente. Verifique sua internet e tente novamente.", 502);
  }
});

/* ---------- Locais reais: lojas, quiosques, passeios ---------- */
const dist = (la, lo, a, b) => { const r = Math.PI / 180; return Math.round(Math.hypot((lo - b) * r * Math.cos(a * r), (la - a) * r) * 6371000); };
async function overpass(lat, lon, r) {
  const a = `(around:${r},${lat},${lon})`;
  const q = `[out:json][timeout:25];(nwr${a}["amenity"~"^(restaurant|bar|cafe|fast_food|ice_cream|pub)$"]["name"];nwr${a}["shop"]["name"];nwr${a}["tourism"~"^(attraction|viewpoint|museum)$"]["name"];nwr${a}["amenity"="bicycle_rental"]["name"];nwr${a}["sport"]["name"];nwr${a}["name"~"quiosque",i];);out center 600;`;
  const rs = await fetch("https://overpass-api.de/api/interpreter", { method: "POST", headers: { "User-Agent": "praia-facil/1.0", "Content-Type": "application/x-www-form-urlencoded" }, body: "data=" + encodeURIComponent(q) });
  if (!rs.ok) throw new Error("Overpass " + rs.status);
  const seen = new Set(), out = [];
  for (const e of (await rs.json()).elements || []) {
    const t = e.tags || {}, la = e.lat ?? e.center?.lat, lo = e.lon ?? e.center?.lon; if (!t.name || la == null || seen.has(t.name + la.toFixed(4))) continue; seen.add(t.name + la.toFixed(4));
    const c = /quiosque/i.test(t.name) || /^(restaurant|bar|cafe|fast_food|ice_cream|pub)$/.test(t.amenity) ? "Comida" : t.shop ? "Lojas" : t.tourism ? "Passeios" : "Esportes";
    const rua = t["addr:street"] ? t["addr:street"] + (t["addr:housenumber"] ? ", " + t["addr:housenumber"] : "") : t["addr:suburb"] || "";
    out.push({ id: "osm" + e.type[0] + e.id, n: t.name, c, t: c === "Lojas" ? "Produto" : "Serviço", a: rua, d: dist(la, lo, lat, lon), kiosk: /quiosque/i.test(t.name), url: "https://www.openstreetmap.org/" + e.type + "/" + e.id, src: "osm" });
  } return out;
}
const GQ = [["Comida", "quiosques e bares na praia"], ["Lojas", "lojas e comércio"], ["Passeios", "passeios turísticos"], ["Esportes", "aluguel e aulas de esportes na praia"]];
async function google(lat, lon, r) {
  const res = await Promise.all(GQ.map(async ([c, q]) => {
    const rs = await fetch("https://places.googleapis.com/v1/places:searchText", { method: "POST", headers: { "Content-Type": "application/json", "X-Goog-Api-Key": E.GOOGLE_PLACES_KEY, "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.googleMapsUri" }, body: JSON.stringify({ textQuery: q, languageCode: "pt-BR", maxResultCount: 15, locationBias: { circle: { center: { latitude: lat, longitude: lon }, radius: Math.min(r, 50000) } } }) });
    if (!rs.ok) throw new Error("Google Places " + rs.status);
    return ((await rs.json()).places || []).map(p => ({ id: "g" + p.id, n: p.displayName?.text, c, t: c === "Lojas" ? "Produto" : "Serviço", a: p.formattedAddress || "", d: dist(p.location.latitude, p.location.longitude, lat, lon), kiosk: /quiosque/i.test(p.displayName?.text || ""), rating: p.rating, votes: p.userRatingCount, url: p.googleMapsUri, src: "google" }));
  }));
  const m = new Map(); res.flat().forEach(p => m.set(p.id, p)); return [...m.values()];
}
const cache = new Map();
app.get("/api/places", auth, async (req, res) => {
  const lat = +req.query.lat || LOC.lat, lon = +req.query.lon || LOC.lon, r = Math.min(+req.query.radius || LOC.radius, 10000), key = [lat.toFixed(3), lon.toFixed(3), r].join();
  const hit = cache.get(key); if (hit && Date.now() - hit.t < 6e5) return res.json({ places: hit.v, source: hit.s });
  try {
    const src = E.GOOGLE_PLACES_KEY ? "Google Places" : "OpenStreetMap";
    let discovered = [];
    try { discovered = E.GOOGLE_PLACES_KEY ? await google(lat, lon, r) : await overpass(lat, lon, r); }
    catch (sourceError) {
      if (!E.GOOGLE_PLACES_KEY) console.warn("OpenStreetMap indisponível; usando catálogo local:", sourceError.message);
      else throw sourceError;
    }
    const isBoaViagem = Math.abs(lat - LOC.lat) < 0.08 && Math.abs(lon - LOC.lon) < 0.08;
    const merged = isBoaViagem ? [...BOA_VIAGEM_PLACES, ...discovered] : discovered;
    const uniqueMap = new Map();
    for (const p of merged) {
      const key = p.src === "google" ? p.id : (String(p.n||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()+"|"+String(p.a||"").toLowerCase());
      if (!uniqueMap.has(key)) uniqueMap.set(key,p);
    }
    const unique = [...uniqueMap.values()];
    const v = unique.sort((a, b) => (a.d ?? 999999) - (b.d ?? 999999));
    const finalSource = isBoaViagem ? (discovered.length ? "Catálogo Praia Fácil + OpenStreetMap" : "Catálogo Praia Fácil") : src;
    cache.set(key, { t: Date.now(), v, s: finalSource }); res.json({ places: v, source: finalSource });
  } catch (e) { console.error(e); bad(res, "Não foi possível carregar os locais agora. Tente novamente.", 502); }
});

app.use(express.static("public"));
app.listen(PORT, () => console.log(`Praia Fácil rodando em ${BASE}`));

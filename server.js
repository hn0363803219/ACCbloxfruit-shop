const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const DB = path.join(__dirname, "db.json");
const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "change-this-password";
const SESSION_SECRET = process.env.SESSION_SECRET || "dev-secret-change-me";
const sessions = new Map();

app.use(express.json({limit:"200kb"}));
app.use(express.static(path.join(__dirname, "public")));

function readDB(){ return JSON.parse(fs.readFileSync(DB,"utf8")); }
function writeDB(data){ fs.writeFileSync(DB, JSON.stringify(data,null,2)); }
function sign(v){ return crypto.createHmac("sha256",SESSION_SECRET).update(v).digest("hex"); }
function makeToken(){ const raw=crypto.randomBytes(24).toString("hex"); return raw+"."+sign(raw); }
function admin(req,res,next){
  const token=req.headers.authorization?.replace(/^Bearer\s+/,"");
  if(!token || !sessions.has(token)) return res.status(401).json({error:"Unauthorized"});
  next();
}
function nextId(items){ return items.reduce((m,x)=>Math.max(m,Number(x.id)||0),0)+1; }

app.get("/api/products",(req,res)=>{
  const db=readDB();
  res.json(db.products.filter(p=>p.status!=="hidden"));
});

app.post("/api/orders",(req,res)=>{
  const {productId, customer, contact, note} = req.body || {};
  const db=readDB();
  const product=db.products.find(p=>Number(p.id)===Number(productId) && p.status==="available");
  if(!product) return res.status(404).json({error:"Sản phẩm không tồn tại hoặc đã hết."});
  if(!customer || !contact) return res.status(400).json({error:"Vui lòng nhập tên và thông tin liên hệ."});
  const order={
    id:"DH"+String(Date.now()).slice(-8),
    productId:product.id, productName:product.name, price:product.price,
    customer:String(customer).slice(0,100), contact:String(contact).slice(0,150),
    note:String(note||"").slice(0,500), status:"pending_payment",
    createdAt:new Date().toISOString()
  };
  db.orders.push(order); writeDB(db);
  res.status(201).json({order});
});

app.post("/api/admin/login",(req,res)=>{
  const {username,password}=req.body||{};
  if(username!==ADMIN_USER || password!==ADMIN_PASSWORD) return res.status(401).json({error:"Sai tài khoản hoặc mật khẩu."});
  const token=makeToken(); sessions.set(token,{createdAt:Date.now()});
  res.json({token});
});

app.get("/api/admin/products",admin,(req,res)=>res.json(readDB().products));
app.get("/api/admin/orders",admin,(req,res)=>res.json(readDB().orders));

app.post("/api/admin/products",admin,(req,res)=>{
  const db=readDB(); const b=req.body||{};
  if(!b.name || !Number.isFinite(Number(b.price))) return res.status(400).json({error:"Thiếu tên hoặc giá."});
  const p={id:nextId(db.products),type:b.type==="service"?"service":"account",name:String(b.name).slice(0,120),
    price:Number(b.price),emoji:String(b.emoji||"🎮").slice(0,8),tag:String(b.tag||"NEW").slice(0,20),
    status:"available"};
  if(p.type==="account"){p.level=Number(b.level||0);p.fruit=String(b.fruit||"").slice(0,50);}
  else p.description=String(b.description||"").slice(0,250);
  db.products.push(p);writeDB(db);res.status(201).json(p);
});

app.patch("/api/admin/products/:id",admin,(req,res)=>{
  const db=readDB(); const p=db.products.find(x=>Number(x.id)===Number(req.params.id));
  if(!p) return res.status(404).json({error:"Không tìm thấy sản phẩm."});
  const b=req.body||{};
  ["name","emoji","tag","status","fruit","description"].forEach(k=>{if(b[k]!==undefined)p[k]=String(b[k]);});
  if(b.price!==undefined)p.price=Number(b.price);
  if(b.level!==undefined)p.level=Number(b.level);
  writeDB(db);res.json(p);
});

app.delete("/api/admin/products/:id",admin,(req,res)=>{
  const db=readDB(); const p=db.products.find(x=>Number(x.id)===Number(req.params.id));
  if(!p) return res.status(404).json({error:"Không tìm thấy sản phẩm."});
  p.status="hidden"; writeDB(db); res.json({ok:true});
});

app.patch("/api/admin/orders/:id",admin,(req,res)=>{
  const allowed=["pending_payment","paid","processing","completed","cancelled"];
  const db=readDB(); const o=db.orders.find(x=>x.id===req.params.id);
  if(!o) return res.status(404).json({error:"Không tìm thấy đơn."});
  if(!allowed.includes(req.body.status)) return res.status(400).json({error:"Trạng thái không hợp lệ."});
  o.status=req.body.status; o.updatedAt=new Date().toISOString(); writeDB(db);res.json(o);
});

app.get("/{*splat}",(req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
app.listen(PORT,()=>console.log(`BloxShop V2 running on http://localhost:${PORT}`));

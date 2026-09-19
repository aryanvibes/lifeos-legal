import {initializeApp} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import {getAuth,GoogleAuthProvider,signInWithPopup,signOut,onAuthStateChanged,reauthenticateWithPopup} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import {CONFIG} from "./config.js";
import {LEGAL} from "./legal-content.js";

const app=initializeApp(CONFIG.firebase),auth=getAuth(app),provider=new GoogleAuthProvider();
provider.setCustomParameters({prompt:"select_account"});
const $=s=>document.querySelector(s);
const state={user:null,verified:false,account:null,loading:false,route:location.hash.replace(/^#\/?/,"")||""};
$("#year").textContent=new Date().getFullYear();

const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const toast=m=>{const x=$("#toast");x.textContent=m;x.classList.add("show");setTimeout(()=>x.classList.remove("show"),3500)};
const configured=()=>CONFIG.API_BASE_URL&&!CONFIG.API_BASE_URL.includes("REPLACE_WITH");

async function verify(){
  if(!configured()){state.account={status:"backend_not_configured"};return}
  try{
    const token=await state.user.getIdToken(true);
    const r=await fetch(CONFIG.API_BASE_URL+"/verify",{headers:{Authorization:"Bearer "+token}});
    if(!r.ok)throw Error("Verification failed");
    state.account=await r.json();state.verified=state.account.exists===true&&state.account.active!==false;
  }catch(e){console.error(e);state.account={status:"verification_error"}}
}
onAuthStateChanged(auth,async u=>{
  state.user=u;state.verified=false;state.account=null;state.loading=!!u;header();
  if(u)await verify();state.loading=false;header();render();
});
function header(){
  $("#auth").innerHTML=state.user
    ? `<div class="mini">● ${esc(state.user.email||"Google account")} <button class="btn small" id="out">Sign out</button></div>`
    : `<a class="btn small primary" href="#/login">Continue with Google</a>`;
  $("#out")?.addEventListener("click",()=>signOut(auth));
}
async function login(){
  try{await signInWithPopup(auth,provider);location.hash="#/account"}catch(e){toast(e.code==="auth/popup-closed-by-user"?"Sign-in cancelled.":"Google sign-in failed.")}
}
const card=(icon,title,text,route,danger="")=>`<a class="card ${danger}" href="#/${route}"><i>${icon}</i><h3>${title}</h3><p>${text}</p><b>→</b></a>`;

function home(){
  $("#app").innerHTML=`<section class="hero"><span class="eyebrow">Official LifeOS Trust Center</span><h1>Your LifeOS.<br><em>Your data. Your control.</em></h1><p>A secure place to understand LifeOS privacy, security, AI, subscriptions and account controls.</p><div class="actions"><a class="btn primary large" href="#/account">Open account center</a><a class="btn large" href="#/privacy">Explore privacy</a></div><div class="strip"><div><b>Identity</b><span>Google authenticated</span></div><div><b>Controls</b><span>Account-specific</span></div><div><b>Deletion</b><span>Request anytime</span></div></div></section>
  <section class="section"><span class="eyebrow">Explore</span><h2>Everything important, in one place.</h2><div class="grid">
  ${card("◈","Privacy & Data","What LifeOS processes, why it is used and deletion controls.","privacy")}
  ${card("⌁","Security","Authentication and protection principles.","security")}
  ${card("✦","LifeOS AI","Capabilities, limitations and responsible use.","ai")}
  ${card("◇","Subscriptions","Plans, cancellation and refund information.","subscriptions")}
  ${card("◎","Data & Permissions","Permission and data-use disclosures.","permissions")}
  ${card("⚠","Delete Account","Securely access the account deletion workflow.","deletion","danger")}</div></section>
  <section class="split"><div class="panel dark"><span class="eyebrow">Account protection</span><h2>We never ask you to type your Google email.</h2><p>Your identity comes directly from Google. Account controls unlock only after LifeOS account verification.</p></div><div class="panel"><span class="eyebrow">Transparency</span><h2>Legal information stays readable.</h2><p>Privacy, Terms, AI, subscriptions, permissions, analytics, security and DPDP information are separated into focused pages.</p></div></section>`;
}
function gate(title,text){
  $("#app").innerHTML=`<section class="center"><div class="icon">⌁</div><span class="eyebrow">Account access</span><h1>${title}</h1><p>${text}</p><button id="google" class="btn primary large">Continue with Google</button><small>Your email comes from the authenticated Google identity and cannot be manually edited.</small></section>`;
  $("#google").onclick=login;
}
function verification(){
  if(state.account?.status==="backend_not_configured")return `<div class="notice warn"><b>LifeOS verification is not configured yet.</b><span>The site will not guess that a Google account is a LifeOS account. Deploy the backend and set API_BASE_URL.</span></div>`;
  return `<div class="notice danger"><b>No verified LifeOS account found.</b><span>This Google account is authenticated, but the LifeOS account registry did not confirm an active account.</span></div>`;
}
function account(){
  if(!state.user)return gate("Account Center","Sign in with Google to access account-specific controls.");
  if(state.loading)return loading();
  if(!state.verified){$("#app").innerHTML=`<section class="center"><span class="eyebrow">Authenticated identity</span><h1>Account verification</h1><p>Signed in as <b>${esc(state.user.email)}</b>. This email is read-only.</p>${verification()}<a class="btn" href="#/">Back</a></section>`;return}
  $("#app").innerHTML=`<section class="accountHero"><div><span class="eyebrow">Verified LifeOS account</span><h1>Welcome back.</h1><p>Manage your account without manual email entry.</p></div><div class="verified">✓ Verified<br><span>${esc(state.user.email)}</span></div></section>
  <div class="grid accountGrid">${card("◈","Account","Identity and account status.","account")}${card("◎","My Data","Available data controls and export.","data")}${card("◇","Subscription","Plan and billing status from the backend.","subscriptions")}${card("⌁","Security","Authentication and sensitive-action safeguards.","security")}${card("⚠","Delete Account","Permanently request account and data deletion.","deletion","danger")}</div>`;
}
function data(){
  if(!requireVerified())return;
  $("#app").innerHTML=`<section class="title"><span class="eyebrow">My Data</span><h1>Your data, clearly explained.</h1><p>Only information returned by the authenticated LifeOS backend is used for account-specific controls.</p></section>
  <div class="data">${row("Identity","Google account","Authenticated identity from Firebase.")}${row("Profile","LifeOS profile","Name, mobile and workspace information where stored by LifeOS.")}${row("Workspace","Personal / Business / Unified","Workspace preference where synced to the account registry.")}${row("AI","Conversations & memories","Handled according to the actual production AI data flow.")}${row("Finance & CRM","Business records","Handled by the actual account deletion workflow.")}</div>
  <div class="panel"><span class="eyebrow">Export</span><h2>Data export</h2><p>No fake download is generated. This button contacts the authenticated backend.</p><button id="export" class="btn">Request data export</button></div>`;
  $("#export").onclick=()=>backend("/data-export","Data export request received.");
}
const row=(a,b,c)=>`<div class="row"><div><span class="eyebrow">${a}</span><h3>${b}</h3></div><p>${c}</p><strong>✓</strong></div>`;

function deletion(){
  if(!state.user)return gate("Delete your LifeOS account","Sign in with Google to access the deletion workflow.");
  if(state.loading)return loading();
  if(!state.verified){$("#app").innerHTML=`<section class="center"><span class="eyebrow">Deletion</span><h1>Verification required</h1><p>The Google identity must first be confirmed as an active LifeOS account.</p>${verification()}</section>`;return}
  $("#app").innerHTML=`<section class="title"><span class="eyebrow dangerText">Danger zone</span><h1>Delete your LifeOS account.</h1><p>This is a permanent account action. Associated data is handled by the actual deletion workflow and applicable retention rules.</p></section>
  <div class="dangerBox"><div class="identity">✓ <span>${esc(state.user.email)}</span><small>READ-ONLY</small></div><h2>Before you continue</h2><ul><li>Confirm this is the correct Google account.</li><li>Understand deletion may be irreversible.</li><li>Review legitimate retention exceptions in the Privacy Policy.</li><li>No deletion is reported as complete until the backend confirms it.</li></ul><label>Type DELETE to continue</label><input id="word" placeholder="DELETE" autocomplete="off"><button id="delete" class="btn dangerBtn large" disabled>Continue to secure deletion</button><small>Recent authentication may be required for sensitive Firebase actions.</small></div>`;
  const i=$("#word"),b=$("#delete");i.oninput=()=>b.disabled=i.value.trim()!=="DELETE";b.onclick=secureDelete;
}
async function secureDelete(){
  const b=$("#delete");b.disabled=true;b.textContent="Re-authenticating…";
  try{
    await reauthenticateWithPopup(state.user,provider);
    b.textContent="Submitting deletion…";
    const token=await state.user.getIdToken(true);
    const r=await fetch(CONFIG.API_BASE_URL+"/delete-request",{method:"POST",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},body:JSON.stringify({confirmation:"DELETE"})});
    const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.message||"Deletion request failed");
    $("#app").innerHTML=`<section class="center"><div class="success">✓</div><span class="eyebrow">Request received</span><h1>Deletion request submitted.</h1><p>${esc(d.message||"Your request was securely received.")}</p>${d.requestId?`<div class="request">Request ID <b>${esc(d.requestId)}</b></div>`:""}<a class="btn primary" href="#/">Return to Trust Center</a></section>`;
  }catch(e){console.error(e);toast(e.message||"Deletion could not be completed.");b.disabled=false;b.textContent="Continue to secure deletion"}
}
async function backend(path,success){
  try{const token=await state.user.getIdToken(true);const r=await fetch(CONFIG.API_BASE_URL+path,{method:"POST",headers:{Authorization:"Bearer "+token}});const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.message||"Request failed");toast(d.message||success)}catch(e){toast(e.message||"Request failed")}
}
function requireVerified(){if(!state.user){gate("Sign in required","This area contains account-specific information.");return false}if(state.loading){loading();return false}if(!state.verified){account();return false}return true}
function legal(k){const x=LEGAL[k];if(!x)return notFound();$("#app").innerHTML=`<article class="legal"><span class="eyebrow">${x.kicker}</span><h1>${x.title}</h1><p class="lead">${x.summary}</p><small>Last updated: ${x.updated}</small><div class="legalBody">${x.body}</div></article>`}
function loading(){$("#app").innerHTML=`<section class="center"><div class="spinner"></div><p>Checking your LifeOS account…</p></section>`}
function notFound(){$("#app").innerHTML=`<section class="center"><h1>Page not found.</h1><a class="btn primary" href="#/">Back to Trust Center</a></section>`}

const routes={"":home,"privacy":()=>legal("privacy"),"terms":()=>legal("terms"),"ai":()=>legal("ai"),"subscriptions":()=>legal("subscriptions"),"permissions":()=>legal("permissions"),"analytics":()=>legal("analytics"),"security":()=>legal("security"),"dpdp":()=>legal("dpdp"),"contact":()=>legal("contact"),"licenses":()=>legal("licenses"),"account":account,"data":data,"deletion":deletion,"login":()=>state.user?account():gate("Welcome to LifeOS","Sign in with the Google account associated with your LifeOS account.")};
function render(){header();(routes[state.route]||notFound)()}
addEventListener("hashchange",()=>{state.route=location.hash.replace(/^#\/?/,"")||"";render()});
render();

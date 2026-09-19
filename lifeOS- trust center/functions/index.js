const {onRequest}=require("firebase-functions/v2/https");
const {setGlobalOptions}=require("firebase-functions/v2");
const admin=require("firebase-admin");
const crypto=require("crypto");
admin.initializeApp(); setGlobalOptions({region:"asia-south1",maxInstances:10});
const db=admin.firestore(), auth=admin.auth();

async function user(req){
  const h=req.headers.authorization||"";
  if(!h.startsWith("Bearer ")) throw Object.assign(new Error("Authentication required"),{status:401});
  return auth.verifyIdToken(h.slice(7));
}
exports.account=onRequest(async(req,res)=>{
  res.set("Access-Control-Allow-Origin",process.env.TRUST_CENTER_ORIGIN||"https://YOUR_GITHUB_PAGES_ORIGIN");
  res.set("Access-Control-Allow-Headers","Authorization, Content-Type");
  res.set("Access-Control-Allow-Methods","GET,POST,OPTIONS");
  if(req.method==="OPTIONS")return res.status(204).send("");
  try{
    const decoded=await user(req),uid=decoded.uid,path=req.path.replace(/^\/+/,"");
    const snap=await db.doc(`lifeosUsers/${uid}`).get();

    if(path==="verify"&&req.method==="GET"){
      if(!snap.exists)return res.json({exists:false,active:false});
      const d=snap.data()||{};
      return res.json({exists:true,active:d.active!==false,plan:d.plan||"unknown"});
    }
    if(!snap.exists||snap.data().active===false)return res.status(403).json({message:"No active LifeOS account found."});

    if(path==="data-export"&&req.method==="POST"){
      const requestId="EX-"+crypto.randomBytes(6).toString("hex").toUpperCase();
      await db.collection("dataExportRequests").doc(requestId).set({uid,email:decoded.email||null,status:"requested",createdAt:admin.firestore.FieldValue.serverTimestamp()});
      return res.json({requestId,message:"Data export request received."});
    }

    if(path==="delete-request"&&req.method==="POST"){
      if(req.body?.confirmation!=="DELETE")return res.status(400).json({message:"Deletion confirmation is required."});
      const requestId="LD-"+crypto.randomBytes(6).toString("hex").toUpperCase();
      await db.collection("deletionRequests").doc(requestId).set({uid,email:decoded.email||null,status:"requested",createdAt:admin.firestore.FieldValue.serverTimestamp()});
      return res.json({requestId,message:"Your deletion request has been securely received. It is not reported as complete until the LifeOS deletion workflow confirms completion."});
    }
    return res.status(404).json({message:"Endpoint not found."});
  }catch(e){console.error(e);return res.status(e.status||500).json({message:"Request could not be completed."});}
});
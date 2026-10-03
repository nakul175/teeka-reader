import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';import worker from '../dist/server/index.js';import {hash,verify,validateFields} from '../rules.mjs';
const c=JSON.parse(readFileSync('config.json','utf8')),sqlite=new DatabaseSync(':memory:');sqlite.exec(readFileSync('drizzle/0000_nifty_ironclad.sql','utf8'));class S{constructor(sql,args=[]){this.sql=sql;this.args=args}bind(...args){return new S(this.sql,args)}async first(){return sqlite.prepare(this.sql).get(...this.args)||null}async all(){return {results:sqlite.prepare(this.sql).all(...this.args)}}async run(){const r=sqlite.prepare(this.sql).run(...this.args);return {meta:{changes:Number(r.changes)}}}}
const key='synthetic-test-key-not-a-hosted-secret-01234567890',env={DB:{prepare:sql=>new S(sql)},PARTNER_KEY:key};let passed=0;const check=(f)=>{f();passed++};const input={schemaVersion:'frontline.v1',appId:c.id,requestId:'fl_service_test_12345',environment:'synthetic',confirmed:true,fields:c.sample,evidence:{kind:'sample',engine:'none',text:c.note}};
const req=(body=input,headers={},path='/api/assess',method='POST')=>new Request('https://provider.example.invalid'+path,{method,headers:{Authorization:'Bearer '+key,'Content-Type':'application/json','Idempotency-Key':body.requestId,...headers},...(['GET','HEAD'].includes(method)?{}:{body:JSON.stringify(body)})});
let r=await worker.fetch(req(),env),j=await r.json();check(()=>{assert.equal(r.status,200);assert.equal(j.clinicalUse,false);assert.equal(j.status,'review_required');assert.equal(j.inferenceProvenance,'no AI inference claimed');assert.equal(j.providerOrganisation,c.organisation);});const inputHash=await hash(input);check(()=>assert.equal(j.inputHash,inputHash));
check(()=>assert.equal(sqlite.prepare('SELECT count(*) AS n FROM receipts').get().n,1));
assert.equal(await verify(j,key),true);passed++;
assert.equal(await verify({...j,title:'tampered'},key),false);passed++;
assert.equal(await verify(j,'different key'),false);passed++;

r=await worker.fetch(req(),env);check(()=>assert.equal(r.status,200));check(()=>assert.deepEqual(j,JSON.parse(sqlite.prepare('SELECT result FROM receipts').get().result)));
r=await worker.fetch(req({...input,evidence:{...input.evidence,text:'changed'}}),env);check(()=>assert.equal(r.status,409));
r=await worker.fetch(req({...input,requestId:'fl_missing_observations',fields:{}}),env);check(()=>assert.equal(r.status,422));
r=await worker.fetch(req({...input,requestId:'fl_production_refused',environment:'production'}),env);check(()=>assert.equal(r.status,422));
r=await worker.fetch(req({...input,requestId:'fl_unconfirmed_refused',confirmed:false}),env);check(()=>assert.equal(r.status,422));
r=await worker.fetch(req({...input,requestId:'fl_unsupported_refused',patientName:'unexpected'}),env);check(()=>assert.equal(r.status,422));
r=await worker.fetch(req(input,{Authorization:'Bearer invalid'}),env);check(()=>assert.equal(r.status,401));
r=await worker.fetch(new Request('https://provider.example.invalid/api/ledger'),env);check(()=>assert.equal(r.status,401));
r=await worker.fetch(req(input,{},'/api/receipts/'+input.requestId,'GET'),env);check(()=>assert.equal(r.status,200));
r=await worker.fetch(req(input,{},'/api/receipts/fl_not_found','GET'),env);check(()=>assert.equal(r.status,404));
const browserHeaders={'oai-authenticated-user-id':'synthetic-browser','Content-Type':'application/json','Idempotency-Key':'fl_browser_request_12345'};
r=await worker.fetch(new Request('https://provider.example.invalid/api/assess',{method:'POST',headers:{...browserHeaders,Origin:'https://evil.invalid'},body:JSON.stringify({...input,requestId:browserHeaders['Idempotency-Key']})}),env);check(()=>assert.equal(r.status,403));
r=await worker.fetch(new Request('https://provider.example.invalid/api/receipts/'+input.requestId,{headers:{'oai-authenticated-user-id':'synthetic-browser'}}),env);check(()=>assert.equal(r.status,404));
const n=sqlite.prepare('SELECT count(*) AS n FROM receipts').get().n;r=await worker.fetch(req({...input,requestId:'fl_empty_ai_result',evidence:{kind:'ocr',engine:'test',text:''}}),env);check(()=>{assert.equal(r.status,422);assert.equal(sqlite.prepare('SELECT count(*) AS n FROM receipts').get().n,n)});
for(const [k,,type,min,max] of c.fields){if(type==='number'){check(()=>assert.throws(()=>validateFields(c,{...c.sample,[k]:min-1})));check(()=>assert.throws(()=>validateFields(c,{...c.sample,[k]:max+1})));check(()=>assert.throws(()=>validateFields(c,{...c.sample,[k]:1.5})));}else check(()=>assert.throws(()=>validateFields(c,{...c.sample,[k]:'false'})));}
mkdirSync('tests/evidence',{recursive:true});const evidence={appId:c.id,passed,failed:0,completedAt:new Date().toISOString(),coverage:'Real provider Worker handler and SQLite: contract, rule processing, signature, request hash, idempotency, replay, wrong customer, auth, CSRF, validation, no AI claim for sample evidence. Browser model execution is separate.'};writeFileSync('tests/evidence/service.json',JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence));

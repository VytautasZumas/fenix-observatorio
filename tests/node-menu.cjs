// Browser check of node deletion (Delete/Backspace) and the right-click node menu, on synthetic data with external requests blocked.
const {chromium}=require('playwright');const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');
const receipt=JSON.parse(fs.readFileSync('tests/fixtures/usdt-receipt.json','utf8'));
const center='TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7',a='TCEEJKaAT4mF3AsjqwUUHmHvosq67x3FTz',b='TTEP3e6KJVLAeQ2w4eXsCaruCEN9VRBdFN',c='TDqSquXBgUCLYvYC4XZgrprLK589dkhSCf';
const events=[{from:a,to:center,value:'12500000000',asset:'USDT'},{from:b,to:center,value:'850000000',asset:'TRX'},{from:center,to:c,value:'3200000000',asset:'USDT'}].map((e,i)=>({...e,id:receipt.id+':log:'+i,hash:receipt.id,index:i,time:receipt.blockTimeStamp+i*1000,block:receipt.blockNumber}));
const fixture={version:1,auto:false,timezone:'America/Sao_Paulo',addresses:[{address:center,label:'Carteira monitorada',start:receipt.blockTimeStamp-1000,expanded:false,error:'TRX: teste de aviso',streams:{trx:{initial:false,since:Date.now()},usdt:{initial:false,since:Date.now()}}}],events:Object.fromEntries(events.map(e=>[e.id,e])),rules:[],alerts:[],raw:[],receipts:{[receipt.id]:receipt},nodeLabels:{[a]:'Origem A',[b]:'Origem B',[c]:'Destino A'},last:Date.now()};
(async()=>{const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});try{
 const page=await browser.newPage({viewport:{width:1560,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',route=>{const url=new URL(route.request().url());if(url.hostname!=='localhost')return route.abort();const name=url.pathname==='/'?'index.html':url.pathname.slice(1);if(!['index.html','app.js','style.css'].includes(name))return route.fulfill({status:404,body:''});return route.fulfill({status:200,contentType:name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':'text/html',body:fs.readFileSync(path.join('dist',name))});});
 await page.goto('http://localhost:8765');await page.waitForFunction(()=>document.querySelector('#status').textContent==='Aguardando');
 await page.evaluate(data=>new Promise((ok,no)=>{const r=indexedDB.open('observatorio-tron',1);r.onsuccess=()=>{const t=r.result.transaction('case','readwrite');t.objectStore('case').put(data,'active');t.oncomplete=()=>{r.result.close();ok();};t.onerror=no;};r.onerror=no;}),fixture);
 await page.reload();await page.waitForSelector('[data-node]');
 const node=addr=>page.locator(`[data-node="${addr}"]`).first(),stored=()=>page.evaluate(()=>new Promise(ok=>{const r=indexedDB.open('observatorio-tron',1);r.onsuccess=()=>{const q=r.result.transaction('case').objectStore('case').get('active');q.onsuccess=()=>{r.result.close();ok(q.result);};};}));
 const settle=()=>page.waitForTimeout(150);
 assert.equal(await page.locator('[data-node]').count(),4);
 // Delete key on a clicked node: node and its transaction leave the graph, the explorer keeps them.
 await node(c).click();await page.keyboard.press('Delete');await settle();
 assert.equal(await page.locator(`[data-node="${c}"]`).count(),0);assert.equal(await page.locator('[data-node]').count(),3);
 assert.equal(await page.locator('#restoreHidden').isVisible(),true);let s=await stored();assert.equal(s.graphSelected[events[2].id],undefined);assert.ok(s.events[events[2].id]);assert.deepEqual(s.graphHidden[c].events,[events[2].id]);
 await page.locator('#restoreHidden').click();await settle();assert.equal(await page.locator(`[data-node="${c}"]`).count(),1);assert.equal(await page.locator('#restoreHidden').isVisible(),false);
 // Backspace on a Shift-selected group.
 await node(a).click({modifiers:['Shift']});await node(b).click({modifiers:['Shift']});await page.keyboard.press('Backspace');await settle();
 assert.equal(await page.locator(`[data-node="${a}"],[data-node="${b}"]`).count(),0);await page.locator('#restoreHidden').click();await settle();
 // Typing Backspace inside a field never deletes nodes.
 await node(c).click();if(await page.locator('#inspectorToggle').getAttribute('aria-expanded')!=='true')await page.locator('#inspectorToggle').click();await page.locator('#nodeLabelInput').focus();await page.keyboard.press('Backspace');assert.equal(await page.locator(`[data-node="${c}"]`).count(),1);
 // Right-click menu: colour, shape, rename, comment.
 await node(c).click({button:'right'});assert.equal(await page.locator('#nodeMenu').isVisible(),true);
 assert.deepEqual(await page.locator('#nodeMenu > button').allTextContents().then(t=>t.map(x=>x.replace(/Del$/,'').trim())),['🗑 Excluir do gráfico','✎ Renomear','💬 Inserir comentário','➝ Inserir seta customizada','◎ Monitorar','🔔 Ajustar alerta']);
 await page.locator('[data-menu-color="#e5534b"]').click();assert.equal(await page.locator('#nodeMenu').isVisible(),false);
 assert.equal(await node(c).locator('circle[stroke="#42d7e7"],circle[fill="#e5534b"]').count()>0,true);
 await node(c).click({button:'right'});await page.locator('[data-menu-shape="diamond"]').click();await settle();assert.equal(await node(c).locator('polygon').count(),1);
 await node(c).click({button:'right'});await page.locator('[data-menu=rename]').click();assert.equal(await page.locator('#nodeTextDialog').isVisible(),true);await page.locator('#nodeTextInput').fill('Destino renomeado');await page.locator('#nodeTextForm button.primary').click();await settle();
 assert.match(await node(c).textContent(),/Destino renomeado/);
 await node(c).click({button:'right'});await page.locator('[data-menu=comment]').click();await page.locator('#nodeTextArea').fill('Recebeu após o ataque');await page.locator('#nodeTextForm button.primary').click();await settle();
 assert.equal(await page.locator(`[data-note="${c}"]`).count(),1);assert.match(await page.locator('#detail').textContent(),/Recebeu após o ataque/);
 // The comment note is draggable on its own and keeps its offset when the node moves.
 const noteBox=async()=>page.locator(`[data-note="${c}"] rect`).boundingBox();let nb=await noteBox();await page.mouse.move(nb.x+20,nb.y+10);await page.mouse.down();await page.mouse.move(nb.x-40,nb.y+70,{steps:6});await page.mouse.up();await settle();const moved=await noteBox();assert.ok(Math.abs(moved.x-nb.x+60)<3&&Math.abs(moved.y-nb.y-60)<3,'note follows the pointer');
 s=await stored();assert.ok(Number.isFinite(s.commentPositions[c].dx));const nodeBox=await node(c).boundingBox();await page.mouse.move(nodeBox.x+nodeBox.width/2,nodeBox.y+12);await page.mouse.down();await page.mouse.move(nodeBox.x+nodeBox.width/2-40,nodeBox.y+12,{steps:5});await page.mouse.up();await settle();const after=await noteBox();assert.ok(Math.abs(after.x-moved.x+40)<3,'note moves with its node');
 // Status notices close with ×.
 assert.equal(await page.locator('#coverage .coverage').count(),1);await page.locator('[data-close-coverage]').click();assert.equal(await page.locator('#coverage .coverage').count(),0);
 // Escape closes the menu without clearing other state.
 await node(c).click({button:'right'});await page.keyboard.press('Escape');assert.equal(await page.locator('#nodeMenu').isVisible(),false);
 // Custom arrow from C to A, labelled, then removed with Delete.
 await node(c).click({button:'right'});await page.locator('[data-menu=arrow]').click();await node(a).click();assert.equal(await page.locator('#nodeTextDialog').isVisible(),true);await page.locator('#nodeTextInput').fill('Mesmo operador?');await page.locator('#nodeTextForm button.primary').click();await settle();
 assert.equal(await page.locator('[data-arrow]').count(),1);assert.match(await page.locator('[data-arrow]').textContent(),/Mesmo operador\?/);
 s=await stored();assert.equal(s.customArrows.length,1);assert.equal(s.customArrows[0].from,c);assert.equal(s.customArrows[0].to,a);assert.equal(s.nodeStyles[c].color,'#e5534b');assert.equal(s.nodeStyles[c].shape,'diamond');assert.equal(s.nodeComments[c],'Recebeu após o ataque');assert.equal(s.nodeLabels[c],'Destino renomeado');
 await page.locator('[data-arrow] rect').click();assert.match(await page.locator('#detail').textContent(),/SETA CUSTOMIZADA/);await page.locator('#detail').click();await page.keyboard.press('Delete');await settle();assert.equal(await page.locator('[data-arrow]').count(),0);
 // Monitorar opens the address dialog prefilled; already monitored is disabled.
 await node(center).click({button:'right'});assert.equal(await page.locator('[data-menu=monitor]').isDisabled(),true);await page.keyboard.press('Escape');
 await node(c).click({button:'right'});await page.locator('[data-menu=monitor]').click();assert.equal(await page.locator('#addressDialog').isVisible(),true);assert.equal(await page.locator('#addressForm [name=address]').inputValue(),c);assert.equal(await page.locator('#addressForm [name=label]').inputValue(),'Destino renomeado');await page.locator('#cancelAddress').click();
 // Ajustar alerta: only for monitored addresses; opens the rule dialog tied to that address and lists its alerts.
 await node(c).click({button:'right'});assert.equal(await page.locator('[data-menu=alert]').isDisabled(),true);await page.keyboard.press('Escape');
 await node(center).click({button:'right'});await page.locator('[data-menu=alert]').click();assert.equal(await page.locator('#ruleDialog').isVisible(),true);assert.equal(await page.locator('#ruleAddress').inputValue(),center);assert.equal(await page.locator('#ruleExisting').isHidden(),true);
 await page.locator('#ruleForm [name=name]').fill('Saída do alvo');await page.locator('#ruleForm [name=min]').fill('100');await page.locator('#ruleForm button.primary').click();await settle();
 s=await stored();assert.equal(s.rules.length,1);assert.equal(s.rules[0].address,center);assert.equal(s.rules[0].telegram,true);
 await node(center).click({button:'right'});assert.match(await page.locator('[data-menu=alert]').textContent(),/Ajustar alerta \(1\)/);await page.locator('[data-menu=alert]').click();assert.match(await page.locator('#ruleExisting').textContent(),/Saída do alvo/);
 await page.locator('[data-edit-existing]').click();assert.equal(await page.locator('#ruleForm [name=name]').inputValue(),'Saída do alvo');assert.equal(await page.locator('#ruleEyebrow').textContent(),'EDITAR ALERTA');await page.locator('#ruleForm [name=min]').fill('250');await page.locator('#ruleForm button.primary').click();await settle();
 s=await stored();assert.equal(s.rules.length,1);assert.equal(s.rules[0].min,'250');
 // Annotations survive a reload.
 await page.reload();await page.waitForSelector('[data-node]');assert.equal(await node(c).locator('polygon').count(),1);assert.equal(await page.locator(`[data-note="${c}"]`).count(),1);
 await page.screenshot({path:'/tmp/fenix-node-menu.png'});
 assert.deepEqual(errors,[]);console.log('PASS: Delete/Backspace remove nodes (single and group) and restore, typing guard, right-click menu colour/shape/rename/comment/custom arrow/monitor, Ajustar alerta per address, comment note drag and follow, closable status notices, Escape, persistence after reload.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});

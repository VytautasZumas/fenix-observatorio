const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const elements=new Map();const element=()=>({value:'',checked:true,hidden:false,style:{setProperty(key,value){this[key]=value;}},dataset:{},classList:{toggle(){},add(){},remove(){}},addEventListener(){},setAttribute(){},getBoundingClientRect(){return {width:1000,height:900};}});
const context={console,crypto:require('node:crypto').webcrypto,TextEncoder,Uint8Array,URLSearchParams,AbortSignal,Intl,Date,Map,Set,BigInt,structuredClone,setTimeout:r=>r(),clearTimeout(){},setInterval(){},document:{body:{classList:{add(){},remove(){},toggle(name,on){context.bodyClass={name,on};}}},querySelector:s=>{if(s==='dialog[open]')return null;if(!elements.has(s))elements.set(s,element());return elements.get(s);},querySelectorAll:()=>[],addEventListener(){}},window:{addEventListener(){}}};
vm.createContext(context);vm.runInContext(fs.readFileSync('dist/app.js','utf8').replace("init().catch(e=>toast('Armazenamento indisponível: '+e.message));",''),context);
async function run(code){return vm.runInContext(code,context);}
(async()=>{
 assert.equal(await run("validAddress('TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t')"),true);
 assert.equal(await run("validAddress('TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6u')"),false);
 assert.equal(await run("b58('41a614f803b6fd780986a42c78ec9c7f77e6ded13c')"),'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t');
 assert.equal(await run("zonedInput('2026-11-01T12:00','America/Sao_Paulo')"),Date.parse('2026-11-01T15:00:00Z'));
 assert.equal(await run("units('10000,000001').toString()"),'10000000001');
 context.fixture=JSON.parse(fs.readFileSync('tests/fixtures/usdt-receipt.json','utf8'));
 await run("state.receipts={[fixture.id]:fixture}");
 const events=await run("normalize([{transaction_id:fixture.id,token_info:{address:USDT},type:'Transfer'}],'usdt','TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7')");
 assert.equal(events.length,1);assert.equal(events[0].value,'1000000');assert.equal(events[0].to,'TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7');assert.equal(events[0].index,0);
 context.transfer=events[0];await run("state.addresses=[{address:transfer.to,expanded:false}];state.rules=[{id:'r',name:'Entrada',asset:'USDT',min:'1',direction:'in',days:'all',enabled:true}];evaluate(transfer);evaluate(transfer)");
 assert.equal(await run('state.alerts.length'),1);
 await run("state.alerts=[];state.rules[0].direction='out';evaluate(transfer)");assert.equal(await run('state.alerts.length'),0);
 const failed=await run("normalize([{txID:'a',ret:[{contractRet:'REVERT'}],raw_data:{contract:[{type:'TransferContract'}]}}],'trx','x')");assert.equal(failed.length,0);
 await run("state.alerts=[];state.rules[0].direction='in';state.rules[0].from='22:00';state.rules[0].to='06:00';evaluate({...transfer,time:Date.parse('2026-11-01T02:00:00Z')});");assert.equal(await run('state.alerts.length'),1);
 context.fetch=async()=>({ok:false,status:429});await assert.rejects(()=>run("api('/v1/test')"),/429/);
 // A counterparty may occupy both roles while retaining its actual address.
 context.graphEvents=[{from:'IN',to:'M',asset:'TRX'},{from:'M',to:'OUT',asset:'USDT'},{from:'BOTH',to:'M',asset:'USDT'},{from:'M',to:'BOTH',asset:'USDT'},{from:'OUT',to:'NEXT',asset:'TRX'}];
 await run("scene=buildGraphScene(graphEvents,[{address:'M',expanded:false}]);positions.clear();placeGraphNodes(scene.nodes)");
 assert.equal(await run("positions.get('-1:IN').x < positions.get('0:M').x && positions.get('0:M').x < positions.get('1:OUT').x"),true);
 assert.equal(await run("scene.nodes.filter(n=>n.address==='BOTH').length"),2);
 assert.equal(await run("scene.nodes.filter(n=>n.address==='BOTH').every(n=>n.repeated)"),true);
 assert.equal(await run("scene.edges.some(e=>e.from==='-1:BOTH'&&e.to==='0:M') && scene.edges.some(e=>e.from==='0:M'&&e.to==='1:BOTH')"),true);
 assert.equal(await run("scene.edges.some(e=>e.from==='1:OUT'&&e.to==='2:NEXT')"),true);
 await run("positions.set('-1:IN',{x:45,y:321});placeGraphNodes([...scene.nodes,{id:'-1:NEW',address:'NEW',lane:-1}])");
 assert.equal(await run("positions.get('-1:IN').x"),45);
 assert.equal(await run("positions.get('-1:IN').y"),321);
 await run("positions.clear();state.graphPositions={'0:M':{x:777,y:333}};placeGraphNodes(scene.nodes)");
 assert.equal(await run("positions.get('0:M').x"),777);
 // Exercise the pointer handler at 2x zoom, with screen-to-SVG conversion.
 const svg=elements.get('#graph');svg.getScreenCTM=()=>({inverse:()=>({})});svg.createSVGPoint=()=>({x:0,y:0,matrixTransform(){return {x:this.x/2,y:this.y/2};}});svg.setPointerCapture=()=>{};svg.hasPointerCapture=()=>false;
 context.down={button:0,pointerId:1,clientX:200,clientY:100,target:{closest:s=>s==='[data-visual]'?{dataset:{visual:'0:M'}}:null}};
 context.move={pointerId:1,clientX:240,clientY:120};
 await run("zoom=2;$('#graph').onpointerdown(down);$('#graph').onpointermove(move)");
 assert.equal(await run("positions.get('0:M').x"),787);
 assert.equal(await run("positions.get('0:M').y"),338);
 await run("drag=null");
 // One arrow per marked transaction: several between the same pair fan out as arcs; a single one is straight.
 await run("save=async()=>{};state.events={};state.graphSelected={};state.addresses=[{address:transfer.to,expanded:false}];const examples=[transfer,{...transfer,id:transfer.hash+':log:1',time:transfer.time+1000,value:'2500000'},{...transfer,id:transfer.hash+':trx:0',time:transfer.time+2000,value:'1500000',asset:'TRX'},{...transfer,id:transfer.hash+':log:2',from:transfer.to,to:transfer.from,time:transfer.time+3000,value:'9000000'}];for(const e of examples)state.events[e.id]=e;positions.clear();renderGraph()");
 assert.equal(await run("scene.edges.length"),0);assert.equal(elements.get('#graph').innerHTML.includes('marque no explorador'),true);
 await run("setOnGraph([transfer.id],true)");
 assert.equal(await run("scene.edges.length"),1);assert.equal(await run("graphEdgePath(scene.edges[0]).path.split(' ').filter((v,i,a)=>i>0&&a[i-1]==='Q').length"),1);
 assert.equal(await run("(()=>{const [,x1,y1,,cx,cy,x2,y2]=graphEdgePath(scene.edges[0]).path.split(' ').map(Number);return Math.abs((cy-y1)*(x2-x1)-(cx-x1)*(y2-y1))<1e-6;})()"),true);
 await run("setOnGraph(Object.keys(state.events),true)");
 assert.equal(await run("scene.edges.length"),4);assert.equal(await run("scene.edges.filter(e=>e.groupSize===3).length"),3);assert.equal(await run("scene.edges.find(e=>e.id===transfer.hash+':log:2').groupSize"),1);
 assert.equal(await run("new Set(scene.edges.filter(e=>e.groupSize===3).map(e=>Math.round(graphEdgePath(e).y))).size"),3);
 assert.equal(await run("scene.edges.find(e=>e.id===transfer.hash+':trx:0').totals.TRX.toString()"),'1500000');
 assert.equal(await run("connectionLabelLines(scene.edges.find(e=>e.id===transfer.hash+':log:1'),false).join('|')"),'2,50 USDT');
 assert.equal(await run("connectionLabelLines(scene.edges[0],true).length"),2);
 await run("showConnection(transfer.hash+':trx:0')");
 assert.equal(await run("selection.value"),events[0].hash+':trx:0');
 assert.equal(await run("visibleEvents().length"),3);
 assert.equal(elements.get('#eventDetailBody').innerHTML.includes('1,50 TRX'),true);
 assert.equal(elements.get('#eventDetailBody').innerHTML.includes('connectionEvents'),true);
 await run("$('#connectionEvents').onchange({target:{value:transfer.id}})");
 assert.equal(await run("selection.value"),events[0].id);
 assert.equal(elements.get('#eventDetailBody').innerHTML.includes('1,00 USDT'),true);
 assert.equal(await run("visibleEvents().some(e=>e.id===transfer.hash+':log:2')"),false);
 await run("selection=null;setOnGraph([transfer.hash+':log:1',transfer.hash+':trx:0',transfer.hash+':log:2'],false)");
 assert.equal(await run("scene.edges.length"),1);assert.equal(await run("scene.edges[0].groupSize"),1);
 assert.equal(await run("(()=>{const [,x1,y1,,cx,cy,x2,y2]=graphEdgePath(scene.edges[0]).path.split(' ').map(Number);return Math.abs((cy-y1)*(x2-x1)-(cx-x1)*(y2-y1))<1e-6;})()"),true);
 {
  await run("$('#graphFilter').value='on'");assert.equal(await run("visibleEvents().length"),1);
  await run("$('#graphFilter').value='off'");assert.equal(await run("visibleEvents().length"),3);
  await run("$('#graphFilter').value=''");assert.equal(await run("visibleEvents().length"),4);
 }
 assert.deepEqual(Object.keys(await run("migrateGraphSelection({events:{a:{},b:{}}}).graphSelected")),['a','b']);
 assert.deepEqual(Object.keys(await run("migrateGraphSelection({events:{a:{}},graphSelected:{a:true,gone:true}}).graphSelected")),['a']);
 await run("setOnGraph(Object.keys(state.events),true)");
 await run("state.graphDates=false;$('#graphDates').onclick()");
 assert.equal(await run("state.graphDates"),true);
 assert.equal(elements.get('#graphDates').textContent,'Ocultar data e hora');
 await run("$('#graphDates').onclick()");assert.equal(await run("state.graphDates"),false);
 // Exploding from a chosen outflow monitors the counterparty from that transaction onwards.
 context.outflow={...context.transfer,id:'f'.repeat(64)+':log:0',hash:'f'.repeat(64),from:context.transfer.to,to:"TDqSquXBgUCLYvYC4XZgrprLK589dkhSCf",time:context.transfer.time+5000};
 await run("state.events[outflow.id]=outflow;sync=async()=>{};busy=false");
 assert.equal(await run("explosionTarget(outflow).address"),'TDqSquXBgUCLYvYC4XZgrprLK589dkhSCf');
 assert.equal(await run("explosionTarget(outflow).start"),context.outflow.time);
 assert.equal(await run("explosionTarget(state.events[transfer.id]).forward"),false);
 assert.equal(await run("explodeEvents([outflow.id])"),true);
 assert.equal(await run("state.addresses.find(a=>a.address===outflow.to).expanded"),true);
 assert.equal(await run("state.addresses.find(a=>a.address===outflow.to).start"),context.outflow.time);
 assert.equal(await run("onGraph(outflow.id)"),true);assert.equal(await run("explosionTarget(outflow)"),null);
 assert.equal(await run("explodeEvents([outflow.id])"),false);
 await run("state.addresses=state.addresses.filter(a=>!a.expanded);delete state.events[outflow.id];migrateGraphSelection(state)");
 console.log('PASS: graph shows only marked transactions, one arrow per transaction, fanned arcs for repeated pairs, straight single arrow, explorer graph filter, migration of older cases, explosion from chosen transactions.');
 // Exact values and inclusive date boundaries for explorer filters.
 await run("selection=null;$('#dateFrom').value='2026-11-01T09:00';$('#dateTo').value='2026-11-01T10:00';$('#explorerAsset').value='USDT';$('#direction').value='in';$('#valueOp').value='gt';$('#valueFilter').value='1,000001';$('#search').value='';state.addresses=[{address:transfer.to,expanded:false}]");
 context.filterEvent={...events[0],time:Date.parse('2026-11-01T12:30:00Z'),value:'1000002'};
 assert.equal(await run("matchesExplorer(filterEvent,explorerFilters())"),true);
 assert.equal(await run("matchesExplorer({...filterEvent,value:'1000001'},explorerFilters())"),false);
 await run("$('#valueOp').value='lt'");assert.equal(await run("matchesExplorer({...filterEvent,value:'1000000'},explorerFilters())"),true);
 assert.equal(await run("matchesExplorer({...filterEvent,time:Date.parse('2026-11-01T14:00:00Z')},explorerFilters())"),false);
 await run("$('#dateFrom').value='2026-11-02T12:00'");assert.throws(()=>vm.runInContext('explorerFilters()',context),/anterior/);
 await run("for(const id of ['dateFrom','dateTo','explorerAsset','direction','valueFilter'])$('#'+id).value=''");
 // Rectangle selection, including the boundary and a curved mouse path.
 assert.equal(await run("pointInPolygon({x:5,y:5},[{x:0,y:0},{x:10,y:0},{x:10,y:10},{x:0,y:10}])"),true);
 assert.equal(await run("pointInPolygon({x:10,y:5},[{x:0,y:0},{x:10,y:0},{x:10,y:10},{x:0,y:10}])"),true);
 assert.equal(await run("pointInPolygon({x:15,y:5},[{x:0,y:0},{x:10,y:0},{x:10,y:10},{x:0,y:10}])"),false);
 assert.equal(await run("selectionRectangle([{x:0,y:0},{x:10,y:10}]).length"),4);
 await run("toggleGraphFullPage(true)");assert.equal(context.bodyClass.on,true);assert.equal(elements.get('#fullGraph').textContent,'↙ Voltar ao painel');await run("toggleGraphFullPage(false)");assert.equal(context.bodyClass.on,false);
 // Group drag keeps relative positions at the current zoom.
 await run("state.events={[transfer.id]:transfer};scene=buildGraphScene([{...transfer}],state.addresses);positions.clear();placeGraphNodes(scene.nodes);selectedNodes=new Set(scene.nodes.map(n=>n.id));zoom=2;pan={x:0,y:0}");
 const ids=await run('scene.nodes.map(n=>n.id)');const before=await run('scene.nodes.map(n=>({...positions.get(n.id)}))');
 context.groupDown={button:0,pointerId:5,clientX:200,clientY:100,target:{closest:q=>q==='[data-visual]'?{dataset:{visual:ids[0]}}:null}};
 await run("$('#graph').onpointerdown(groupDown);$('#graph').onpointermove({pointerId:5,clientX:240,clientY:120})");
 const after=await run('scene.nodes.map(n=>({...positions.get(n.id)}))');for(let i=0;i<after.length;i++){assert.equal(after[i].x-before[i].x,10);assert.equal(after[i].y-before[i].y,5);}await run('drag=null;selectedNodes.clear()');
 // Empty-background click clears nodes; pan and cancellation preserve them.
 context.blankDown={button:0,pointerId:7,clientX:200,clientY:100,target:{closest:()=>null}};
 await run("selectedNodes=new Set(scene.nodes.map(n=>n.id));selection={type:'nodes',addresses:scene.nodes.map(n=>n.address)};$('#graph').onpointerdown(blankDown);$('#graph').onpointerup({pointerId:7,type:'pointerup'})");assert.equal(await run('selectedNodes.size'),0);assert.equal(await run('selection'),null);assert.equal(elements.get('#detail').innerHTML.includes('Explore uma conexão'),true);
 await run("selectedNodes=new Set(scene.nodes.map(n=>n.id));$('#graph').onpointerdown(blankDown);$('#graph').onpointermove({pointerId:7,clientX:250,clientY:150});$('#graph').onpointerup({pointerId:7,type:'pointerup'})");assert.equal(await run('selectedNodes.size'),ids.length);
 await run("$('#graph').onpointerdown(blankDown);$('#graph').onpointercancel({pointerId:7,type:'pointercancel'})");assert.equal(await run('selectedNodes.size'),ids.length);
 await run("showConnection(scene.edges[0].id)");assert.equal(await run('selectedNodes.size'),0);assert.equal(await run('selection.type'),'event');
 console.log('PASS: background click deselects, panning/cancel preserve nodes, connection click deselects and opens transaction.');
 // Rectangle ignores intermediate mouse points even after a curved gesture.
 const rectangle=await run("selectionRectangle([{x:1,y:2},{x:99,y:90},{x:5,y:6}])");assert.equal(JSON.stringify(rectangle),JSON.stringify([{x:1,y:2},{x:5,y:2},{x:5,y:6},{x:1,y:6}]));
 const reverseRectangle=await run("selectionRectangle([{x:10,y:20},{x:-10,y:-20}])");assert.equal(await run("pointInPolygon({x:0,y:0},selectionRectangle([{x:10,y:20},{x:-10,y:-20}]))"),true);
 await run("state.addresses=[{address:'M',expanded:false}];state.events=Object.fromEntries(['A','B','C'].map((from,i)=>[String(i),{id:String(i),from,to:'M',hash:'0'.repeat(64),asset:'USDT',value:'1000000',time:Date.now()}]));migrateGraphSelection({events:{}});state.graphSelected={'0':true,'1':true,'2':true};renderGraph();selectedNodes=new Set(['-1:A','-1:B','-1:C'])");
 async function resetAlignment(){await run("positions.set('-1:A',{x:10,y:10});positions.set('-1:B',{x:30,y:30});positions.set('-1:C',{x:110,y:110});positions.set('0:M',{x:500,y:100});");}
 await resetAlignment();await run("alignSelectedNodes('horizontal')");assert.equal(await run("positions.get('-1:A').y"),50);assert.equal(await run("positions.get('-1:B').x"),30);assert.equal(await run("positions.get('0:M').y"),100);assert.equal(await run("state.graphPositions['-1:C'].y"),50);
 await resetAlignment();await run("alignSelectedNodes('vertical')");assert.equal(await run("positions.get('-1:A').x"),50);assert.equal(await run("positions.get('-1:B').y"),30);
 await resetAlignment();await run("alignSelectedNodes('horizontal',true)");assert.equal(await run("positions.get('-1:A').x"),10);assert.equal(await run("positions.get('-1:B').x"),60);assert.equal(await run("positions.get('-1:C').x"),110);assert.equal(await run("positions.get('-1:B').y"),50);
 await resetAlignment();await run("alignSelectedNodes('vertical',true)");assert.equal(await run("positions.get('-1:B').y"),60);assert.equal(await run("positions.get('-1:B').x"),50);
 await run("for(const id of selectedNodes)positions.set(id,{x:50,y:50});alignSelectedNodes('horizontal',true)");const xs=await run("[...selectedNodes].map(id=>positions.get(id).x).sort((a,b)=>a-b)");assert.equal(xs[1]-xs[0],90);assert.equal(xs[2]-xs[1],90);
 context.shortcut={key:'H',shiftKey:true,ctrlKey:true,preventDefault(){this.prevented=true;},stopPropagation(){},target:{closest:()=>null}};await resetAlignment();assert.equal(await run("handleGraphAlignmentKey(shortcut)"),true);assert.equal(context.shortcut.prevented,true);assert.equal(await run("positions.get('-1:B').x"),60);
 context.shortcut.target={closest:()=>({tagName:'INPUT'})};assert.equal(await run("handleGraphAlignmentKey(shortcut)"),false);
 context.shortcut.target={closest:()=>null};await run("$('#monitor').hidden=true");assert.equal(await run("handleGraphAlignmentKey(shortcut)"),false);await run("$('#monitor').hidden=false;selectedNodes=new Set(['-1:A'])");assert.equal(await run("alignSelectedNodes('horizontal')"),false);
 await run("state.addresses=[{address:transfer.to,expanded:false}];selectedNodes.clear();selection=null");
 console.log('PASS: rectangular selection in both drag directions, four alignment commands, uniform spacing, preserved extremes, untouched unselected node, saved positions, shortcuts and typing guards.');
 // Naming a counterparty must not expand or monitor it.
 await run("state.events={[transfer.id]:transfer};state.graphSelected={[transfer.id]:true};state.addresses=[{address:transfer.to,label:'Nome antigo',start:transfer.time-1000,expanded:false}];state.nodeLabels={};save=async()=>{globalThis.savedCase=structuredClone(state);};setNodeLabel(transfer.from,'  Contraparte nomeada  ')");
 assert.equal(await run('state.addresses.length'),1);assert.equal(await run('nodeLabel(transfer.from)'),'Contraparte nomeada');assert.equal(await run('savedCase.nodeLabels[transfer.from]'),'Contraparte nomeada');
 await run("showNode(transfer.from)");assert.equal(elements.get('#detail').innerHTML.includes('nodeLabelForm'),true);assert.equal(elements.get('#graph').innerHTML.includes('Contraparte nomeada'),true);
 await run("setNodeLabel(transfer.to,'Nome atualizado')");assert.equal(await run('state.addresses[0].label'),'Nome atualizado');
 await run("(async()=>{await setNodeLabel(transfer.from,'<Nome & teste>');showNode(transfer.from)})()");assert.equal(elements.get('#detail').innerHTML.includes('&lt;Nome &amp; teste&gt;'),true);
 await run("globalThis.labelBackup={version:1,addresses:structuredClone(state.addresses),events:structuredClone(state.events),rules:[],raw:[],alerts:[],timezone:state.timezone,nodeLabels:structuredClone(state.nodeLabels)};validateImport(labelBackup)");assert.equal(await run('labelBackup.nodeLabels[transfer.from]'),'<Nome & teste>');
 await assert.rejects(()=>run("setNodeLabel(transfer.from,'x'.repeat(61))"),/60/);
 await run("(async()=>{await setNodeLabel(transfer.from,'');await setNodeLabel(transfer.to,'')})()");assert.equal(await run('nodeLabel(transfer.from)'),'');assert.equal(await run('nodeLabel(transfer.to)'),'');
 console.log('PASS: names for counterparties without monitoring, monitored-name update, escaped labels, saved names, backup import and removing names.');
 // Drawer and inspector never rebuild graph state or discard explorer filters.
 await run("$('#search').value='consulta preservada';$('#explorerBody').scrollTop=140;globalThis.graphBefore=JSON.stringify([...positions]);globalThis.panBefore=JSON.stringify(pan);setExplorerOpen(true)");assert.equal(elements.get('#explorerBody').hidden,false);assert.equal(elements.get('#drawerTools').hidden,false);
 await run("setExplorerOpen(false);setExplorerOpen(true)");assert.equal(elements.get('#search').value,'consulta preservada');assert.equal(elements.get('#explorerBody').scrollTop,140);assert.equal(await run('JSON.stringify([...positions])===graphBefore&&JSON.stringify(pan)===panBefore'),true);
 await run("setInspectorOpen(false)");assert.equal(await run('workspaceUI.inspectorOpen'),false);await run("setInspectorOpen(true)");assert.equal(elements.get('#inspectorToggle').textContent,'×');
 const grip=elements.get('#drawerResize');grip.setPointerCapture=()=>{};grip.hasPointerCapture=()=>false;
 context.resizeDown={button:0,pointerId:21,clientY:500,preventDefault(){}};await run("setDrawerHeight(340);$('#drawerResize').onpointerdown(resizeDown);$('#drawerResize').onpointermove({pointerId:21,clientY:430});$('#drawerResize').onpointerup({pointerId:21})");assert.equal(await run('workspaceUI.explorerHeight'),410);assert.equal(await run('state.workspaceUI.explorerHeight'),410);
 await run("$('#drawerResize').onkeydown({key:'End',preventDefault(){}})");assert.equal(await run('workspaceUI.explorerHeight'),720);await run("$('#drawerResize').onkeydown({key:'Home',preventDefault(){}})");assert.equal(await run('workspaceUI.explorerHeight'),200);
 await run("state.workspaceUI={explorerOpen:true,explorerHeight:385,inspectorOpen:false,sidebarCollapsed:true};restoreWorkspaceUI()");assert.equal(await run('workspaceUI.explorerHeight'),385);assert.equal(await run('workspaceUI.sidebarCollapsed'),true);assert.equal(elements.get('#explorerBody').hidden,false);assert.equal(await run('normalizeWorkspaceUI(null).explorerOpen'),true);assert.equal(await run('normalizeWorkspaceUI({inspectorOpen:true}).inspectorOpen'),false);
 // Explorer width and transaction panel height follow their handles and are remembered.
 for(const id of ['#sideResize','#eventResize']){const h=elements.get(id)||(await run(`$('${id}')`));h.setPointerCapture=()=>{};h.hasPointerCapture=()=>false;}
 await run("setSideWidth(440);$('#sideResize').onpointerdown({button:0,pointerId:31,clientX:800,preventDefault(){}});$('#sideResize').onpointermove({pointerId:31,clientX:700});$('#sideResize').onpointerup({pointerId:31})");assert.equal(await run('workspaceUI.sideWidth'),540);assert.equal(await run('state.workspaceUI.sideWidth'),540);
 await run("$('#sideResize').onkeydown({key:'ArrowRight',shiftKey:false,preventDefault(){}})");assert.equal(await run('workspaceUI.sideWidth'),516);
 await run("setEventHeight(260);$('#eventResize').onpointerdown({button:0,pointerId:32,clientY:600,preventDefault(){}});$('#eventResize').onpointermove({pointerId:32,clientY:540});$('#eventResize').onpointerup({pointerId:32})");assert.equal(await run('workspaceUI.eventHeight'),320);assert.equal(await run('normalizeWorkspaceUI({sideWidth:5,eventHeight:99999}).sideWidth'),280);
 await run("$('#search').value='';setExplorerOpen(false)");console.log('PASS: drawer open/close and pointer/keyboard resize, inspector state, preserved camera/positions/filters/scroll, persisted workspace preferences.');
 // Email transport: mock provider only, no real messages sent by tests.
 let sent=[];context.fetch=async(url,options)=>{sent.push({url,body:JSON.parse(options.body)});return {ok:true,status:200,text:async()=>'OK'};};
 await run("state.emailConfig={serviceId:'service_test',templateId:'template_test',publicKey:'public_test'};state.alerts=[];state.events={};state.rules=[{id:'mail',name:'Entrada',recipient:'analista@example.com',asset:'USDT',min:'1',direction:'in',days:'all',enabled:true}];api=async()=>({data:[{}],meta:{}});normalize=async()=>[{...transfer}];");
 context.streamAddress={address:events[0].to,start:events[0].time-1000,expanded:false,streams:{usdt:{initial:false,since:events[0].time-1,window:{from:events[0].time-1000,to:events[0].time+1000,cursor:null}}}};
 await run("collect(streamAddress,'usdt')");assert.equal(sent.length,1);assert.equal(sent[0].url,'https://api.emailjs.com/api/v1.0/email/send');assert.equal(sent[0].body.template_params.to_email,'analista@example.com');assert.equal(await run("state.alerts[0].delivery.status"),'accepted');
 await run("collect(streamAddress,'usdt')");assert.equal(sent.length,1);
 await run("state.events={};state.alerts=[];streamAddress.streams.usdt={initial:true,since:streamAddress.start};collect(streamAddress,'usdt')");assert.equal(sent.length,1);assert.equal(await run('state.alerts.length'),0);
 context.fetch=async()=>({ok:false,status:429,text:async()=>'Quota exceeded'});assert.equal((await run("emailTransport(state.emailConfig,{to_email:'analista@example.com'})")).status,'rejected');
 context.fetch=async()=>{throw Error('Timeout')};assert.equal((await run("emailTransport(state.emailConfig,{to_email:'analista@example.com'})")).status,'unknown');
 // Telegram transport: mock Bot API only, no real messages sent by tests.
 let tg=[];context.fetch=async(url,options)=>{if(url.startsWith('https://api.telegram.org/')){tg.push({url,body:Object.fromEntries(options.body)});return {ok:true,status:200,json:async()=>({ok:true,result:{message_id:7}})};}return {ok:true,status:200,text:async()=>'OK'};};
 await run("state.telegramConfig={botToken:'123456789:AAbbccddeeffgghhiijjkkllmmnnooppqqr',chatId:'4242',detail:'resumo'};state.emailConfig=null;state.alerts=[];state.events={};state.rules=[{id:'tg',name:'Saída grande',asset:'USDT',min:'1',direction:'in',days:'all',enabled:true}];streamAddress.streams.usdt={initial:false,since:transfer.time-1,window:{from:transfer.time-1000,to:transfer.time+1000,cursor:null}};");
 await run("collect(streamAddress,'usdt')");assert.equal(tg.length,1);assert.equal(tg[0].url,'https://api.telegram.org/bot123456789:AAbbccddeeffgghhiijjkkllmmnnooppqqr/sendMessage');assert.equal(tg[0].body.chat_id,'4242');assert.match(tg[0].body.text,/Saída grande/);assert.match(tg[0].body.text,/Entrada: 1,00 USDT/);assert.doesNotMatch(tg[0].body.text,new RegExp(context.transfer.hash));
 assert.equal(await run("state.alerts[0].telegram.status"),'accepted');assert.equal(await run("state.alerts[0].delivery.status"),'no_recipient');
 await run("collect(streamAddress,'usdt')");assert.equal(tg.length,1);
 assert.match(await run("telegramMessage(state.alerts[0],'completo')"),new RegExp(context.transfer.hash));assert.doesNotMatch(await run("telegramMessage(state.alerts[0],'minimo')"),/USDT/);
 await run("state.alerts=[];state.events={};state.rules[0].telegram=false;streamAddress.streams.usdt={initial:false,since:transfer.time-1,window:{from:transfer.time-1000,to:transfer.time+1000,cursor:null}};collect(streamAddress,'usdt')");assert.equal(tg.length,1);assert.equal(await run("state.alerts[0].telegram"),null);
 await run("state.alerts=[];state.events={};state.rules[0].telegram=true;state.telegramConfig=null;streamAddress.streams.usdt={initial:false,since:transfer.time-1,window:{from:transfer.time-1000,to:transfer.time+1000,cursor:null}};collect(streamAddress,'usdt')");assert.equal(tg.length,1);assert.equal(await run("state.alerts[0].telegram.status"),'pending_config');
 context.fetch=async()=>({ok:false,status:401,json:async()=>({ok:false,description:'Unauthorized'})});assert.equal((await run("telegramTransport({botToken:'1:x',chatId:'1'},'t')")).status,'rejected');
 context.fetch=async()=>{throw Error('Timeout')};assert.equal((await run("telegramTransport({botToken:'1:x',chatId:'1'},'t')")).status,'unknown');
 assert.equal(await run("telegramConfigValid({botToken:'123456789:AAbbccddeeffgghhiijjkkllmmnnooppqqr',chatId:'-1001234',detail:'minimo'})"),true);assert.equal(await run("telegramConfigValid({botToken:'abc',chatId:'1'})"),false);
 assert.equal(await run("validateImport({version:1,addresses:[],events:{},rules:[],raw:[],alerts:[{id:'x',telegram:{status:'accepted'}}],timezone:'UTC',telegramConfig:{botToken:'leak'}}).telegramConfig"),undefined);
 console.log('PASS: mocked Telegram dispatch, summary/minimal/full content, deduplication, per-rule switch, missing config, rejection, uncertain delivery, token kept out of imports.');
 console.log('PASS: explorer dates/direction/asset/exact values, polygon selection, full-page return, group drag, mocked email detection dispatch/deduplication, no historical email, quota and uncertain delivery.');
 console.log('PASS: per-asset totals, optional date range, latest connection transaction, movement switcher, reverse-direction isolation, date-toggle preference.');
 console.log('PASS: graph lanes, bidirectional counterpart roles, actual edge directions, stable positions, saved positions, drag at zoom with SVG coordinate conversion.');
 // Imported annotations are sanitised: unknown colours/shapes, bad addresses, self arrows and over-long text are dropped or trimmed.
 const T='TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',U='TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7';context.junk={events:{e1:{}},graphHidden:{[T]:{events:['e1','missing']},bad:{events:[]}},nodeStyles:{[T]:{color:'#e5534b',shape:'diamond'},[U]:{color:'red',shape:'star'}},nodeComments:{[T]:'x'.repeat(900),[U]:'  '},customArrows:[{id:'a',from:T,to:U,label:'l'},{id:'b',from:T,to:T},{id:'c',from:'x',to:U}]};
 const clean=await run('sanitizeGraphAnnotations(junk)');
 assert.deepEqual(Object.keys(clean.graphHidden),[T]);assert.deepEqual([...clean.graphHidden[T].events],['e1']);assert.deepEqual(Object.keys(clean.nodeStyles),[T]);assert.equal(clean.nodeComments[T].length,500);assert.equal(clean.nodeComments[U],undefined);assert.deepEqual(clean.customArrows.map(a=>a.id),['a']);
 console.log('PASS: imported node annotations (hidden nodes, colours, shapes, comments, custom arrows) are sanitised.');
 console.log('PASS: checksum, Base58, fuso, valores exatos, log USDT real, deduplicação de alertas, direção, falhas, janela noturna, HTTP 429.');
})().catch(e=>{console.error(e);process.exitCode=1;});

// Update category from detail view
function pmUpdateCategory(newCategory) {
  if (!selectedTicket) return;
  selectedTicket.category = newCategory;
  // Update in TICKETS array
  const idx = TICKETS.findIndex(t => t.id === selectedTicket.id);
  if (idx !== -1) {
    TICKETS[idx].category = newCategory;
    saveTickets();
  }
  renderDetail();
}
// pm-view.js — PM View functionality
// All JavaScript for PM dashboard

// ═══════════════════════════════════════════════════════
// CONSTANTS & STATE
// ═══════════════════════════════════════════════════════
const TICKETS_KEY = 'servicedesk_tickets';
const NOTIFS_KEY  = 'servicedesk_notifs';
const NOTES_KEY   = 'servicedesk_internal_notes'; // PM-only
const AGENTS      = ['Sarah Johnson','Alex Lee','Priya Patel','David Kim','Emma Brown'];
const AGENT_COLORS= ['#3b7cf4','#16a34a','#ea580c','#7c3aed','#dc2626'];
const STATUS_CLASS= {Open:'primary text-white','In Progress':'warning text-dark',Resolved:'success text-white',Closed:'secondary text-white'};
const PRIO_STYLE  = {Critical:'background:#ffe4e6;color:#be123c',High:'background:#ffedd5;color:#9a3412',Medium:'background:#fef9c3;color:#78350f',Low:'background:#f0fdf4;color:#14532d'};
const PAGE_SIZE   = 8;

let PM_USER  = 'Rachel Morgan';
let TICKETS  = [];
let NOTIFS   = [];
let NOTES    = {}; // { ticketId: [{author,time,text}] }
let commentsMap = {};
let selectedTicket = null;
let pmOffcanvas    = null;
let pmPage = 1, pmSortField = 'id', pmSortDir = 1;
let pmFStatus='', pmFPriority='', pmFClient='', pmFAssignee='', pmFSearch='';
let charts = {};

const initials = n => n.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);

function loadData() {
  try { TICKETS = JSON.parse(localStorage.getItem(TICKETS_KEY)) || []; } catch(e){ TICKETS=[]; }
  try { NOTIFS  = JSON.parse(localStorage.getItem(NOTIFS_KEY))  || []; } catch(e){ NOTIFS=[];  }
  try { NOTES   = JSON.parse(localStorage.getItem(NOTES_KEY))   || {}; } catch(e){ NOTES={};   }
  TICKETS.forEach(t => commentsMap[t.id] = [...(t.comments||[])]);
}
function saveTickets() { localStorage.setItem(TICKETS_KEY, JSON.stringify(TICKETS)); }
function saveNotifs()  { localStorage.setItem(NOTIFS_KEY,  JSON.stringify(NOTIFS));  }
function saveNotes()   { localStorage.setItem(NOTES_KEY,   JSON.stringify(NOTES));   }

// ═══════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', function() {
  loadData();
  // Ensure NOTIFS is loaded from storage if not already
  if (!Array.isArray(NOTIFS) || !NOTIFS.length) {
    try { NOTIFS = JSON.parse(localStorage.getItem(NOTIFS_KEY)) || []; } catch(e){ NOTIFS=[]; }
  }

  // For compatibility with client view
  function saveNotifsToStorage() { localStorage.setItem(NOTIFS_KEY, JSON.stringify(NOTIFS)); }
  pmOffcanvas = new bootstrap.Offcanvas(document.getElementById('ticketOffcanvas'));
  initSidebar();
  initScreenshots();
  showSection('overview');
  renderNotifList();
  
  // Allow Enter to submit comment, Shift+Enter for newline
  var commentBox = document.getElementById('newComment');
  if (commentBox) {
    commentBox.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        pmSubmitComment();
      }
    });
  }
});

function doLogout() {
  window.location.href = 'index.html';
}

// ═══════════════════════════════════════════════════════
// SIDEBAR COLLAPSE (same logic as main.js)
// ═══════════════════════════════════════════════════════
function initSidebar() {
  const sb  = document.getElementById('sidebar');
  const btn = document.getElementById('sidebarToggle');
  if (!sb || !btn) return;
  if (localStorage.getItem('servicedesk_sidebar_collapsed') === 'true') sb.classList.add('collapsed');
  btn.addEventListener('click', () => {
    sb.classList.toggle('collapsed');
    localStorage.setItem('servicedesk_sidebar_collapsed', sb.classList.contains('collapsed'));
  });
}

// ═══════════════════════════════════════════════════════
// SECTION NAV
// ═══════════════════════════════════════════════════════
const SECTIONS = ['overview','tickets','workload','analytics'];
function showSection(id, e) {
  if (e) e.preventDefault();
  SECTIONS.forEach(s => {
    document.getElementById('sec-'+s).classList.add('d-none');
    document.getElementById('nav-'+s)?.classList.remove('active');
  });
  document.getElementById('sec-'+id).classList.remove('d-none');
  document.getElementById('nav-'+id)?.classList.add('active');
  const titles = {overview:'Dashboard',tickets:'All Tickets',workload:'Team Workload',analytics:'Analytics'};
  document.getElementById('topbarTitle').textContent = titles[id]||id;
  // Render section content
  if (id==='overview')  renderOverview();
  if (id==='tickets')   pmRender();
  if (id==='workload')  renderWorkload();
  if (id==='analytics') renderAnalytics();
  return false;
}

// ═══════════════════════════════════════════════════════
// BADGE HELPERS
// ═══════════════════════════════════════════════════════
function statusBadge(s) {
  const [bg,tc] = (STATUS_CLASS[s]||'secondary text-white').split(' ');
  return `<span class="badge bg-${bg} ${tc||''} rounded-pill" style="font-size:11px">${s}</span>`;
}
function prioBadge(p) {
  return `<span class="badge rounded-pill" style="${PRIO_STYLE[p]||PRIO_STYLE.Low};font-size:11px">${p}</span>`;
}
function catBadge(c) {
  const map = {Bug:'#ffe4e6|#be123c',Task:'#eff4ff|#3b7cf4','Feature Request':'#e0f2fe|#0369a1','Performance Issue':'#fef9c3|#78350f','Account Issue':'#ede9fe|#6d28d9',Other:'#f3e8ff|#a21caf'};
  const icon = {Bug:'bi-bug',Task:'bi-list-task','Feature Request':'bi-stars','Performance Issue':'bi-speedometer2','Account Issue':'bi-person-badge',Other:'bi-three-dots'};
  const [bg,fg] = (map[c]||'#eff4ff|#3b7cf4').split('|');
  return `<span class="badge rounded-pill" style="background:${bg};color:${fg};font-size:11px"><i class="bi ${icon[c]||'bi-check2-square'} me-1"></i>${c||'—'}</span>`;
}

// ═══════════════════════════════════════════════════════
// OVERVIEW
// ═══════════════════════════════════════════════════════
function renderOverview() {
  const total    = TICKETS.length;
  const open     = TICKETS.filter(t=>t.status==='Open').length;
  const inprog   = TICKETS.filter(t=>t.status==='In Progress').length;
  const resolved = TICKETS.filter(t=>t.status==='Resolved').length;
  const closed   = TICKETS.filter(t=>t.status==='Closed').length;
  const critical = TICKETS.filter(t=>t.priority==='Critical').length;
  document.getElementById('ovTotal').textContent    = total;
  document.getElementById('ovOpen').textContent     = open;
  document.getElementById('ovInProg').textContent   = inprog;
  document.getElementById('ovResolved').textContent = resolved;
  document.getElementById('ovClosed').textContent   = closed;
  document.getElementById('ovCritical').textContent = critical;
  document.getElementById('sidebarOpenCount').textContent = total;

  // Urgent list
  const urgent = TICKETS.filter(t=>['Critical','High'].includes(t.priority)&&!['Resolved','Closed'].includes(t.status)).slice(0,6);
  document.getElementById('urgentList').innerHTML = urgent.length===0
    ? '<p class="text-muted text-center py-4 mb-0" style="font-size:13px">No urgent tickets 🎉</p>'
    : urgent.map(t=>`
        <div class="d-flex align-items-start gap-3 px-4 py-3 border-bottom" style="cursor:pointer" onclick="openDetail('${t.id}')">
          <div class="flex-grow-1">
            <div class="d-flex gap-2 mb-1">${prioBadge(t.priority)} ${statusBadge(t.status)}</div>
            <div class="fw-semibold" style="font-size:13px;color:#1a2235">${t.title}</div>
            <div class="text-muted mt-1" style="font-size:11.5px"><i class="bi bi-person me-1"></i>${t.reporter} · <i class="bi bi-person-fill-check me-1"></i>${t.assignee}</div>
          </div>
        </div>`).join('');

  // Activity feed (static + recent)
  const activities = [
    {icon:'bi-plus-lg',bg:'#e0f2fe',fg:'#0284c7',text:`<b>${PM_USER}</b> opened PM Dashboard`,time:'Just now'},
    ...NOTIFS.slice(0,7).map(n=>({icon:n.icon,bg:n.bg,fg:n.fg,text:n.body,time:n.time}))
  ];
  document.getElementById('activityFeed').innerHTML = activities.map(a=>`
    <div class="d-flex align-items-start gap-3 px-4 py-3 border-bottom">
      <div style="width:30px;height:30px;border-radius:8px;background:${a.bg};color:${a.fg};display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:13px"><i class="bi ${a.icon}"></i></div>
      <div>
        <div style="font-size:12.5px;color:#1a2235">${a.text}</div>
        <div class="text-muted" style="font-size:11px">${a.time}</div>
      </div>
    </div>`).join('');

  // Charts
  setTimeout(() => {
    destroyChart('chartStatus');
    destroyChart('chartPriority');
    destroyChart('chartCategory');
    charts.chartStatus = new Chart(document.getElementById('chartStatus'), {
      type:'doughnut',
      data:{
        labels:['Open','In Progress','Resolved','Closed'],
        datasets:[{data:[open,inprog,resolved,closed],backgroundColor:['#3b7cf4','#eab308','#22c55e','#94a3b8'],borderWidth:0,hoverOffset:6}]
      },
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'right',labels:{font:{family:'Plus Jakarta Sans',size:12},padding:12}}}}
    });
    const pCounts = ['Critical','High','Medium','Low'].map(p=>TICKETS.filter(t=>t.priority===p).length);
    charts.chartPriority = new Chart(document.getElementById('chartPriority'), {
      type:'bar',
      data:{
        labels:['Critical','High','Medium','Low'],
        datasets:[{data:pCounts,backgroundColor:['#ffe4e6','#ffedd5','#fef9c3','#f0fdf4'],borderColor:['#be123c','#9a3412','#78350f','#14532d'],borderWidth:1.5,borderRadius:7}]
      },
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,grid:{color:'#f0f2f8'},ticks:{font:{family:'Plus Jakarta Sans'}}},x:{grid:{display:false},ticks:{font:{family:'Plus Jakarta Sans'}}}}}
    });
    const cats=['Bug','Task','Feature Request','Performance Issue','Account Issue','Other'];
    const cCounts=cats.map(c=>TICKETS.filter(t=>t.category===c).length);
    charts.chartCategory = new Chart(document.getElementById('chartCategory'), {
      type:'bar',
      data:{labels:cats.map(c=>c.length>10?c.substring(0,10)+'…':c),datasets:[{data:cCounts,backgroundColor:'rgba(59,124,244,0.75)',borderRadius:7}]},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,grid:{color:'#f0f2f8'},ticks:{font:{family:'Plus Jakarta Sans'}}},x:{grid:{display:false},ticks:{font:{family:'Plus Jakarta Sans',size:10}}}}}
    });
  }, 60);
}

// ═══════════════════════════════════════════════════════
// ALL TICKETS TABLE
// ═══════════════════════════════════════════════════════
function onSearch(v) { pmFSearch = v.trim().toLowerCase(); pmPage=1; pmRender(); }
function pmSort(f) { pmSortDir = pmSortField===f ? -pmSortDir : 1; pmSortField=f; pmPage=1; pmRender(); }
function pmGetFiltered() {
  let list = [...TICKETS];
  const sf = document.getElementById('pmFStatus')?.value||'';
  const pf = document.getElementById('pmFPriority')?.value||'';
  const cf = document.getElementById('pmFClient')?.value||'';
  const af = document.getElementById('pmFAssignee')?.value||'';
  if (sf) list = list.filter(t=>t.status===sf);
  if (pf) list = list.filter(t=>t.priority===pf);
  if (cf) list = list.filter(t=>t.reporter===cf);
  if (af) list = list.filter(t=>t.assignee===af);
  if (pmFSearch) list = list.filter(t=>
    t.id.toLowerCase().includes(pmFSearch)||
    t.title.toLowerCase().includes(pmFSearch)||
    (t.reporter||'').toLowerCase().includes(pmFSearch)||
    t.assignee.toLowerCase().includes(pmFSearch)
  );
  return list.sort((a,b)=>((a[pmSortField]||'').localeCompare(b[pmSortField]||''))*pmSortDir);
}
function pmGoPage(p) {
  const total = Math.max(1, Math.ceil(pmGetFiltered().length/PAGE_SIZE));
  if (p<1||p>total) return;
  pmPage=p; pmRender();
}
function pmRender() {
  const all = pmGetFiltered(), total = all.length;
  const maxPage = Math.max(1, Math.ceil(total/PAGE_SIZE));
  if (pmPage>maxPage) pmPage=maxPage;
  const start = (pmPage-1)*PAGE_SIZE, slice = all.slice(start, start+PAGE_SIZE);
  const tbody = document.getElementById('pmTableBody');
  const empty = document.getElementById('pmEmptyState');
  document.getElementById('pmTicketCount').textContent = total+' found';
  document.getElementById('pmPageFrom').textContent  = total ? start+1 : 0;
  document.getElementById('pmPageTo').textContent    = Math.min(start+PAGE_SIZE, total);
  document.getElementById('pmPageTotal').textContent = total;
  document.getElementById('pmPageControls').innerHTML = renderPagination(pmPage, total);
  if (!slice.length) { tbody.innerHTML=''; empty.classList.remove('d-none'); return; }
  empty.classList.add('d-none');
  tbody.innerHTML = slice.map(t=>`
    <tr onclick="openDetail('${t.id}')" style="cursor:pointer">
      <td><span class="ticket-id">${t.id}</span></td>
      <td class="fw-medium" style="color:#1a2235">${t.title}</td>
      <td>${statusBadge(t.status)}</td>
      <td>${prioBadge(t.priority)}</td>
      <td>${catBadge(t.category)}</td>
      <td style="font-size:12.5px">
        <div class="d-flex align-items-center gap-2">
          <div class="avatar-sm" style="background:#e0e7ef;color:#3b3b4f;width:22px;height:22px;font-size:9px;border-radius:7px">${initials(t.reporter||'?')}</div>
          ${t.reporter||'—'}
        </div>
      </td>
     <td style="font-size:13px">
        <div class="d-flex align-items-center gap-2">
          <div class="avatar-sm" style="background:#e0e7ef;color:#3b3b4f;width:22px;height:22px;font-size:9px;border-radius:7px">${initials(t.assignee||'?')}</div>
          ${t.assignee || '—'}
        </div>
      </td>
      <td class="text-muted" style="font-size:12px">${t.created}</td>
    </tr>`).join('');
  document.getElementById('sidebarOpenCount').textContent = TICKETS.length;
}
function renderPagination(page, total) {
  const maxPage = Math.max(1, Math.ceil(total/PAGE_SIZE));
  let h = `<button class="page-btn" onclick="pmGoPage(${page-1})" ${page===1?'disabled':''}><i class="bi bi-chevron-left"></i></button>`;
  let s=Math.max(1,page-2), e=Math.min(maxPage,s+4); s=Math.max(1,e-4);
  for(let i=s;i<=e;i++) h+=`<button class="page-btn ${i===page?'active':''}" onclick="pmGoPage(${i})">${i}</button>`;
  h+=`<button class="page-btn" onclick="pmGoPage(${page+1})" ${page===maxPage?'disabled':''}><i class="bi bi-chevron-right"></i></button>`;
  return h;
}
function quickReassign(id, agent) {
  const t = TICKETS.find(t=>t.id===id); if(!t) return;
  t.assignee = agent;
  const time = new Date().toLocaleString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
  t.activity = t.activity||[];
  t.activity.unshift({type:'assignee',author:PM_USER,action:'reassigned to',value:agent,time});
  NOTIFS.unshift({id:Date.now(),icon:'bi-person-check-fill',bg:'#e0e7ff',fg:'#3730a3',title:'Reassigned: '+id,body:PM_USER+' assigned to '+agent,time,unread:true,ticketId:id});
  saveTickets(); saveNotifs(); renderNotifList();
  pmRender();
  showToast({
    type: 'info',
    title: 'Reassigned',
    message: id + ': ' + PM_USER + ' reassign the ticket to ' + agent
  });
}

// ═══════════════════════════════════════════════════════
// TEAM WORKLOAD
// ═══════════════════════════════════════════════════════
function renderWorkload() {
  const acEl = document.getElementById('agentCards');
  const wlEl = document.getElementById('workloadTableBody');
  acEl.innerHTML = AGENTS.map((agent,i)=>{
    const my  = TICKETS.filter(t=>t.assignee===agent);
    const op  = my.filter(t=>t.status==='Open').length;
    const ip  = my.filter(t=>t.status==='In Progress').length;
    const rs  = my.filter(t=>t.status==='Resolved').length;
    const cl  = my.filter(t=>t.status==='Closed').length;
    const util= Math.min(100, Math.round(((op+ip)/6)*100));
    const uc  = util<40?'#16a34a':util<75?'#d97706':'#dc2626';
    return `<div class="col-4">
      <div class="agent-card">
        <div class="d-flex align-items-center gap-3 mb-3">
          <div class="agent-avatar" style="background:${AGENT_COLORS[i]}">${initials(agent)}</div>
          <div>
            <div class="fw-bold" style="font-size:14px;color:#1a2235">${agent}</div>
            <div class="text-muted" style="font-size:11.5px">Support Agent</div>
          </div>
        </div>
        <div class="row g-2 mb-3 text-center">
          <div class="col-3"><div class="fw-bold" style="font-size:20px;color:#3b7cf4;font-family:'JetBrains Mono',monospace">${op}</div><div class="text-muted" style="font-size:10.5px">Open</div></div>
          <div class="col-3"><div class="fw-bold" style="font-size:20px;color:#d97706;font-family:'JetBrains Mono',monospace">${ip}</div><div class="text-muted" style="font-size:10.5px">In Prog.</div></div>
          <div class="col-3"><div class="fw-bold" style="font-size:20px;color:#16a34a;font-family:'JetBrains Mono',monospace">${rs}</div><div class="text-muted" style="font-size:10.5px">Resolved</div></div>
          <div class="col-3"><div class="fw-bold" style="font-size:20px;color:#64748b;font-family:'JetBrains Mono',monospace">${cl}</div><div class="text-muted" style="font-size:10.5px">Closed</div></div>
        </div>
        <div class="d-flex justify-content-between mb-1"><span style="font-size:11.5px;color:#7a8599">Utilization</span><span style="font-size:11.5px;font-weight:700;color:${uc}">${util}%</span></div>
        <div class="util-bar-wrap"><div class="util-bar" style="width:${util}%;background:${uc}"></div></div>
      </div>
    </div>`;
  }).join('');

  wlEl.innerHTML = AGENTS.map((agent,i)=>{
    const my  = TICKETS.filter(t=>t.assignee===agent);
    const op  = my.filter(t=>t.status==='Open').length;
    const ip  = my.filter(t=>t.status==='In Progress').length;
    const rs  = my.filter(t=>t.status==='Resolved').length;
    const cl  = my.filter(t=>t.status==='Closed').length;
    const util= Math.min(100, Math.round(((op+ip)/6)*100));
    return `<tr>
      <td><div class="d-flex align-items-center gap-2"><div class="avatar-sm" style="background:${AGENT_COLORS[i]};width:28px;height:28px;font-size:10px">${initials(agent)}</div><span class="fw-semibold" style="font-size:13px">${agent}</span></div></td>
      <td><span class="wl-stat">${my.length}</span></td>
      <td><span class="wl-stat" style="color:#3b7cf4">${op}</span></td>
      <td><span class="wl-stat" style="color:#d97706">${ip}</span></td>
      <td><span class="wl-stat" style="color:#16a34a">${rs}</span></td>
      <td><span class="wl-stat" style="color:#64748b">${cl}</span></td>
      <td>
        <div class="d-flex align-items-center gap-2">
          <div class="progress flex-grow-1" style="height:6px"><div class="progress-bar" style="width:${util}%;background:${AGENT_COLORS[i]}"></div></div>
          <span style="font-size:12px;font-weight:700;min-width:36px">${util}%</span>
        </div>
      </td>
    </tr>`;
  }).join('');
}

// ═══════════════════════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════════════════════
function renderAnalytics() {
  const total  = TICKETS.length;
  const done   = TICKETS.filter(t=>['Resolved','Closed'].includes(t.status)).length;
  const critOp = TICKETS.filter(t=>t.priority==='Critical'&&t.status==='Open').length;
  document.getElementById('anTotal').textContent   = total;
  document.getElementById('anRate').textContent    = total ? Math.round((done/total)*100)+'%' : '0%';
  document.getElementById('anCritOpen').textContent= critOp;

  setTimeout(()=>{
    ['chartClient','chartAgent','chartTrend'].forEach(id=>destroyChart(id));
    const clients = ['John Client','Maria Santos','Carlos Reyes','Ana Rivera','Ben Cruz'];
    charts.chartClient = new Chart(document.getElementById('chartClient'), {
      type:'bar',
      data:{labels:clients.map(c=>c.split(' ')[0]),datasets:[{label:'Tickets',data:clients.map(c=>TICKETS.filter(t=>t.reporter===c).length),backgroundColor:AGENT_COLORS,borderRadius:7}]},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,grid:{color:'#f0f2f8'},ticks:{font:{family:'Plus Jakarta Sans'}}},x:{grid:{display:false},ticks:{font:{family:'Plus Jakarta Sans'}}}}}
    });
    charts.chartAgent = new Chart(document.getElementById('chartAgent'), {
      type:'bar',
      data:{labels:AGENTS.map(a=>a.split(' ')[0]),datasets:[{label:'Resolved/Closed',data:AGENTS.map(a=>TICKETS.filter(t=>t.assignee===a&&['Resolved','Closed'].includes(t.status)).length),backgroundColor:AGENT_COLORS,borderRadius:7}]},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,grid:{color:'#f0f2f8'},ticks:{font:{family:'Plus Jakarta Sans'}}},x:{grid:{display:false},ticks:{font:{family:'Plus Jakarta Sans'}}}}}
    });
    // trend line (last 14 days – synthetic)
    const days=[], opened=[], resolved=[];
    for(let i=13;i>=0;i--){ const d=new Date(); d.setDate(d.getDate()-i); days.push(d.toLocaleDateString('en-US',{month:'short',day:'numeric'})); }
    const seed=[2,1,3,2,1,4,2,3,1,2,2,3,1,2];
    const rseed=[0,1,1,2,1,1,2,1,2,1,1,2,1,1];
    charts.chartTrend = new Chart(document.getElementById('chartTrend'), {
      type:'line',
      data:{labels:days,datasets:[
        {label:'Opened',data:seed,borderColor:'#dc2626',backgroundColor:'rgba(220,38,38,0.07)',fill:true,tension:0.4,pointBackgroundColor:'#dc2626',pointRadius:4},
        {label:'Resolved',data:rseed,borderColor:'#16a34a',backgroundColor:'rgba(22,163,74,0.07)',fill:true,tension:0.4,pointBackgroundColor:'#16a34a',pointRadius:4}
      ]},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top',labels:{font:{family:'Plus Jakarta Sans',size:12}}}},scales:{y:{beginAtZero:true,grid:{color:'#f0f2f8'},ticks:{font:{family:'Plus Jakarta Sans'},stepSize:1}},x:{grid:{display:false},ticks:{font:{family:'Plus Jakarta Sans',size:11}}}}}
    });
  },60);
}

function destroyChart(id) { if(charts[id]){ try{charts[id].destroy();}catch(e){} delete charts[id]; }}

// ═══════════════════════════════════════════════════════
// TICKET DETAIL OFFCANVAS
// ═══════════════════════════════════════════════════════
function openDetail(id) {
  console.log('openDetail called with id:', id);
  if (!id) {
    console.warn('No ticket ID provided');
    return;
  }
  selectedTicket = TICKETS.find(t=>t.id===id);
  if (!selectedTicket) {
    console.warn('Ticket not found:', id);
    return;
  }
  
  document.getElementById('detailTid').textContent      = selectedTicket.id;
  document.getElementById('detailStatus').value         = selectedTicket.status;
  document.getElementById('detailPriority').value       = selectedTicket.priority;
  document.getElementById('newComment').value           = '';
  renderDetail();
  pmOffcanvas.show();
}
function renderDetail() {
  const t   = selectedTicket;
  const cms = commentsMap[t.id]||[];
  const nts = NOTES[t.id]||[];


    const commentsHTML = cms.length
      ? cms.map(c=>`
          <div class="d-flex gap-2 mb-3">
            <div class="avatar-sm ${c.role==='support'?'green':''} flex-shrink-0">${initials(c.author)}</div>
            <div class="flex-grow-1">
              <div class="d-flex align-items-center gap-2 mb-1">
                <span class="fw-bold" style="font-size:12.5px">${c.author}</span>
                <span class="comment-role-badge ${c.role}">${c.role==='client'?'Client':'Support'}</span>
                <span class="text-muted ms-auto" style="font-size:11px">${c.time}</span>
              </div>
              <p class="mb-0 comment-text" style="font-size:13px;color:#3a4560">${c.text}</p>
            </div>
          </div>`)
        .join('')
      : '<p class="text-muted mb-0" style="font-size:13px">No comments yet.</p>';
  const notesHTML = nts.length
    ? nts.map(n=>`<div class="internal-note mb-2"><div class="internal-note-meta">🔒 ${n.author} · ${n.time}</div><div class="internal-note-text">${n.text}</div></div>`).join('')
    : '<p class="text-muted" style="font-size:13px">No internal notes yet.</p>';

  const actHTML = t.activity&&t.activity.length
    ? `<div class="mb-4"><h6 class="fw-bold mb-2" style="font-size:14px">Activity Log</h6>
        ${t.activity.map(a=>`<div style="font-size:12.5px;color:#7a8599;margin-bottom:6px"><span style="font-weight:600;color:#3b7cf4">${a.author}</span> ${a.action} <b>${a.value||''}</b> <span style="font-size:11px;color:#bfc6d1">${a.time}</span></div>`).join('')}
       </div>` : '';

  document.getElementById('detailBody').innerHTML = `
    <span class="ticket-id" style="font-family:'JetBrains Mono',monospace;margin-bottom:10px;display:inline-block">${t.id}</span>
    <h5 class="fw-bold mb-3" style="font-size:18px;line-height:1.3">${t.title}</h5>
    <div class="d-flex gap-2 mb-3">${statusBadge(t.status)} ${prioBadge(t.priority)}</div>
    <div class="detail-desc p-3 mb-3 rounded-3">${t.desc}</div>
    <div class="row g-3 mb-3">
      <div class="col-6">
        <p class="text-uppercase text-muted fw-semibold mb-1" style="font-size:10.5px;letter-spacing:.6px">Assignee</p>
        <div class="d-flex align-items-center gap-2">
          <div class="avatar-sm ${t.ac||''}" style="width:22px;height:22px;font-size:9px">${initials(t.assignee)}</div>
          <span id="assigneeDisplay" style="cursor:pointer;text-decoration:underline dotted; font-size:13px;" title="Click to change">${t.assignee}</span>
          <select id="assigneeSelect" class="form-select form-select-sm d-none" style="width:auto;min-width:130px;font-size:13px">
            ${AGENTS.map(a=>`<option value="${a}" ${a===t.assignee?'selected':''}>${a}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="col-6">
        <p class="text-uppercase text-muted fw-semibold mb-1" style="font-size:10.5px;letter-spacing:.6px">Created</p>
        <div class="fw-semibold" style="font-size:13px">${t.created}</div>
      </div>
        <div class="col-6">
          <p class="text-uppercase text-muted fw-semibold mb-1" style="font-size:10.5px;letter-spacing:.6px">Reporter</p>
          <div class="fw-semibold d-flex align-items-center gap-2" style="font-size:13px">
            <div class="avatar-sm" style="background:#e0e7ef;color:#3b3b4f;width:22px;height:22px;font-size:9px;border-radius:7px">${initials(t.reporter||'?')}</div>
            ${t.reporter||'—'}
          </div>
        </div>
        <div class="col-6">
          <p class="text-uppercase text-muted fw-semibold mb-1" style="font-size:10.5px;letter-spacing:.6px">Category</p>
          <div class="fw-semibold" style="font-size:13px">
            <span id="categoryDisplay" style="cursor:pointer;text-decoration:underline dotted;">${t.category || '—'}</span>
            <select id="categorySelect" class="form-select form-select-sm d-none" style="width:auto;min-width:120px;font-size:13px;">
              <option value="Bug">Bug</option>
              <option value="Task">Task</option>
              <option value="Feature Request">Feature Request</option>
              <option value="Performance Issue">Performance Issue</option>
              <option value="Account Issue">Account Issue</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
    </div>
    <ul class="nav nav-tabs mb-3" role="tablist">
      <li class="nav-item"><button class="nav-link active" data-bs-toggle="tab" data-bs-target="#dtAll" type="button" style="font-size:13px">All</button></li>
      <li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#dtWorklog" type="button" style="font-size:13px">Worklog</button></li>
      <li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#dtComments" type="button" style="font-size:13px">Comments</button></li>
      <li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#dtNotes" type="button" style="font-size:13px"><i class="bi bi-lock-fill me-1 text-warning" style="font-size:11px"></i>Internal Notes</button></li>
    </ul>
    <div class="tab-content">
      <div class="tab-pane fade show active" id="dtAll">
        ${actHTML}
        <p class="fw-bold mb-2 mt-1" style="font-size:13px">Comments (${cms.length})</p>
        ${commentsHTML}
      </div>
      <div class="tab-pane fade" id="dtWorklog">
        ${actHTML || '<p class="text-muted">No worklog yet.</p>'}
      </div>
      <div class="tab-pane fade" id="dtComments">
        <p class="fw-bold mb-2" style="font-size:13px">Comments (${cms.length})</p>
        ${commentsHTML}
      </div>
      <div class="tab-pane fade" id="dtNotes">
        <div class="internal-badge"><i class="bi bi-lock-fill me-1"></i>PM Only — Not visible to client</div>
        ${notesHTML}
        <div class="mt-3">
          <label class="form-label">Add Internal Note</label>
          <textarea class="form-control rounded-3 mb-2" id="newNote" rows="2" style="font-size:13px;font-family:inherit;resize:none" placeholder="Private note for the team..."></textarea>
          <button class="btn btn-sm btn-outline-secondary rounded-2 fw-semibold" onclick="pmAddNote()"><i class="bi bi-plus me-1"></i>Add Note</button>
        </div>
      </div>
    </div>
  `;
  var assigneeDisplay = document.getElementById('assigneeDisplay');
    var assigneeSelect = document.getElementById('assigneeSelect');
      if (assigneeDisplay && assigneeSelect) {
        assigneeDisplay.onclick = function() {
          assigneeDisplay.classList.add('d-none');
            assigneeSelect.classList.remove('d-none');
            assigneeSelect.value = t.assignee;
            assigneeSelect.focus();
          };
          assigneeSelect.onblur = function() {
            assigneeSelect.classList.add('d-none');
            assigneeDisplay.classList.remove('d-none');
          };
          assigneeSelect.onchange = function() {
            var newAssignee = assigneeSelect.value;
            if (newAssignee !== t.assignee) {
              quickReassign(t.id, newAssignee);
              selectedTicket.assignee = newAssignee;
              renderDetail();
            }
            assigneeSelect.classList.add('d-none');
            assigneeDisplay.classList.remove('d-none');
          };
        }
  document.getElementById('detailStatus').value   = t.status;
  document.getElementById('detailPriority').value = t.priority;

  // Attach click-to-edit handler for category (always after HTML is set)
  var catDisplay = document.getElementById('categoryDisplay');
  var catSelect = document.getElementById('categorySelect');
  if (catDisplay && catSelect) {
    catDisplay.onclick = function() {
      catDisplay.classList.add('d-none');
      catSelect.classList.remove('d-none');
      catSelect.value = t.category;
      catSelect.focus();
    };
    catSelect.onblur = function() {
      catSelect.classList.add('d-none');
      catDisplay.classList.remove('d-none');
    };
    catSelect.onchange = function() {
      var newCategory = catSelect.value;
      if (!selectedTicket) return;
      if (newCategory !== selectedTicket.category) {
        selectedTicket.category = newCategory;
        const idx = TICKETS.findIndex(t => t.id === selectedTicket.id);
        if (idx !== -1) {
          TICKETS[idx].category = newCategory;
          saveTickets();
        }
        // Add notification for category change
        const time = new Date().toLocaleString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
        NOTIFS.unshift({
          id: Date.now(),
          icon: 'bi-tags-fill',
          bg: '#ede9fe',
          fg: '#6d28d9',
          title: 'Category: ' + selectedTicket.id,
          body: PM_USER + ' set category to ' + newCategory,
          time,
          unread: true,
          ticketId: selectedTicket.id
        });
        renderNotifList && renderNotifList();
        showToast({
          type: 'info',
          title: 'Category updated',
          message: selectedTicket.id + ': ' + PM_USER + ' set category to ' + newCategory
        });
        if (typeof pmRender === 'function') pmRender();
        renderDetail();
      } else {
        catSelect.classList.add('d-none');
        catDisplay.classList.remove('d-none');
      }
    };
  }
  // Attach Enter-to-submit for internal notes
  setTimeout(function() {
    var noteBox = document.getElementById('newNote');
    if (noteBox) {
      noteBox.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          pmAddNote();
        }
      });
    }
  }, 0);
}

function pmUpdateStatus(v) {
  if (!selectedTicket) return;
  const t = TICKETS.find(x=>x.id===selectedTicket.id); if(!t) return;
  const prevStatus = selectedTicket.status;
  t.status = selectedTicket.status = v;
  const time = new Date().toLocaleString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
  t.activity = t.activity||[];
  t.activity.unshift({type:'status',author:PM_USER,action:'set status to',value:v,time});
  NOTIFS.unshift({id:Date.now(),icon:'bi-arrow-clockwise',bg:'#fef9c3',fg:'#92400e',title:'Status: '+t.id,body:PM_USER+' set status to '+v,time,unread:true,ticketId:t.id});
  saveTickets(); saveNotifs(); renderDetail(); renderNotifList();
  showToast({
    type: 'info',
    title: 'Status updated',
    message: t.id + ' ' + PM_USER + ' changed status from ' + prevStatus + ' to ' + v
  });
  if (document.getElementById('sec-tickets').offsetParent!==null) pmRender();
}
function pmUpdatePriority(v) {
  if (!selectedTicket) return;
  const t = TICKETS.find(x=>x.id===selectedTicket.id); if(!t) return;
  const prevPriority = selectedTicket.priority;
  t.priority = selectedTicket.priority = v;
  const time = new Date().toLocaleString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
  t.activity = t.activity||[];
  t.activity.unshift({type:'priority',author:PM_USER,action:'set priority to',value:v,time});
  NOTIFS.unshift({id:Date.now(),icon:'bi-flag-fill',bg:'#ffedd5',fg:'#9a3412',title:'Priority: '+t.id,body:PM_USER+' set priority to '+v,time,unread:true,ticketId:t.id});
  saveTickets(); saveNotifs(); renderDetail(); renderNotifList();
  showToast({
    type: 'info',
    title: 'Priority updated',
    message: t.id + ' ' + PM_USER + ' changed priority from ' + prevPriority + ' to ' + v
  });
  if (document.getElementById('sec-tickets')?.offsetParent !== null) pmRender();
}
function pmAddNote() {
  const txt = document.getElementById('newNote')?.value.trim();
  if(!txt||!selectedTicket) return;
  const time = new Date().toLocaleString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
  NOTES[selectedTicket.id] = NOTES[selectedTicket.id]||[];
  NOTES[selectedTicket.id].unshift({author:PM_USER,time,text:txt});
  saveNotes();
  document.getElementById('newNote').value='';
  // Re-render only the notes tab content to avoid tab switch
  if (document.querySelector('#dtNotes')) {
    // Re-render notes list and clear textarea
    const nts = NOTES[selectedTicket.id]||[];
    // Re-attach Enter-to-submit for newNote
  // Click-to-edit category (PM view, like client view)
  setTimeout(function() {
    var catDisplay = document.getElementById('categoryDisplay');
    var catSelect = document.getElementById('categorySelect');
    if (catDisplay && catSelect) {
      catDisplay.onclick = function() {
        catDisplay.classList.add('d-none');
        catSelect.classList.remove('d-none');
        catSelect.value = selectedTicket.category;
        catSelect.focus();
      };
      catSelect.onblur = function() {
        catSelect.classList.add('d-none');
        catDisplay.classList.remove('d-none');
      };
      catSelect.onchange = function() {
        var newCategory = catSelect.value;
        if (!selectedTicket) return;
        if (newCategory !== selectedTicket.category) {
          selectedTicket.category = newCategory;
          const idx = TICKETS.findIndex(t => t.id === selectedTicket.id);
          if (idx !== -1) {
            TICKETS[idx].category = newCategory;
            saveTickets();
          }
          renderDetail();
        } else {
          catSelect.classList.add('d-none');
          catDisplay.classList.remove('d-none');
        }
      };
    }
  }, 0);
    setTimeout(function() {
      var noteBox = document.getElementById('newNote');
      if (noteBox) {
        noteBox.addEventListener('keydown', function(e) {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            pmAddNote();
          }
        });
      }
    }, 0);
  }
  showToast({type:'success',title:'Note added',message:'Internal note saved'});
}
function pmSubmitComment() {
  const txt = document.getElementById('newComment').value.trim();
  if (!txt||!selectedTicket) return;
  const time = new Date().toLocaleString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
  commentsMap[selectedTicket.id] = commentsMap[selectedTicket.id]||[];
  commentsMap[selectedTicket.id].push({author:PM_USER,role:'support',time,text:txt});
  const t = TICKETS.find(x=>x.id===selectedTicket.id);
  if (t) { t.comments=[...commentsMap[selectedTicket.id]]; t.activity=t.activity||[]; t.activity.unshift({type:'comment',author:PM_USER,action:'commented',value:txt,time}); }
  NOTIFS.unshift({id:Date.now(),icon:'bi-chat-left-text-fill',bg:'#f0fdf4',fg:'#16a34a',title:'Comment on '+selectedTicket.id,body:PM_USER+': '+txt,time,unread:true,ticketId:selectedTicket.id});
  saveTickets(); saveNotifs(); renderNotifList();
  document.getElementById('newComment').value='';
  renderDetail();
  showToast({
    type: 'info',
    title: 'Comment added',
    message: PM_USER + ' commented to ' + selectedTicket.id
  });
}
function pmSaveEdit() {
  const t = TICKETS.find(x=>x.id===selectedTicket?.id); if(!t) return;
  t.title    = selectedTicket.title    = document.getElementById('editTitle').value.trim()||t.title;
  t.status   = selectedTicket.status   = document.getElementById('editStatus').value;
  t.priority = selectedTicket.priority = document.getElementById('editPriority').value;
  t.reporter = selectedTicket.reporter = document.getElementById('editReporter').value;
  t.category = selectedTicket.category = document.getElementById('editCategory').value;
  t.desc     = selectedTicket.desc     = document.getElementById('editDesc').value.trim()||t.desc;
  const time = new Date().toLocaleString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
  t.activity = t.activity||[];
  t.activity.unshift({type:'edit',author:PM_USER,action:'edited ticket',value:'',time});
  NOTIFS.unshift({id:Date.now(),icon:'bi-pencil-fill',bg:'#e0e7ff',fg:'#3730a3',title:'Edited: '+t.id,body:PM_USER+' edited the ticket',time,unread:true,ticketId:t.id});
  saveTickets(); saveNotifs();
  document.getElementById('detailStatus').value   = t.status;
  document.getElementById('detailPriority').value = t.priority;
  renderDetail(); renderNotifList();
  if (document.getElementById('sec-tickets').offsetParent!==null) pmRender();
  showToast({type:'success',title:'Ticket updated',message:t.id+' saved successfully'});
}
function pmDeleteTicket() {
  if (!selectedTicket) return;
  if (selectedTicket.status !== 'Resolved' && selectedTicket.status !== 'Closed') {
    var msg = document.getElementById('removeTicketModalMsg');
    if (msg) msg.textContent = 'Only Resolved or Closed tickets can be removed.';
    var modal = new bootstrap.Modal(document.getElementById('removeTicketModal'));
    modal.show();
    return;
  }
  document.getElementById('confirmRemoveTicketModalMsg').textContent = `Are you sure you want to remove this ticket? This action cannot be undone.`;
  var confirmModal = new bootstrap.Modal(document.getElementById('confirmRemoveTicketModal'));
  confirmModal.show();
  var confirmBtn = document.getElementById('confirmRemoveTicketBtn');
  if (confirmBtn) {
    confirmBtn.onclick = function() {
      confirmModal.hide();
      const idx = TICKETS.findIndex(x=>x.id===selectedTicket.id);
      if (idx>-1) TICKETS.splice(idx,1);
      NOTIFS.unshift({id:Date.now(),icon:'bi-trash-fill',bg:'#fee2e2',fg:'#b91c1c',title:'Deleted: '+selectedTicket.id,body:PM_USER+' deleted the ticket',time:new Date().toLocaleString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}),unread:true,ticketId:selectedTicket.id});
      saveTickets(); saveNotifs(); renderNotifList();
      pmOffcanvas.hide();
      selectedTicket = null;
      pmRender();
      showToast({type:'error',title:'Ticket deleted',message:'Removed from system'});
    };
  }
}

// ═══════════════════════════════════════════════════════
// CREATE TICKET
// ═══════════════════════════════════════════════════════
function openCreateModal() {
  ['ctTitle','ctDesc'].forEach(id => document.getElementById(id).value='');
  document.getElementById('ctPriority').value = 'Medium';
  window.ctAttachments = [];
  const preview = document.getElementById('ctPreview');
  if (preview) preview.innerHTML = '';
  new bootstrap.Modal(document.getElementById('createTicketModal')).show();
}
function pmSubmitTicket() {
  const title = document.getElementById('ctTitle').value.trim();
  const desc  = document.getElementById('ctDesc').value.trim();
  if (!title||!desc) { alert('Title and Description are required.'); return; }
  const maxId = TICKETS.reduce((max,t)=>{ const m=/TK-(\d+)/.exec(t.id); return m?Math.max(max,+m[1]):max; },0);
  const id = 'TK-'+String(maxId+1).padStart(3,'0');
  const time = new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
  TICKETS.unshift({id,title,
    status:   'Open',
    priority: document.getElementById('ctPriority').value,
    category: document.getElementById('ctCategory').value,
    reporter: document.getElementById('ctReporter').value,
    assignee: document.getElementById('ctAssignee').value,
    ac:'', created:time, desc, comments:[], attachments:[...window.ctAttachments]
  });
  commentsMap[id]=[];
  NOTIFS.unshift({id:Date.now(),icon:'bi-plus-lg',bg:'#e0f2fe',fg:'#0284c7',title:'Created: '+id,body:PM_USER+' created: '+title,time,unread:true,ticketId:id});
  saveTickets(); saveNotifs(); renderNotifList();
  bootstrap.Modal.getInstance(document.getElementById('createTicketModal')).hide();
  window.ctAttachments = [];
  document.getElementById('ctPreview').innerHTML = '';
  pmRender(); renderOverview();
  showToast({type:'success',title:'Ticket created',message:id+' — '+title});
}

// ═══════════════════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════════════════
function renderNotifList() {
  const unread = NOTIFS.filter(n=>n.unread).length;
  document.getElementById('notifDot').style.display = unread>0?'block':'none';
  const notifListEl = document.getElementById('notifList');
  if (!notifListEl) {
    console.warn('notifList element not found');
    return;
  }
  console.log('Rendering', NOTIFS.length, 'notifications');
  notifListEl.innerHTML = NOTIFS.length===0
    ? '<p class="text-muted text-center py-3 mb-0" style="font-size:13px">No notifications</p>'
    : NOTIFS.map(n=>{
        const tid = n.ticketId || (n.title && n.title.match(/TK-\d{3}/) ? n.title.match(/TK-\d{3}/)[0] : '');
        console.log('Notification for ticket:', tid, 'title:', n.title);
        return `<div class="notif-row ${n.unread?'unread':''}" onclick="event.stopPropagation(); console.log('Clicked notification'); openDetail('${tid}');">
          <div class="notif-icon-sm" style="background:${n.bg};color:${n.fg}"><i class="bi ${n.icon}"></i></div>
          <div class="flex-grow-1">
            <div class="fw-semibold" style="font-size:12.5px;color:#1a2235">${n.title}</div>
            <div class="text-muted" style="font-size:12px">${n.body}</div>
            <div class="text-muted mt-1" style="font-size:11px"><i class="bi bi-clock me-1"></i>${n.time}</div>
          </div>
        </div>`;
      }).join('')
    + `<div class="text-center py-2 border-top"><span class="text-muted" style="font-size:12px">${unread} unread · ${NOTIFS.length} total</span></div>`;
}
function markAllRead()    { NOTIFS.forEach(n=>n.unread=false); saveNotifs(); renderNotifList(); }
function deleteAllNotifs(){ NOTIFS.length=0; saveNotifs(); renderNotifList(); }

// ═══════════════════════════════════════════════════════
// TOAST (same as main.js)
// ═══════════════════════════════════════════════════════
function showToast({type='info',title='',message=''}) {
  const map={success:{bg:'#bbf7d0',fg:'#166534',icon:'bi-check-circle'},info:{bg:'#bae6fd',fg:'#075985',icon:'bi-info-circle'},warning:{bg:'#fef3c7',fg:'#92400e',icon:'bi-exclamation-circle'},error:{bg:'#fecaca',fg:'#b91c1c',icon:'bi-x-circle'}};
  const {bg,fg,icon}=map[type]||map.info;
  let c=document.getElementById('toastContainer');
  if(!c){c=document.createElement('div');c.id='toastContainer';c.className='toast-container position-fixed bottom-0 start-0 p-3';c.style.zIndex=9999;document.body.appendChild(c);}
  const el=document.createElement('div');
  el.className='toast show d-flex align-items-center mb-2';
  el.setAttribute('role','alert');
  el.style.cssText=`background:${bg};color:${fg};border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08);min-width:320px;max-width:450px`;
  el.innerHTML=`<div class="d-flex align-items-center px-3 py-2 flex-grow-1"><i class="bi ${icon} me-2" style="font-size:20px;color:${fg}"></i><div><div class="fw-semibold" style="font-size:15px;color:${fg}">${title}</div><div style="font-size:13px;color:${fg}">${message}</div></div></div><button type="button" class="btn-close ms-3 me-2" style="filter:invert(0.7)" aria-label="Close"></button>`;
  el.querySelector('.btn-close').onclick=()=>el.remove();
  c.appendChild(el);
  setTimeout(()=>{el.classList.remove('show');setTimeout(()=>el.remove(),500);},4000);
}

// ═══════════════════════════════════════════════════════
// SCREENSHOT/ATTACHMENT HANDLERS
// ═══════════════════════════════════════════════════════
window.ctAttachments = [];
window.commentAttachments = [];

function initScreenshots() {
  const dropZone  = document.getElementById('ctDropZone');
  const fileInput = document.getElementById('ctFileInput');
  if (!dropZone || !fileInput) return;
  dropZone.addEventListener('click',     () => fileInput.click());
  fileInput.addEventListener('change',   e  => { addFiles(Array.from(e.target.files), 'ct'); fileInput.value=''; });
  dropZone.addEventListener('dragover',  e  => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', e => {
    e.preventDefault(); dropZone.classList.remove('drag-over');
    addFiles(Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/')), 'ct');
  });
  document.getElementById('createTicketModal').addEventListener('paste', e => {
    const imgs = Array.from(e.clipboardData.items).filter(i => i.type.startsWith('image/')).map(i => i.getAsFile());
    if (imgs.length) addFiles(imgs, 'ct');
  });
  const newComment = document.getElementById('newComment');
  if (newComment) {
    newComment.addEventListener('paste', e => {
      const imgs = Array.from(e.clipboardData.items).filter(i => i.type.startsWith('image/')).map(i => i.getAsFile());
      if (imgs.length) { e.preventDefault(); addFiles(imgs, 'comment'); }
    });
  }
}

function addFiles(files, target) {
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = ev => {
      if (target === 'ct')  { window.ctAttachments.push(ev.target.result);      renderPreviews(window.ctAttachments,      'ctPreview',      'ct'); }
      else                  { window.commentAttachments.push(ev.target.result);  renderPreviews(window.commentAttachments, 'commentPreview', 'comment'); }
    };
    reader.readAsDataURL(file);
  });
}

function renderPreviews(arr, cid, target) {
  const el = document.getElementById(cid);
  if (!el) return;
  el.innerHTML = arr.map((src, i) => `
    <div class="screenshot-thumb">
      <img src="${src}" onclick="window.open().document.write('<img src=${JSON.stringify(src)} style=max-width:100%>')"/>
      <div class="remove-img" onclick="removeAttachment(${i},'${target}')"><i class="bi bi-x"></i></div>
    </div>`).join('');
}

function removeAttachment(i, target) {
  if (target === 'ct')  { window.ctAttachments.splice(i,1);      renderPreviews(window.ctAttachments,      'ctPreview',      'ct'); }
  else                  { window.commentAttachments.splice(i,1);  renderPreviews(window.commentAttachments, 'commentPreview', 'comment'); }
}

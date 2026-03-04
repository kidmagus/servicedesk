// ── DATA ──────────────────────────────────────────────────────────────
const TICKETS = [
  { id:'TK-001', title:'Website login page not responding',         status:'Open',        priority:'Critical', assignee:'Sarah Johnson', ac:'',       created:'Jan 15, 2024', desc:'Users are unable to access the login page. The page loads but the login button becomes unresponsive after clicking.', comments:[{author:'John Client',role:'client',time:'Jan 15, 06:35 PM',text:'This is affecting all our users. Please prioritize.'},{author:'Sarah Johnson',role:'support',time:'Jan 15, 07:00 PM',text:"I've started investigating this issue. Will update you within 2 hours."}] },
  { id:'TK-002', title:'Mobile app crashes on iOS devices',          status:'In Progress', priority:'High',     assignee:'Mike Torres',   ac:'orange', created:'Jan 15, 2024', desc:'The mobile application crashes upon launch on devices running iOS 17. Affects all iPhone 14 and 15 models.', comments:[{author:'Mike Torres',role:'support',time:'Jan 15, 05:00 PM',text:'Identified a memory leak in build 2.4.1. Patch incoming.'}] },
  { id:'TK-003', title:'Slow page load times on product catalog',    status:'Resolved',    priority:'Medium',   assignee:'Anna Lee',      ac:'purple', created:'Jan 14, 2024', desc:'Product catalog page took over 8 seconds to load. Optimized via CDN and lazy loading.', comments:[{author:'Anna Lee',role:'support',time:'Jan 14, 03:00 PM',text:'Issue resolved. Load time is now under 1.2s.'}] },
  { id:'TK-004', title:'Payment gateway integration errors',         status:'Open',        priority:'Critical', assignee:'Sarah Johnson', ac:'',       created:'Jan 16, 2024', desc:'Payments via Stripe are failing with error code 402. Affects checkout for all product categories.', comments:[] },
  { id:'TK-005', title:'Email notifications not sending',            status:'In Progress', priority:'High',     assignee:'Mike Torres',   ac:'orange', created:'Jan 16, 2024', desc:'Transactional email service stopped delivering notifications. SMTP logs show 550 errors.', comments:[{author:'John Client',role:'client',time:'Jan 16, 09:00 AM',text:'This is blocking our onboarding flow.'}] },
  { id:'TK-006', title:'Dashboard analytics showing incorrect data', status:'Open',        priority:'Medium',   assignee:'Anna Lee',      ac:'purple', created:'Jan 16, 2024', desc:'Revenue and session metrics appear duplicated in the main analytics dashboard.', comments:[] },
  { id:'TK-007', title:'Search feature returning no results',        status:'In Progress', priority:'High',     assignee:'David Kim',     ac:'green',  created:'Jan 17, 2024', desc:'The site search returns 0 results for all queries despite items existing in the database.', comments:[{author:'David Kim',role:'support',time:'Jan 17, 10:00 AM',text:'Elasticsearch index appears corrupted. Re-indexing now.'}] },
  { id:'TK-008', title:'User profile images not uploading',          status:'Resolved',    priority:'Low',      assignee:'Anna Lee',      ac:'purple', created:'Jan 12, 2024', desc:'Profile picture upload was failing due to incorrect S3 bucket permissions. Resolved.', comments:[] },
  { id:'TK-009', title:'Two-factor auth codes not delivered',        status:'Open',        priority:'Critical', assignee:'Sarah Johnson', ac:'',       created:'Jan 17, 2024', desc:'SMS-based 2FA codes are not being sent. Users are locked out of their accounts.', comments:[{author:'John Client',role:'client',time:'Jan 17, 08:00 AM',text:'Multiple enterprise accounts affected. This is urgent.'}] },
  { id:'TK-010', title:'API rate limits too restrictive',            status:'Closed',      priority:'Medium',   assignee:'David Kim',     ac:'green',  created:'Jan 10, 2024', desc:'Rate limits adjusted. Increased to 1000 req/min for enterprise plans.', comments:[] },
  { id:'TK-011', title:'CSV export corrupting special characters',   status:'In Progress', priority:'Medium',   assignee:'Mike Torres',   ac:'orange', created:'Jan 18, 2024', desc:'Exported CSV files show garbled text for accented characters or emojis.', comments:[] },
  { id:'TK-012', title:'Admin panel inaccessible after update',      status:'Open',        priority:'High',     assignee:'Sarah Johnson', ac:'',       created:'Jan 18, 2024', desc:'Following the v3.2 deployment, admin users receive a 403 error on login.', comments:[] },
  { id:'TK-013', title:'Webhook events not firing',                  status:'Resolved',    priority:'High',     assignee:'David Kim',     ac:'green',  created:'Jan 11, 2024', desc:'Webhook endpoints were not receiving events due to an incorrect URL in config. Fixed.', comments:[] },
  { id:'TK-014', title:'Onboarding wizard skipping steps',           status:'In Progress', priority:'Low',      assignee:'Anna Lee',      ac:'purple', created:'Jan 19, 2024', desc:'New users report the wizard skips from step 2 to step 5, missing critical setup.', comments:[] },
  { id:'TK-015', title:'Dark mode flickering on refresh',            status:'Closed',      priority:'Low',      assignee:'Mike Torres',   ac:'orange', created:'Jan 9, 2024',  desc:'White flash on page load in dark mode. Fixed by persisting theme in localStorage.', comments:[] },
  { id:'TK-016', title:'Subscription renewal emails missing',        status:'Open',        priority:'High',     assignee:'Sarah Johnson', ac:'',       created:'Jan 19, 2024', desc:'Customers are not receiving renewal reminder emails 7 days before billing date.', comments:[] },
  { id:'TK-017', title:'SSO login loop with SAML provider',          status:'In Progress', priority:'Critical', assignee:'David Kim',     ac:'green',  created:'Jan 20, 2024', desc:'Enterprise SAML SSO users are caught in an authentication redirect loop.', comments:[{author:'David Kim',role:'support',time:'Jan 20, 11:00 AM',text:'Working with the IdP team to debug the SAML assertion.'}] },
  { id:'TK-018', title:'Bulk user import failing above 500 rows',    status:'Resolved',    priority:'Medium',   assignee:'Anna Lee',      ac:'purple', created:'Jan 13, 2024', desc:'CSV imports over 500 rows timed out. Resolved with 200-row batch processing.', comments:[] },
  { id:'TK-019', title:'Audit log timestamps incorrect',             status:'Open',        priority:'Medium',   assignee:'Mike Torres',   ac:'orange', created:'Jan 20, 2024', desc:'Audit logs recorded in UTC but displayed without timezone conversion.', comments:[] },
  { id:'TK-020', title:'Password reset link expiring instantly',     status:'In Progress', priority:'High',     assignee:'Sarah Johnson', ac:'',       created:'Jan 21, 2024', desc:'Password reset links expire before users can click them.', comments:[{author:'John Client',role:'client',time:'Jan 21, 07:00 AM',text:'This is blocking our new employee accounts.'}] },
];

const STATUS_CLASS = { 'Open':'primary text-white', 'In Progress':'warning text-dark', 'Resolved':'success text-white', 'Closed':'secondary text-white' };
const PRIO_STYLE   = { 'Critical':'background:#ffe4e6;color:#be123c', 'High':'background:#ffedd5;color:#9a3412', 'Medium':'background:#fef9c3;color:#78350f', 'Low':'background:#f0fdf4;color:#14532d' };

const PAGE_SIZE = 8;
let page=1, sortField='id', sortDir=1, fStatus='', fPriority='', fSearch='';
let selectedTicket=null;
const commentsMap={};
TICKETS.forEach(t => commentsMap[t.id]=[...t.comments]);

let offcanvas;
window.addEventListener('DOMContentLoaded', ()=>{
  offcanvas = new bootstrap.Offcanvas(document.getElementById('ticketOffcanvas'));
  render();
});

const initials = n => n.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);

function getFiltered(){
  let list=[...TICKETS];
  if(fStatus)   list=list.filter(t=>t.status===fStatus);
  if(fPriority) list=list.filter(t=>t.priority===fPriority);
  if(fSearch)   list=list.filter(t=>t.id.toLowerCase().includes(fSearch)||t.title.toLowerCase().includes(fSearch)||t.assignee.toLowerCase().includes(fSearch));
  list.sort((a,b)=>(a[sortField]||'').localeCompare(b[sortField]||'')*sortDir);
  return list;
}

function sortBy(f){ sortDir=sortField===f?sortDir*-1:1; sortField=f; page=1; render(); }

function render(){
  const filtered=getFiltered(), total=filtered.length;
  const pages=Math.max(1,Math.ceil(total/PAGE_SIZE));
  if(page>pages) page=pages;
  const from=(page-1)*PAGE_SIZE, items=filtered.slice(from,from+PAGE_SIZE);

  document.getElementById('statTotal').textContent    = TICKETS.length;
  document.getElementById('statOpen').textContent     = TICKETS.filter(t=>t.status==='Open').length;
  document.getElementById('statProgress').textContent = TICKETS.filter(t=>t.status==='In Progress').length;
  document.getElementById('statResolved').textContent = TICKETS.filter(t=>t.status==='Resolved').length;
  document.getElementById('ticketCountBadge').textContent = `${total} found`;

  const tbody=document.getElementById('ticketTableBody');
  const empty=document.getElementById('emptyState');

  if(!items.length){
    tbody.innerHTML=''; empty.classList.remove('d-none');
  } else {
    empty.classList.add('d-none');
    tbody.innerHTML=items.map(t=>`
      <tr onclick="openDetail('${t.id}')">
        <td><span class="ticket-id">${t.id}</span></td>
        <td class="fw-medium" style="color:#1a2235">${t.title}</td>
        <td><span class="badge bg-${STATUS_CLASS[t.status]} rounded-pill" style="font-size:11px">${t.status}</span></td>
        <td><span class="badge rounded-pill" style="${PRIO_STYLE[t.priority]};font-size:11px">${t.priority}</span></td>
        <td>
          <div class="d-flex align-items-center gap-2">
            <div class="avatar-sm ${t.ac}">${initials(t.assignee)}</div>
            <span style="font-size:12.5px">${t.assignee}</span>
          </div>
        </td>
        <td class="text-muted" style="font-size:12px">${t.created}</td>
      </tr>
    `).join('');
  }

  document.getElementById('pageFrom').textContent = total ? from+1 : 0;
  document.getElementById('pageTo').textContent   = Math.min(from+PAGE_SIZE,total);
  document.getElementById('pageTotal').textContent= total;

  let btns=`<button class="page-btn" onclick="goPage(${page-1})" ${page===1?'disabled':''}><i class="bi bi-chevron-left"></i></button>`;
  let s=Math.max(1,page-2), e=Math.min(pages,s+4);
  if(e-s<4) s=Math.max(1,e-4);
  for(let p=s;p<=e;p++) btns+=`<button class="page-btn ${p===page?'active':''}" onclick="goPage(${p})">${p}</button>`;
  btns+=`<button class="page-btn" onclick="goPage(${page+1})" ${page===pages?'disabled':''}><i class="bi bi-chevron-right"></i></button>`;
  document.getElementById('pageControls').innerHTML=btns;
}

function goPage(p){ const pages=Math.max(1,Math.ceil(getFiltered().length/PAGE_SIZE)); if(p<1||p>pages)return; page=p; render(); }

document.getElementById('filterStatus').addEventListener('change',  e=>{ fStatus=e.target.value;   page=1; render(); });
document.getElementById('filterPriority').addEventListener('change', e=>{ fPriority=e.target.value; page=1; render(); });
document.getElementById('searchInput').addEventListener('input',     e=>{ fSearch=e.target.value.trim().toLowerCase(); page=1; render(); });

function openDetail(id){
  selectedTicket=TICKETS.find(t=>t.id===id); if(!selectedTicket)return;
  document.getElementById('detailTid').textContent=selectedTicket.id;
  document.getElementById('newComment').value='';
  renderDetail(); offcanvas.show();
}

function renderDetail(){
  const t=selectedTicket, comments=commentsMap[t.id]||[];
  const commentsHTML=comments.length ? comments.map(c=>`
    <div class="d-flex gap-2 mb-3">
      <div class="avatar-sm ${c.role==='support'?'green':''} flex-shrink-0">${initials(c.author)}</div>
      <div class="flex-grow-1">
        <div class="d-flex align-items-center gap-2 mb-1 flex-wrap">
          <span class="fw-bold" style="font-size:12.5px">${c.author}</span>
          <span class="comment-role-badge ${c.role}">${c.role==='client'?'Client':'Support'}</span>
          <span class="text-muted ms-auto" style="font-size:11px">${c.time}</span>
        </div>
        <p class="mb-0" style="font-size:13px;color:#3a4560">${c.text}</p>
      </div>
    </div>`).join('')
    : `<p class="text-muted mb-0" style="font-size:13px">No comments yet.</p>`;

  document.getElementById('detailBody').innerHTML=`
    <h5 class="fw-bold mb-3" style="font-size:18px;line-height:1.3">${t.title}</h5>
    <div class="d-flex gap-2 mb-3">
      <span class="badge bg-${STATUS_CLASS[t.status]} rounded-pill" style="font-size:11px">${t.status}</span>
      <span class="badge rounded-pill" style="${PRIO_STYLE[t.priority]};font-size:11px">${t.priority}</span>
    </div>
    <div class="detail-desc p-3 mb-3">${t.desc}</div>
    <div class="row g-3 mb-4">
      <div class="col-6">
        <p class="text-uppercase text-muted fw-semibold mb-1" style="font-size:10.5px;letter-spacing:.6px">Assignee</p>
        <div class="d-flex align-items-center gap-2 fw-semibold" style="font-size:13px">
          <div class="avatar-sm ${t.ac}" style="width:22px;height:22px;font-size:9px">${initials(t.assignee)}</div>
          ${t.assignee}
        </div>
      </div>
      <div class="col-6">
        <p class="text-uppercase text-muted fw-semibold mb-1" style="font-size:10.5px;letter-spacing:.6px">Created</p>
        <div class="fw-semibold" style="font-size:13px">${t.created}</div>
      </div>
    </div>
    <p class="fw-bold mb-3" style="font-size:13px">Comments (${comments.length})</p>
    ${commentsHTML}
  `;
}

function addComment(){
  const txt=document.getElementById('newComment').value.trim();
  if(!txt||!selectedTicket)return;
  const now=new Date().toLocaleString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
  commentsMap[selectedTicket.id].push({author:'John Client',role:'client',time:now,text:txt});
  document.getElementById('newComment').value='';
  renderDetail();
}

function updateStatus(val){
  if(!selectedTicket) return;
  selectedTicket.status = val;
  renderDetail();
  render();
}

function updatePriority(val){
  if(!selectedTicket) return;
  selectedTicket.priority = val;
  renderDetail();
  render();
}

function removeTicket(){
  if(!selectedTicket) return;
  if(selectedTicket.status !== 'Resolved' && selectedTicket.status !== 'Closed'){
    alert('Only Resolved or Closed tickets can be removed.'); return;
  }
  const idx = TICKETS.findIndex(t => t.id === selectedTicket.id);
  if(idx > -1) TICKETS.splice(idx, 1);
  bootstrap.Offcanvas.getInstance(document.getElementById('ticketOffcanvas')).hide();
  selectedTicket = null;
  render();
}

function exportCSV(){
  const rows=getFiltered().map(t=>[t.id,`"${t.title}"`,t.status,t.priority,t.assignee,t.created]);
  const csv=[['Ticket ID','Title','Status','Priority','Assignee','Created'],...rows].map(r=>r.join(',')).join('\n');
  const a=document.createElement('a'); a.href='data:text/csv,'+encodeURIComponent(csv); a.download='support-tickets.csv'; a.click();
}

// ── MY TICKETS PAGE ───────────────────────────────────
// Client's own tickets (subset of TICKETS)
const MY_TICKET_IDS = ['TK-001','TK-004','TK-005','TK-009','TK-012','TK-016','TK-019','TK-020'];

function initMyTicketsPage() {
  const ticketsData = TICKETS.filter(t => MY_TICKET_IDS.includes(t.id));
  const PRIO_BORDER = { 'Critical':'priority-critical', 'High':'priority-high', 'Medium':'priority-medium', 'Low':'priority-low' };

  let myPage = 1, myFStatus = '', myFPriority = '', myFSearch = '', viewMode = 'card';

  function initOffcanvasDetail() {
    offcanvas = new bootstrap.Offcanvas(document.getElementById('ticketOffcanvas'));
  }

  function updateMyStats() {
    document.getElementById('myStat0').textContent = ticketsData.length;
    document.getElementById('myStat1').textContent = ticketsData.filter(t => t.status === 'Open').length;
    document.getElementById('myStat2').textContent = ticketsData.filter(t => t.status === 'In Progress').length;
    document.getElementById('myStat3').textContent = ticketsData.filter(t => t.status === 'Resolved').length;
    const myTicketsCountEl = document.getElementById('myTicketsCount');
    if (myTicketsCountEl) myTicketsCountEl.textContent = ticketsData.length;
  }

  function getMyFiltered() {
    let list = [...ticketsData];
    if (myFStatus)   list = list.filter(t => t.status === myFStatus);
    if (myFPriority) list = list.filter(t => t.priority === myFPriority);
    if (myFSearch)   list = list.filter(t =>
      t.id.toLowerCase().includes(myFSearch) ||
      t.title.toLowerCase().includes(myFSearch)
    );
    return list;
  }

  function goMyPage(p) {
    const pages = Math.max(1, Math.ceil(getMyFiltered().length / PAGE_SIZE));
    if (p < 1 || p > pages) return;
    myPage = p; renderMyTickets();
  }
  window.goMyPage = goMyPage;

  function statusBadgeHTML(status) {
    return `<span class="badge bg-${STATUS_CLASS[status]} rounded-pill" style="font-size:11px">${status}</span>`;
  }

  function prioBadgeHTML(priority) {
    return `<span class="badge rounded-pill" style="${PRIO_STYLE[priority]};font-size:11px">${priority}</span>`;
  }

  function renderMyTickets() {
    const filtered = getMyFiltered(), total = filtered.length;
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    if (myPage > pages) myPage = pages;
    const from = (myPage - 1) * PAGE_SIZE, items = filtered.slice(from, from + PAGE_SIZE);

    document.getElementById('countBadge').textContent  = `${total} found`;
    document.getElementById('pageFrom').textContent    = total ? from + 1 : 0;
    document.getElementById('pageTo').textContent      = Math.min(from + PAGE_SIZE, total);
    document.getElementById('pageTotal').textContent   = total;

    // Pagination
    let btns=`<button class="page-btn" onclick="goMyPage(${myPage-1})" ${myPage===1?'disabled':''}><i class="bi bi-chevron-left"></i></button>`;
    let s=Math.max(1,myPage-2), e=Math.min(pages,s+4);
    if(e-s<4) s=Math.max(1,e-4);
    for(let p=s;p<=e;p++) btns+=`<button class="page-btn ${p===myPage?'active':''}" onclick="goMyPage(${p})">${p}</button>`;
    btns+=`<button class="page-btn" onclick="goMyPage(${myPage+1})" ${myPage===pages?'disabled':''}><i class="bi bi-chevron-right"></i></button>`;
    document.getElementById('pageControls').innerHTML=btns;

    updateMyStats();

    if (viewMode === 'card') renderMyCards(items);
    else renderMyTable(items);
  }

  function renderMyCards(items) {
    const grid  = document.getElementById('cardGrid');
    const empty = document.getElementById('cardEmpty');
    if (!items.length) { grid.innerHTML = ''; empty.classList.remove('d-none'); return; }
    empty.classList.add('d-none');
    grid.innerHTML = items.map(t => `
      <div class="col-6" onclick="openMyDetail('${t.id}')">
        <div class="ticket-card ${PRIO_BORDER[t.priority]}">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <span class="ticket-id">${t.id}</span>
            ${statusBadgeHTML(t.status)}
          </div>
          <p class="fw-semibold mb-2" style="font-size:13.5px;color:#1a2235;line-height:1.4">${t.title}</p>
          <p class="text-muted mb-3" style="font-size:12px;line-height:1.5">${t.desc.substring(0,80)}...</p>
          <div class="d-flex align-items-center justify-content-between">
            <div class="d-flex align-items-center gap-2">
              <div class="avatar-sm ${t.ac}" style="width:22px;height:22px;font-size:9px">${initials(t.assignee)}</div>
              <span class="text-muted" style="font-size:11.5px">${t.assignee}</span>
            </div>
            ${prioBadgeHTML(t.priority)}
          </div>
        </div>
      </div>`).join('');
  }

  function renderMyTable(items) {
    const tbody = document.getElementById('tableBody');
    if (!items.length) { 
      tbody.innerHTML = `<tr><td colspan="5" class="text-center py-5 text-muted">No tickets found.</td></tr>`; 
      return; 
    }
    tbody.innerHTML = items.map(t => `
      <tr onclick="openMyDetail('${t.id}')">
        <td><span class="ticket-id">${t.id}</span></td>
        <td class="fw-medium" style="color:#1a2235">${t.title}</td>
        <td>${statusBadgeHTML(t.status)}</td>
        <td>${prioBadgeHTML(t.priority)}</td>
        <td class="text-muted" style="font-size:12px">${t.created}</td>
      </tr>`).join('');
  }

  function openMyDetail(id) {
    selectedTicket = ticketsData.find(t => t.id === id);
    if (!selectedTicket) return;
    document.getElementById('detailTid').textContent = selectedTicket.id;
    document.getElementById('detailStatus').value = selectedTicket.status;
    document.getElementById('detailPriority').value = selectedTicket.priority;
    document.getElementById('newComment').value = '';
    renderDetail();
    offcanvas.show();
  }
  window.openMyDetail = openMyDetail;

  function submitNewTicket() {
    const title    = document.getElementById('newTitle').value.trim();
    const priority = document.getElementById('newPriority').value;
    const desc     = document.getElementById('newDesc').value.trim();
    if (!title || !desc) return;
    const id  = `TK-${String(100 + TICKETS.length + 1).slice(1)}`;
    const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const newTicket = { 
      id, title, status: 'Open', priority, 
      assignee: 'Sarah Johnson', ac: '', created: now, 
      desc, comments: [] 
    };
    ticketsData.unshift(newTicket);
    TICKETS.unshift(newTicket);
    MY_TICKET_IDS.unshift(id);
    commentsMap[id] = [];
    bootstrap.Modal.getInstance(document.getElementById('newTicketModal')).hide();
    document.getElementById('newTitle').value = '';
    document.getElementById('newDesc').value  = '';
    updateMyStats(); 
    renderMyTickets();
  }
  window.submitTicket = submitNewTicket;

  function doRemoveMyTicket() {
    if (!selectedTicket) return;
    if (selectedTicket.status !== 'Resolved' && selectedTicket.status !== 'Closed') {
      alert('Only Resolved or Closed tickets can be removed.'); 
      return;
    }
    const idx = ticketsData.findIndex(t => t.id === selectedTicket.id);
    if (idx > -1) ticketsData.splice(idx, 1);
    const mainIdx = TICKETS.findIndex(t => t.id === selectedTicket.id);
    if (mainIdx > -1) TICKETS.splice(mainIdx, 1);
    const idIdx = MY_TICKET_IDS.indexOf(selectedTicket.id);
    if (idIdx > -1) MY_TICKET_IDS.splice(idIdx, 1);
    bootstrap.Offcanvas.getInstance(document.getElementById('ticketOffcanvas')).hide();
    selectedTicket = null;
    updateMyStats();
    renderMyTickets();
  }
  window.doRemoveTicket = doRemoveMyTicket;

  // Event Listeners
  initOffcanvasDetail();
  updateMyStats();
  renderMyTickets();

  document.getElementById('filterStatus').addEventListener('change',   e => { myFStatus   = e.target.value; myPage = 1; renderMyTickets(); });
  document.getElementById('filterPriority').addEventListener('change', e => { myFPriority = e.target.value; myPage = 1; renderMyTickets(); });
  document.getElementById('searchInput').addEventListener('input',     e => { myFSearch   = e.target.value.trim().toLowerCase(); myPage = 1; renderMyTickets(); });

  document.getElementById('viewCard').addEventListener('click', () => {
    viewMode = 'card';
    document.getElementById('viewCard').classList.add('active');
    document.getElementById('viewTable').classList.remove('active');
    document.getElementById('cardView').classList.remove('d-none');
    document.getElementById('tableView').classList.add('d-none');
    renderMyTickets();
  });
  document.getElementById('viewTable').addEventListener('click', () => {
    viewMode = 'table';
    document.getElementById('viewTable').classList.add('active');
    document.getElementById('viewCard').classList.remove('active');
    document.getElementById('tableView').classList.remove('d-none');
    document.getElementById('cardView').classList.add('d-none');
    renderMyTickets();
  });
}

// Auto-initialize my-tickets page if elements exist
if (document.getElementById('myStat0')) {
  window.addEventListener('DOMContentLoaded', initMyTicketsPage);
}


// PM: table state, filtering, sorting, and rendering extracted from main.js

const pmState = { page: 1, sortField: "id", sortDir: 1, search: "" };

function onSearch(v) {
  pmState.search = v.trim().toLowerCase();
  pmState.page = 1;
  pmRender();
}

function pmSortBy(f) {
  pmState.sortDir = pmState.sortField === f ? -pmState.sortDir : 1;
  pmState.sortField = f;
  pmState.page = 1;
  pmRender();
}

function pmGetFiltered() {
  let list = [...TICKETS];
  const sf = document.getElementById("filterStatus")?.value || "",
    pf = document.getElementById("filterPriority")?.value || "",
    cf = document.getElementById("filterClient")?.value || "",
    af = document.getElementById("filterManager")?.value || "";
  if (sf) list = list.filter((t) => t.status === sf);
  if (pf) list = list.filter((t) => t.priority === pf);
  if (cf) list = list.filter((t) => t.reporter === cf);
  if (af) list = list.filter((t) => t.manager === af);
  if (pmState.search)
    list = list.filter(
      (t) =>
        t.id.toLowerCase().includes(pmState.search) ||
        t.title.toLowerCase().includes(pmState.search) ||
        (t.reporter || "").toLowerCase().includes(pmState.search) ||
        t.manager.toLowerCase().includes(pmState.search),
    );
  return list.sort(
    (a, b) =>
      (a[pmState.sortField] || "").localeCompare(b[pmState.sortField] || "") *
      pmState.sortDir,
  );
}

function pmGoPage(p) {
  const total = Math.max(1, Math.ceil(pmGetFiltered().length / PAGE_SIZE));
  if (p < 1 || p > total) return;
  pmState.page = p;
  pmRender();
}

function pmRender() {
  const all = pmGetFiltered(),
    total = all.length;
  renderStats();
  const maxPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (pmState.page > maxPage) pmState.page = maxPage;
  const start = (pmState.page - 1) * PAGE_SIZE,
    slice = all.slice(start, start + PAGE_SIZE);
  document.getElementById("ticketCountBadge").textContent = total + " found";
  document.getElementById("pageFrom").textContent = total ? start + 1 : 0;
  document.getElementById("pageTo").textContent = Math.min(
    start + PAGE_SIZE,
    total,
  );
  document.getElementById("pageTotal").textContent = total;
  document.getElementById("pageControls").innerHTML = renderPagination(
    pmState.page,
    total,
    "pmGoPage",
  );
  const cs = document.getElementById("filterClient");
  if (cs) {
    const prev = cs.value;
    cs.innerHTML =
      '<option value="">All Clients</option>' +
      Array.from(new Set(TICKETS.map((t) => t.reporter)))
        .filter(Boolean)
        .map((c) => `<option value="${c}">${c}</option>`)
        .join("");
    cs.value = prev;
  }
  const ms = document.getElementById("filterManager");
  if (ms) {
    const prev = ms.value;
    const pms = ["Matthew Samson","John Doe"];
    ms.innerHTML =
      '<option value="">All Managers</option>' +
      pms.map((pm) => `<option value="${pm}">${pm}</option>`).join("");
    ms.value = prev;
  }
  const tbody = document.getElementById("ticketTableBody"),
    empty = document.getElementById("emptyState");
  if (!slice.length) {
    tbody.innerHTML = "";
    empty.classList.remove("d-none");
    return;
  }
  empty.classList.add("d-none");
  tbody.innerHTML = slice
    .map(
      (t) => `
    <tr onclick="openDetail('${t.id}')" style="cursor:pointer">
      <td><span class="ticket-id">${t.id}</span></td>
      <td class="fw-medium" style="color:#1a2235">${t.title}</td>
      <td>${statusBadgeHTML(t.status)}</td><td>${prioBadgeHTML(t.priority)}</td><td>${catBadge(t.category)}</td>
      <td style="font-size:12.5px"><div class="d-flex align-items-center gap-2"><div class="avatar-sm" style="background:#3b7cf4;width:22px;height:22px;font-size:9px;border-radius:7px">${initials(t.reporter || "?")}</div>${t.reporter || "—"}</div></td>
      <td style="font-size:13px"><div class="d-flex align-items-center gap-2"><div class="avatar-sm" style="background:#16a34a;width:22px;height:22px;font-size:9px;border-radius:7px">${initials(t.manager || "?")}</div>${t.manager || "—"}</div></td>
      <td style="font-size:13px"><div class="d-flex align-items-center gap-2"><div class="avatar-sm" style="background:#e0e7ef;color:#3b3b4f;width:22px;height:22px;font-size:9px;border-radius:7px">${initials(t.developer || "?")}</div>${t.developer || "—"}</div></td>
      <td class="text-muted" style="font-size:12px">${t.created}</td>
    </tr>`,
    )
    .join("");
  document.getElementById("sidebarOpenCount").textContent = TICKETS.length;
}

// CLIENT: table state, filtering, sorting, and rendering extracted from main.js

const clientState = {
  page: 1,
  sortField: "id",
  sortDir: 1,
  fStatus: "",
  fPriority: "",
  fSearch: "",
};

function getFiltered() {
  let list = [...TICKETS].filter((t) => t.reporter === CURRENT_USER);
  if (clientState.fStatus)
    list = list.filter((t) => t.status === clientState.fStatus);
  if (clientState.fPriority)
    list = list.filter((t) => t.priority === clientState.fPriority);
  if (clientState.fSearch)
    list = list.filter(
      (t) =>
        t.id.toLowerCase().includes(clientState.fSearch) ||
        t.title.toLowerCase().includes(clientState.fSearch) ||
        (t.reporter || "").toLowerCase().includes(clientState.fSearch) ||
        t.manager.toLowerCase().includes(clientState.fSearch),
    );
  list.sort(
    (a, b) =>
      (a[clientState.sortField] || "").localeCompare(
        b[clientState.sortField] || "",
      ) * clientState.sortDir,
  );
  return list;
}

function clientSortBy(f) {
  clientState.sortDir =
    clientState.sortField === f ? clientState.sortDir * -1 : 1;
  clientState.sortField = f;
  clientState.page = 1;
  clientRender();
}

function goPage(p) {
  const pages = Math.max(1, Math.ceil(getFiltered().length / PAGE_SIZE));
  if (p < 1 || p > pages) return;
  clientState.page = p;
  clientRender();
}

function clientRender() {
  const filtered = getFiltered(),
    total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (clientState.page > pages) clientState.page = pages;
  const from = (clientState.page - 1) * PAGE_SIZE,
    items = filtered.slice(from, from + PAGE_SIZE);

  renderStats();
  document.getElementById("ticketCountBadge").textContent = `${total} found`;
  document.getElementById("sidebarCount").textContent = TICKETS.filter(
    (t) => t.reporter === CURRENT_USER,
  ).length;

  const tbody = document.getElementById("ticketTableBody"),
    empty = document.getElementById("emptyState");
  if (!items.length) {
    tbody.innerHTML = "";
    empty.classList.remove("d-none");
  } else {
    empty.classList.add("d-none");
    tbody.innerHTML = items
      .map(
        (t) => `
      <tr onclick="openDetail('${t.id}')">
        <td><span class="ticket-id">${t.id}</span></td>
        <td class="fw-medium" style="color:#1a2235">${t.title}</td>
        <td>${statusBadgeHTML(t.status)}</td>
        <td>${prioBadgeHTML(t.priority)}</td>
        <td>${catBadge(t.category)}</td>
        <td style="font-size:12.5px"><div class="d-flex align-items-center gap-2"><div class="avatar-sm" style="background:#3b7cf4;width:22px;height:22px;font-size:9px;border-radius:7px">${initials(t.reporter)}</div><span>${t.reporter || "—"}</span></div></td>
        <td><div class="d-flex align-items-center gap-2"><div class="avatar-sm " style="background: #16a34a;">${initials(t.manager)}</div><span style="font-size:12.5px">${t.manager}</span></div></td>
        <td class="text-muted" style="font-size:12px">${t.created}</td>
      </tr>`,
      )
      .join("");
  }
  document.getElementById("pageFrom").textContent = total ? from + 1 : 0;
  document.getElementById("pageTo").textContent = Math.min(
    from + PAGE_SIZE,
    total,
  );
  document.getElementById("pageTotal").textContent = total;
  document.getElementById("pageControls").innerHTML = renderPagination(
    clientState.page,
    total,
    "goPage",
  );
}

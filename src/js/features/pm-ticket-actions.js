// PM: quick ticket actions extracted from main.js

function quickReassign(id, agent) {
  const t = TICKETS.find((t) => t.id === id);
  if (!t) return;
  t.manager = agent;
  const time = _now();
  t.activity = t.activity || [];
  t.activity.unshift({
    type: "manager",
    author: CURRENT_USER,
    action: "reassigned to",
    value: agent,
    time,
  });
  NOTIFS.unshift({
    id: Date.now(),
    icon: "bi-person-check-fill",
    bg: "#e0e7ff",
    fg: "#3730a3",
    title: "Reassigned: " + id,
    body: CURRENT_USER + " assigned to " + agent,
    time,
    unread: true,
    ticketId: id,
  });
  saveTickets();
  saveNotifs();
  renderNotifList();
  pmRender();
  showToast({
    type: "info",
    title: "Reassigned",
    message: `${id}: assigned to ${agent}`,
  });
}

function pmAddNote() {
  const txt = document.getElementById("newNote")?.value.trim();
  if (!txt || !selectedTicket) return;
  const time = _now();
  NOTES[selectedTicket.id] = NOTES[selectedTicket.id] || [];
  NOTES[selectedTicket.id].unshift({ author: CURRENT_USER, time, text: txt });
  saveNotes();
  renderDetail();
  showToast({
    type: "success",
    title: "Note added",
    message: "Internal note saved",
  });
}

function pmSaveEdit() {
  const t = TICKETS.find((x) => x.id === selectedTicket?.id);
  if (!t) return;
  t.title = selectedTicket.title =
    document.getElementById("editTitle").value.trim() || t.title;
  t.status = selectedTicket.status =
    document.getElementById("editStatus").value;
  t.priority = selectedTicket.priority =
    document.getElementById("editPriority").value;
  t.reporter = selectedTicket.reporter =
    document.getElementById("editReporter").value;
  t.category = selectedTicket.category =
    document.getElementById("editCategory").value;
  t.desc = selectedTicket.desc =
    document.getElementById("editDesc").value.trim() || t.desc;
  const time = _now();
  t.activity = t.activity || [];
  t.activity.unshift({
    type: "edit",
    author: CURRENT_USER,
    action: "edited ticket",
    value: "",
    time,
  });
  NOTIFS.unshift(
    _notif(
      "bi-pencil-fill",
      "#e0e7ff",
      "#3730a3",
      "Edited: " + t.id,
      `${CURRENT_USER} edited the ticket`,
      t.id,
    ),
  );
  saveTickets();
  saveNotifs();
  document.getElementById("detailStatus").value = t.status;
  document.getElementById("detailPriority").value = t.priority;
  renderDetail();
  renderNotifList();
  if (document.getElementById("sec-tickets")?.offsetParent !== null) pmRender();
  showToast({
    type: "success",
    title: "Ticket updated",
    message: `${t.id} saved successfully`,
  });
}

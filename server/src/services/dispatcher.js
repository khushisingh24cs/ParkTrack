const PRIORITY_BY_CATEGORY = {
  'Disabled-Bay': 'High',
  Obstruction: 'High',
  'Wrong-Zone': 'Medium',
  Overstay: 'Medium',
  'No-Permit': 'Low',
  UNMAPPED: 'Low',
};

export function getPriorityForCategory(category) {
  return PRIORITY_BY_CATEGORY[category] || 'Medium';
}

export function countActiveAssignments(reports) {
  const counts = {};
  for (const r of reports) {
    if (r.assignedHandlerId && (r.status === 'Assigned' || r.status === 'In-Progress')) {
      counts[r.assignedHandlerId] = (counts[r.assignedHandlerId] || 0) + 1;
    }
  }
  return counts;
}

export function selectHandlerForReport({ zone, priority, handlers, reports }) {
  const activeCounts = countActiveAssignments(reports);
  const withLoad = handlers.map((h) => ({
    ...h,
    activeCount: activeCounts[h.handlerId] || 0,
  }));

  const hasCapacity = (h) => h.activeCount < (h.maxCapacity || 4);

  // 1. Primary zone + Available + capacity remaining
  const primaryAvailable = withLoad
    .filter((h) => h.zone === zone && h.availability === 'Available' && hasCapacity(h))
    .sort((a, b) => a.activeCount - b.activeCount);

  if (primaryAvailable.length > 0) {
    const chosen = primaryAvailable[0];
    return {
      handler: chosen,
      routingNote: `Auto-dispatched to primary ${zone} handler (${chosen.activeCount + 1}/${chosen.maxCapacity} load).`,
    };
  }

  // 2. Backup zone coverage + Available + capacity remaining
  const backupAvailable = withLoad
    .filter(
      (h) =>
        Array.isArray(h.backupZones) &&
        h.backupZones.includes(zone) &&
        h.availability === 'Available' &&
        hasCapacity(h)
    )
    .sort((a, b) => a.activeCount - b.activeCount);

  if (backupAvailable.length > 0) {
    const chosen = backupAvailable[0];
    return {
      handler: chosen,
      routingNote: `Primary ${zone} handlers unavailable/full; routed to backup handler from ${chosen.zone}.`,
    };
  }

  // 3. High-priority fallback: Busy handler in primary zone with spare capacity
  if (priority === 'High') {
    const busyPrimary = withLoad
      .filter((h) => h.zone === zone && h.availability === 'Busy' && hasCapacity(h))
      .sort((a, b) => a.activeCount - b.activeCount);

    if (busyPrimary.length > 0) {
      const chosen = busyPrimary[0];
      return {
        handler: chosen,
        routingNote: `High-priority overflow: assigned to busy ${zone} handler (${chosen.activeCount + 1}/${chosen.maxCapacity}).`,
      };
    }
  }

  return {
    handler: null,
    routingNote: `Queued in Pending: all primary and backup handlers for ${zone} are off-duty or at capacity.`,
  };
}


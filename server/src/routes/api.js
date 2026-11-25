import express from 'express';
import {
  checkAutomataHealth,
  classifyWithAutomata,
  compareWithAutomata,
  validateWithAutomata,
} from '../services/automataClient.js';
import {
  countActiveAssignments,
  getPriorityForCategory,
  selectHandlerForReport,
} from '../services/dispatcher.js';
import {
  createHandler,
  createReport,
  findReportById,
  isMongoConnected,
  listHandlers,
  listRejectedSubmissions,
  listReports,
  logRejectedSubmission,
  updateHandler,
  updateReport,
} from '../store/dataStore.js';

export const apiRouter = express.Router();

function enrichHandlers(handlers, reports) {
  const activeCounts = countActiveAssignments(reports);
  const resolvedCounts = {};
  for (const r of reports) {
    if (r.assignedHandlerId && r.status === 'Resolved') {
      resolvedCounts[r.assignedHandlerId] = (resolvedCounts[r.assignedHandlerId] || 0) + 1;
    }
  }
  return handlers.map((h) => ({
    ...h,
    activeCount: activeCounts[h.handlerId] || 0,
    resolvedCount: resolvedCounts[h.handlerId] || 0,
  }));
}

function handleAutomataError(res, err) {
  if (err.response) {
    return res.status(err.response.status).json(err.response.data);
  }
  return res.status(503).json({
    error: 'Automata microservice is unreachable. Start automata-service on port 5001.',
    details: err.message,
  });
}

apiRouter.get('/health', async (_req, res) => {
  const automata = await checkAutomataHealth();
  res.json({
    ok: true,
    service: 'parktrack-server',
    database: {
      mode: isMongoConnected() ? 'mongodb' : 'memory-fallback',
      connected: isMongoConnected(),
    },
    automata,
  });
});

apiRouter.get('/overview', async (_req, res) => {
  const [reports, handlers, rejected, automata] = await Promise.all([
    listReports(),
    listHandlers(),
    listRejectedSubmissions(),
    checkAutomataHealth(),
  ]);

  const enrichedHandlers = enrichHandlers(handlers, reports);
  const byStatus = {
    Pending: 0,
    Assigned: 0,
    'In-Progress': 0,
    Resolved: 0,
    'Manual-Review': 0,
  };
  const byCategory = {};
  for (const r of reports) {
    byStatus[r.status] = (byStatus[r.status] || 0) + 1;
    byCategory[r.category] = (byCategory[r.category] || 0) + 1;
  }

  res.json({
    kpis: {
      totalReports: reports.length,
      activeReports: (byStatus.Assigned || 0) + (byStatus['In-Progress'] || 0),
      pendingOrReview: (byStatus.Pending || 0) + (byStatus['Manual-Review'] || 0),
      resolvedReports: byStatus.Resolved || 0,
      rejectedCount: rejected.length,
      availableHandlers: enrichedHandlers.filter((h) => h.availability === 'Available').length,
      totalHandlers: enrichedHandlers.length,
    },
    byStatus,
    byCategory,
    recentReports: reports.slice(0, 6),
    handlers: enrichedHandlers,
    system: {
      databaseMode: isMongoConnected() ? 'mongodb' : 'memory-fallback',
      automataOk: automata.ok,
    },
  });
});

apiRouter.get('/reports', async (req, res) => {
  const reports = await listReports({
    status: req.query.status,
    category: req.query.category,
    zone: req.query.zone,
    handlerId: req.query.handlerId,
    search: req.query.search,
  });
  res.json({ reports });
});

apiRouter.get('/reports/rejected', async (_req, res) => {
  const rejected = await listRejectedSubmissions();
  res.json({ rejected });
});

apiRouter.post('/reports', async (req, res) => {
  const {
    vehicleNumber = '',
    violationCode = '',
    zone = 'Zone-A',
    location = '',
    description = '',
    reporterName = 'Citizen Reporter',
  } = req.body || {};

  if (!location.trim()) {
    return res.status(400).json({ error: 'Location / bay details are required.' });
  }

  let validation;
  try {
    validation = await validateWithAutomata(vehicleNumber, violationCode);
  } catch (err) {
    return handleAutomataError(res, err);
  }

  if (!validation.valid) {
    const rejectedRecord = await logRejectedSubmission({
      vehicleNumber,
      violationCode,
      zone,
      location: location.trim(),
      description: description.trim(),
      vehicleErrors: validation.vehicleNumber?.errors || [],
      codeErrors: validation.violationCode?.errors || [],
      vehicleTrace: validation.vehicleNumber?.trace || [],
      codeTrace: validation.violationCode?.trace || [],
    });

    return res.status(422).json({
      accepted: false,
      error: 'Input rejected by Automata DFA validation.',
      validation,
      rejectedRecord,
    });
  }

  let classification;
  try {
    classification = await classifyWithAutomata(
      validation.violationCode.normalized,
      description
    );
  } catch (err) {
    return handleAutomataError(res, err);
  }

  const category = classification.category;
  const priority = getPriorityForCategory(category);
  const now = new Date();

  if (category === 'UNMAPPED') {
    const report = await createReport({
      vehicleNumber: validation.vehicleNumber.normalized,
      rawVehicleNumber: vehicleNumber,
      violationCode: validation.violationCode.normalized,
      rawViolationCode: violationCode,
      category: 'UNMAPPED',
      validationStatus: 'Unmapped-Code',
      classificationReason: classification.reason,
      zone,
      location: location.trim(),
      description: description.trim(),
      reporterName: reporterName.trim() || 'Citizen Reporter',
      priority,
      status: 'Manual-Review',
      assignedHandlerId: null,
      assignedHandlerName: null,
      routingNote: `Held in Manual-Review: code ${validation.violationCode.normalized} is UNMAPPED.`,
      resolutionNote: '',
      dfaValidation: validation,
      history: [
        {
          status: 'Manual-Review',
          note: classification.reason,
          timestamp: now,
        },
      ],
    });

    return res.status(201).json({ accepted: true, report, validation, classification });
  }

  const [handlers, existingReports] = await Promise.all([listHandlers(), listReports()]);
  const { handler, routingNote } = selectHandlerForReport({
    zone,
    priority,
    handlers,
    reports: existingReports,
  });

  const status = handler ? 'Assigned' : 'Pending';
  const history = [
    {
      status: 'Pending',
      note: `Validated by DFA (${validation.vehicleNumber.normalized}, ${validation.violationCode.normalized}) -> ${category}.`,
      timestamp: now,
    },
  ];
  if (handler) {
    history.push({
      status: 'Assigned',
      note: `Dispatched to ${handler.name} (${handler.handlerId}, ${handler.zone}).`,
      timestamp: now,
    });
  }

  const report = await createReport({
    vehicleNumber: validation.vehicleNumber.normalized,
    rawVehicleNumber: vehicleNumber,
    violationCode: validation.violationCode.normalized,
    rawViolationCode: violationCode,
    category,
    validationStatus: classification.validationStatus || 'Valid',
    classificationReason: classification.reason,
    zone,
    location: location.trim(),
    description: description.trim(),
    reporterName: reporterName.trim() || 'Citizen Reporter',
    priority,
    status,
    assignedHandlerId: handler ? handler.handlerId : null,
    assignedHandlerName: handler ? handler.name : null,
    routingNote,
    resolutionNote: '',
    dfaValidation: validation,
    history,
  });

  return res.status(201).json({ accepted: true, report, validation, classification });
});

apiRouter.patch('/reports/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, resolutionNote, assignedHandlerId } = req.body || {};
  const existing = await findReportById(id);
  if (!existing) {
    return res.status(404).json({ error: 'Report not found.' });
  }

  const patch = {};
  let noteParts = [];

  if (assignedHandlerId !== undefined) {
    const handlers = await listHandlers();
    const target = handlers.find((h) => h.handlerId === assignedHandlerId);
    if (!target) {
      return res.status(404).json({ error: 'Target handler not found.' });
    }
    patch.assignedHandlerId = target.handlerId;
    patch.assignedHandlerName = target.name;
    patch.routingNote = `Manually routed to ${target.name} (${target.zone}).`;
    if (!status && existing.status === 'Pending') {
      patch.status = 'Assigned';
    }
    noteParts.push(`Assigned to ${target.name}`);
  }

  if (status) {
    patch.status = status;
    noteParts.push(`Status updated to ${status}`);
  }

  if (resolutionNote !== undefined) {
    patch.resolutionNote = resolutionNote;
    if (resolutionNote.trim()) {
      noteParts.push(resolutionNote.trim());
    }
  }

  const updated = await updateReport(
    id,
    patch,
    {
      status: patch.status || existing.status,
      note: noteParts.join(' — ') || 'Report updated',
      timestamp: new Date(),
    }
  );
  res.json({ report: updated });
});

apiRouter.post('/reports/:id/review', async (req, res) => {
  const { id } = req.params;
  const { category } = req.body || {};
  const allowedCategories = [
    'No-Permit',
    'Overstay',
    'Wrong-Zone',
    'Obstruction',
    'Disabled-Bay',
  ];
  if (!allowedCategories.includes(category)) {
    return res.status(400).json({ error: 'Select a valid violation category.' });
  }

  const existing = await findReportById(id);
  if (!existing) {
    return res.status(404).json({ error: 'Report not found.' });
  }

  const [handlers, reports] = await Promise.all([listHandlers(), listReports()]);
  const priority = getPriorityForCategory(category);
  const { handler, routingNote } = selectHandlerForReport({
    zone: existing.zone,
    priority,
    handlers,
    reports,
  });

  const nextStatus = handler ? 'Assigned' : 'Pending';
  const updated = await updateReport(
    id,
    {
      category,
      priority,
      status: nextStatus,
      assignedHandlerId: handler ? handler.handlerId : null,
      assignedHandlerName: handler ? handler.name : null,
      routingNote,
      classificationReason: `Manual review assigned category ${category}`,
    },
    {
      status: nextStatus,
      note: `Manual review categorized as ${category}. ${routingNote}`,
      timestamp: new Date(),
    }
  );
  res.json({ report: updated });
});

apiRouter.post('/reports/dispatch-pending', async (_req, res) => {
  const [reports, handlers] = await Promise.all([listReports(), listHandlers()]);
  const pending = reports.filter((r) => r.status === 'Pending');
  let dispatchedCount = 0;

  // Keep an evolving snapshot of reports so capacity increments as we dispatch in batch
  const workingReports = reports.map((r) => ({ ...r }));

  for (const r of pending) {
    const { handler, routingNote } = selectHandlerForReport({
      zone: r.zone,
      priority: r.priority,
      handlers,
      reports: workingReports,
    });
    if (handler) {
      await updateReport(
        r.trackingId,
        {
          status: 'Assigned',
          assignedHandlerId: handler.handlerId,
          assignedHandlerName: handler.name,
          routingNote,
        },
        {
          status: 'Assigned',
          note: `Batch auto-dispatch assigned to ${handler.name}.`,
          timestamp: new Date(),
        }
      );
      const item = workingReports.find((w) => w.trackingId === r.trackingId);
      if (item) {
        item.status = 'Assigned';
        item.assignedHandlerId = handler.handlerId;
      }
      dispatchedCount += 1;
    }
  }

  res.json({ dispatchedCount, totalPending: pending.length });
});

apiRouter.get('/handlers', async (_req, res) => {
  const [handlers, reports] = await Promise.all([listHandlers(), listReports()]);
  res.json({ handlers: enrichHandlers(handlers, reports) });
});

apiRouter.post('/handlers', async (req, res) => {
  const { name, zone, backupZones, availability, maxCapacity, phone, badgeNumber } = req.body || {};
  if (!name?.trim() || !zone) {
    return res.status(400).json({ error: 'Handler name and primary zone are required.' });
  }
  const handler = await createHandler({
    name: name.trim(),
    zone,
    backupZones,
    availability,
    maxCapacity,
    phone,
    badgeNumber,
  });
  res.status(201).json({ handler });
});

apiRouter.patch('/handlers/:id', async (req, res) => {
  const updated = await updateHandler(req.params.id, req.body || {});
  if (!updated) {
    return res.status(404).json({ error: 'Handler not found.' });
  }
  res.json({ handler: updated });
});

apiRouter.get('/analytics', async (_req, res) => {
  const [reports, handlers, rejected] = await Promise.all([
    listReports(),
    listHandlers(),
    listRejectedSubmissions(),
  ]);
  const enrichedHandlers = enrichHandlers(handlers, reports);

  const categories = ['No-Permit', 'Overstay', 'Wrong-Zone', 'Obstruction', 'Disabled-Bay', 'UNMAPPED'];
  const byCategory = categories.map((cat) => ({
    name: cat,
    count: reports.filter((r) => r.category === cat).length,
  }));

  const statuses = ['Pending', 'Assigned', 'In-Progress', 'Resolved', 'Manual-Review'];
  const byStatus = statuses.map((st) => ({
    name: st,
    count: reports.filter((r) => r.status === st).length,
  }));

  const zones = ['Zone-A', 'Zone-B', 'Zone-C', 'Zone-D'];
  const byZone = zones.map((z) => ({
    zone: z,
    total: reports.filter((r) => r.zone === z).length,
    resolved: reports.filter((r) => r.zone === z && r.status === 'Resolved').length,
    active: reports.filter(
      (r) => r.zone === z && (r.status === 'Assigned' || r.status === 'In-Progress')
    ).length,
  }));

  const byHandler = enrichedHandlers.map((h) => ({
    name: h.name.split(' ')[0],
    fullName: h.name,
    zone: h.zone,
    active: h.activeCount,
    resolved: h.resolvedCount,
    capacity: h.maxCapacity,
  }));

  const dayMap = {};
  for (const r of reports) {
    const d = new Date(r.createdAt).toISOString().slice(0, 10);
    dayMap[d] = (dayMap[d] || 0) + 1;
  }
  const trendByDay = Object.keys(dayMap)
    .sort()
    .map((date) => ({ date, reports: dayMap[date] }));

  res.json({
    byCategory,
    byStatus,
    byZone,
    byHandler,
    trendByDay,
    validationSummary: {
      validMapped: reports.filter((r) => r.category !== 'UNMAPPED').length,
      unmapped: reports.filter((r) => r.category === 'UNMAPPED').length,
      rejected: rejected.length,
    },
  });
});

// Validation Lab proxy endpoints -> Python Flask microservice
apiRouter.post('/automata/validate', async (req, res) => {
  try {
    const data = await validateWithAutomata(
      req.body?.vehicleNumber ?? '',
      req.body?.violationCode ?? ''
    );
    res.json(data);
  } catch (err) {
    handleAutomataError(res, err);
  }
});

apiRouter.post('/automata/classify', async (req, res) => {
  try {
    const data = await classifyWithAutomata(
      req.body?.violationCode ?? '',
      req.body?.description ?? ''
    );
    res.json(data);
  } catch (err) {
    handleAutomataError(res, err);
  }
});

apiRouter.post('/automata/compare', async (req, res) => {
  try {
    const data = await compareWithAutomata(req.body?.strings);
    res.json(data);
  } catch (err) {
    handleAutomataError(res, err);
  }
});


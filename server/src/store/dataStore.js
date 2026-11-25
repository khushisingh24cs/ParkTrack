import mongoose from 'mongoose';
import { ReportModel } from '../models/Report.js';
import { HandlerModel } from '../models/Handler.js';
import { RejectedSubmissionModel } from '../models/RejectedSubmission.js';
import { SEED_HANDLERS, SEED_REPORTS, SEED_REJECTED } from './seedData.js';

let memoryState = {
  handlers: [],
  reports: [],
  rejected: [],
  nextSeq: 1008,
};

export function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

function toPlain(doc) {
  if (!doc) return null;
  return typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
}

export async function initializeStore() {
  if (isMongoConnected()) {
    const handlerCount = await HandlerModel.countDocuments();
    if (handlerCount === 0) {
      await HandlerModel.insertMany(SEED_HANDLERS);
    }
    const reportCount = await ReportModel.countDocuments();
    if (reportCount === 0) {
      await ReportModel.insertMany(SEED_REPORTS);
    }
    const rejectedCount = await RejectedSubmissionModel.countDocuments();
    if (rejectedCount === 0) {
      await RejectedSubmissionModel.insertMany(SEED_REJECTED);
    }
    return;
  }

  // In-memory fallback initialization
  if (memoryState.handlers.length === 0) {
    memoryState.handlers = SEED_HANDLERS.map((h) => ({ ...h }));
  }
  if (memoryState.reports.length === 0) {
    memoryState.reports = SEED_REPORTS.map((r) => ({
      ...r,
      history: r.history.map((x) => ({ ...x })),
    }));
  }
  if (memoryState.rejected.length === 0) {
    memoryState.rejected = SEED_REJECTED.map((x, idx) => ({
      _id: `rej-${idx + 1}`,
      ...x,
    }));
  }
}

export async function listHandlers() {
  if (isMongoConnected()) {
    const docs = await HandlerModel.find().sort({ handlerId: 1 }).lean();
    return docs;
  }
  return memoryState.handlers.map((h) => ({ ...h }));
}

export async function createHandler(payload) {
  const existing = await listHandlers();
  const nextNum = 101 + existing.length;
  const handlerId = payload.handlerId || `H-${nextNum}`;
  const doc = {
    handlerId,
    name: payload.name,
    badgeNumber: payload.badgeNumber || `ENF-${200 + existing.length + 1}`,
    zone: payload.zone,
    backupZones: Array.isArray(payload.backupZones) ? payload.backupZones : [],
    availability: payload.availability || 'Available',
    maxCapacity: Number(payload.maxCapacity) || 4,
    phone: payload.phone || '',
  };

  if (isMongoConnected()) {
    const created = await HandlerModel.create(doc);
    return toPlain(created);
  }
  memoryState.handlers.push(doc);
  return { ...doc };
}

export async function updateHandler(id, updates) {
  const allowed = {};
  for (const key of ['name', 'zone', 'backupZones', 'availability', 'maxCapacity', 'phone']) {
    if (updates[key] !== undefined) allowed[key] = updates[key];
  }
  if (isMongoConnected()) {
    const doc = await HandlerModel.findOneAndUpdate(
      { $or: [{ handlerId: id }, ...(mongoose.isValidObjectId(id) ? [{ _id: id }] : [])] },
      { $set: allowed },
      { new: true }
    ).lean();
    return doc;
  }
  const idx = memoryState.handlers.findIndex((h) => h.handlerId === id);
  if (idx === -1) return null;
  memoryState.handlers[idx] = { ...memoryState.handlers[idx], ...allowed };
  return { ...memoryState.handlers[idx] };
}

export async function listReports(filters = {}) {
  if (isMongoConnected()) {
    const query = {};
    if (filters.status && filters.status !== 'ALL') query.status = filters.status;
    if (filters.category && filters.category !== 'ALL') query.category = filters.category;
    if (filters.zone && filters.zone !== 'ALL') query.zone = filters.zone;
    if (filters.handlerId && filters.handlerId !== 'ALL') {
      query.assignedHandlerId = filters.handlerId;
    }
    if (filters.search) {
      const rx = new RegExp(filters.search.trim(), 'i');
      query.$or = [
        { trackingId: rx },
        { vehicleNumber: rx },
        { violationCode: rx },
        { location: rx },
      ];
    }
    return ReportModel.find(query).sort({ createdAt: -1 }).lean();
  }

  let items = [...memoryState.reports];
  if (filters.status && filters.status !== 'ALL') {
    items = items.filter((r) => r.status === filters.status);
  }
  if (filters.category && filters.category !== 'ALL') {
    items = items.filter((r) => r.category === filters.category);
  }
  if (filters.zone && filters.zone !== 'ALL') {
    items = items.filter((r) => r.zone === filters.zone);
  }
  if (filters.handlerId && filters.handlerId !== 'ALL') {
    items = items.filter((r) => r.assignedHandlerId === filters.handlerId);
  }
  if (filters.search) {
    const q = filters.search.trim().toLowerCase();
    items = items.filter(
      (r) =>
        r.trackingId.toLowerCase().includes(q) ||
        r.vehicleNumber.toLowerCase().includes(q) ||
        r.violationCode.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q)
    );
  }
  return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function getNextTrackingId() {
  if (isMongoConnected()) {
    const count = await ReportModel.countDocuments();
    return `PT-${1001 + count}`;
  }
  const id = `PT-${memoryState.nextSeq}`;
  memoryState.nextSeq += 1;
  return id;
}

export async function createReport(reportData) {
  const trackingId = reportData.trackingId || (await getNextTrackingId());
  const now = new Date();
  const doc = {
    ...reportData,
    trackingId,
    createdAt: now,
    updatedAt: now,
  };
  if (isMongoConnected()) {
    const created = await ReportModel.create(doc);
    return toPlain(created);
  }
  memoryState.reports.unshift(doc);
  return { ...doc };
}

export async function findReportById(id) {
  if (isMongoConnected()) {
    return ReportModel.findOne({
      $or: [{ trackingId: id }, ...(mongoose.isValidObjectId(id) ? [{ _id: id }] : [])],
    }).lean();
  }
  return memoryState.reports.find((r) => r.trackingId === id) || null;
}

export async function updateReport(id, patch, historyEntry) {
  if (isMongoConnected()) {
    const updateDoc = { $set: patch };
    if (historyEntry) {
      updateDoc.$push = { history: historyEntry };
    }
    return ReportModel.findOneAndUpdate(
      { $or: [{ trackingId: id }, ...(mongoose.isValidObjectId(id) ? [{ _id: id }] : [])] },
      updateDoc,
      { new: true }
    ).lean();
  }

  const idx = memoryState.reports.findIndex((r) => r.trackingId === id);
  if (idx === -1) return null;
  const current = memoryState.reports[idx];
  const updated = {
    ...current,
    ...patch,
    updatedAt: new Date(),
    history: historyEntry ? [...(current.history || []), historyEntry] : current.history,
  };
  memoryState.reports[idx] = updated;
  return { ...updated };
}

export async function listRejectedSubmissions() {
  if (isMongoConnected()) {
    return RejectedSubmissionModel.find().sort({ createdAt: -1 }).lean();
  }
  return [...memoryState.rejected].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
}

export async function logRejectedSubmission(entry) {
  const doc = {
    ...entry,
    createdAt: new Date(),
  };
  if (isMongoConnected()) {
    const created = await RejectedSubmissionModel.create(doc);
    return toPlain(created);
  }
  const saved = { _id: `rej-${memoryState.rejected.length + 1}`, ...doc };
  memoryState.rejected.unshift(saved);
  return saved;
}


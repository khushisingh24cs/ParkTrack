import mongoose from 'mongoose';

const historyEntrySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    note: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const reportSchema = new mongoose.Schema(
  {
    trackingId: { type: String, required: true, unique: true, index: true },
    vehicleNumber: { type: String, required: true, index: true },
    rawVehicleNumber: { type: String, default: '' },
    violationCode: { type: String, required: true },
    rawViolationCode: { type: String, default: '' },
    category: { type: String, required: true },
    validationStatus: {
      type: String,
      enum: ['Valid', 'Unmapped-Code'],
      default: 'Valid',
    },
    classificationReason: { type: String, default: '' },
    zone: { type: String, required: true },
    location: { type: String, required: true },
    description: { type: String, default: '' },
    reporterName: { type: String, default: 'Citizen Reporter' },
    priority: {
      type: String,
      enum: ['High', 'Medium', 'Low'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Pending', 'Assigned', 'In-Progress', 'Resolved', 'Manual-Review'],
      default: 'Pending',
    },
    assignedHandlerId: { type: String, default: null },
    assignedHandlerName: { type: String, default: null },
    routingNote: { type: String, default: '' },
    resolutionNote: { type: String, default: '' },
    dfaValidation: { type: mongoose.Schema.Types.Mixed, default: null },
    history: { type: [historyEntrySchema], default: [] },
  },
  { timestamps: true }
);

export const ReportModel = mongoose.model('Report', reportSchema);


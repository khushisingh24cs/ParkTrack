import mongoose from 'mongoose';

const handlerSchema = new mongoose.Schema(
  {
    handlerId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    badgeNumber: { type: String, required: true },
    zone: { type: String, required: true },
    backupZones: { type: [String], default: [] },
    availability: {
      type: String,
      enum: ['Available', 'Busy', 'Off-Duty'],
      default: 'Available',
    },
    maxCapacity: { type: Number, default: 4, min: 1, max: 20 },
    phone: { type: String, default: '' },
  },
  { timestamps: true }
);

export const HandlerModel = mongoose.model('Handler', handlerSchema);


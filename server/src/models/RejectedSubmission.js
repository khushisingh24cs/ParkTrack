import mongoose from 'mongoose';

const rejectedSubmissionSchema = new mongoose.Schema(
  {
    vehicleNumber: { type: String, default: '' },
    violationCode: { type: String, default: '' },
    zone: { type: String, default: '' },
    location: { type: String, default: '' },
    description: { type: String, default: '' },
    vehicleErrors: { type: [String], default: [] },
    codeErrors: { type: [String], default: [] },
    vehicleTrace: { type: [mongoose.Schema.Types.Mixed], default: [] },
    codeTrace: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  { timestamps: true }
);

export const RejectedSubmissionModel = mongoose.model(
  'RejectedSubmission',
  rejectedSubmissionSchema
);


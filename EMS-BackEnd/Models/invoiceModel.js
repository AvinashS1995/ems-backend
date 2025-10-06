import mongoose from "mongoose";

const TemplateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g. Modern Minimalist
    category: { type: String, required: true }, // e.g. "Corporate Professional"
    thumbnailUrl: { type: String }, // preview image
    tags: [{ type: String }], // ["Clean", "Bold"]
    fields: [
      // dynamic form fields
      {
        key: { type: String, required: true }, // "clientName"
        label: { type: String, required: true }, // "Client Name"
        type: { type: String, required: true }, // "text" | "email" | "date"
        required: { type: Boolean, default: false },
      },
    ],
    layout: { type: String }, // "layout1", "layout2"
    style: { type: Object }, // font, colors, etc.
  },
  { timestamps: true }
);

const Invoice = mongoose.model("Invoice", TemplateSchema);

export { Invoice };

import { Invoice } from "../Models/invoiceModel.js";
import { getPresignedUrl } from "../storage/s3.config.js";

export const GetInvoiceList = async (req, res) => {
  try {
    const templates = await Invoice.find();

    const formattedTemplates = await Promise.all(
      templates.map(async (p) => {
        let thumbnailUrl = null;

        if (p.thumbnailUrl) {
          try {
            thumbnailUrl = await getPresignedUrl(p.thumbnailUrl);
          } catch (err) {
            console.warn(
              `Failed to get payslip presigned URL for ${p.employeeId}`,
              err.message
            );
          }
        }
        return {
          _id: p._id,
          name: p.name,
          category: p.category,
          tags: p.tags,
          layout: p.layout,
          style: p.style,
          fields: p.fields,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
          thumbnailUrl, // signed URL if available
        };
      })
    );

    res.status(200).json({
      status: "success",
      message: "Record(s) Fetched Successfully..!",
      data: {
        templates: formattedTemplates,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      error: err.message,
    });
  }
};

export const getTemplateById = async (req, res) => {
  try {
    const { id } = req.body;
    const template = await Template.findById(id);
    if (!template) return res.status(404).json({ error: "Template not found" });
    res.status(200).json({
      status: "success",
      message: "Record(s) Fetched Successfully!",
      data: {
        template,
      },
    });
  } catch (error) {
    console.error("Error fetching template by ID:", error);
    res.status(500).json({ error: "Failed to fetch template" });
  }
};

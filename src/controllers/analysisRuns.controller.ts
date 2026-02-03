import { Request, Response } from "express"
import { AnalysisRun } from "../db/models/AnalysisRun"

function getOrgId(req: Request): string | null {
  // tu middleware requireOrgContext típicamente setea req.org_id
  const orgId = (req as any)?.org_id ?? (req as any)?.org?.id
  return typeof orgId === "string" ? orgId : null
}

export async function listAnalysisRuns(req: Request, res: Response) {
  const orgId = getOrgId(req)
  if (!orgId) return res.status(400).json({ message: "Missing org context" })

  const page = Math.max(1, Number(req.query.page ?? 1))
  const limit = Math.min(50, Math.max(5, Number(req.query.limit ?? 20)))
  const offset = (page - 1) * limit

  const module = typeof req.query.module === "string" ? req.query.module : null
  const where: any = { org_id: orgId }
  if (module) where.module = module

  const { rows, count } = await AnalysisRun.findAndCountAll({
    where,
    order: [["created_at", "DESC"]],
    limit,
    offset,
    attributes: ["id", "module", "overall_score", "status", "created_at"],
  })

  return res.json({ items: rows, page, limit, total: count })
}

export async function getAnalysisRunById(req: Request, res: Response) {
  const orgId = getOrgId(req)
  if (!orgId) return res.status(400).json({ message: "Missing org context" })

  const id = String(req.params.id)

  const found = await AnalysisRun.findOne({
    where: { id, org_id: orgId },
    attributes: ["id", "module", "overall_score", "status", "created_at", "result_json"],
  })

  if (!found) return res.status(404).json({ message: "Not found" })
  return res.json(found)
}

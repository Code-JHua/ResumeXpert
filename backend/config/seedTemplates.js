import Template from '../models/templateModel.js'
import { DEFAULT_TEMPLATES } from '../data/defaultTemplates.js'

let ensureTemplatesPromise = null

export const ensureDefaultTemplates = async () => {
  if (!ensureTemplatesPromise) {
    ensureTemplatesPromise = Promise.all(
      DEFAULT_TEMPLATES.map((template) =>
        Template.findOneAndUpdate(
          { templateId: template.templateId },
          {
            $set: {
              ...template,
              communityMeta: template.communityMeta || {},
            },
          },
          {
            upsert: true,
            returnDocument: 'after',
            setDefaultsOnInsert: true,
          }
        )
      )
    ).catch((error) => {
      ensureTemplatesPromise = null
      throw error
    })
  }

  return ensureTemplatesPromise
}

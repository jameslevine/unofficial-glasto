import Joi from 'joi';

export const yearParamsSchema = Joi.object({
  year: Joi.number().integer().min(1970).max(2100).required(),
});

export const slugParamsSchema = Joi.object({
  slug: Joi.string()
    .pattern(/^[a-z0-9-]+$/)
    .max(120)
    .required(),
});

export const perfIdParamsSchema = Joi.object({
  perfId: Joi.string().max(160).required(),
});

export const favouriteBodySchema = Joi.object({
  perfId: Joi.string().max(160).required(),
  updatedAt: Joi.string().isoDate().required(),
});

export const syncBodySchema = Joi.object({
  favourites: Joi.array()
    .items(
      Joi.object({
        perfId: Joi.string().max(160).required(),
        updatedAt: Joi.string().isoDate().required(),
        deleted: Joi.boolean().optional(),
      }),
    )
    .max(2000)
    .required(),
});

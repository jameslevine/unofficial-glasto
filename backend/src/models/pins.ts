import Joi from 'joi';

const pinIdRule = Joi.string()
  .pattern(/^[a-zA-Z0-9_-]{1,64}$/)
  .required();

export const pinSyncBodySchema = Joi.object({
  pins: Joi.array()
    .items(
      Joi.object({
        id: pinIdRule,
        label: Joi.string().min(1).max(80).required(),
        emoji: Joi.string().max(8).allow('').optional(),
        lat: Joi.number().min(-90).max(90).required(),
        lon: Joi.number().min(-180).max(180).required(),
        updatedAt: Joi.string().isoDate().required(),
        deleted: Joi.boolean().optional(),
      }),
    )
    .max(200)
    .required(),
});

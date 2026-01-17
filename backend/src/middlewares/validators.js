// backend/src/middlewares/validators.js
import z, { ZodError } from "zod";

const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);

    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const formattedError = z.treeifyError(error);

      console.error(formattedError);

      res.status(400).json(formattedError);
    }

    next(error);
  }
};

export default validate;
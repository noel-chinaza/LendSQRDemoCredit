import { RequestHandler, Request } from "express";
import { AnySchema } from "yup";
import { WrapIV2DataWrap, ErrorCodes } from "..";

export function GenericChecker(
	schema,
	getObj: (req: Request) => any,
	setObj: (req: Request, obj: any) => void
): RequestHandler {
	return async (req, res, next) => {
		try {
			// cast the object to the correct types as specified by the validator
			setObj(req, schema.cast(getObj(req), { stripUnknown: true }));
			await schema.validate(getObj(req));
			return next();
		} catch (err) {
			console.error(err);
			res.status(422).send(WrapIV2DataWrap(null, err, ErrorCodes.ERROR));
		}
	};
}

export async function GenericCheckerInternal(schema: AnySchema, obj) {
	obj = schema.cast(obj, { stripUnknown: false });
	return await schema.validate(obj);
}

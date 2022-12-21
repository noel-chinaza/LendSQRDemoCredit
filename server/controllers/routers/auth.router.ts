import { PrismaClient } from "@prisma/client";
import { Router as ExpressRouter } from "express";

import { ErrorCodes, WrapIV2DataWrap } from "..";
import { AuthHandler } from "../handlers/auth.handler";
import { GenericChecker } from "../middlewares/validation.middleware";
import {
	LOGIN_VALIDATOR_BODY,
	REGISTRATION_VALIDATOR_BODY,
} from "../validators/auth.validator";

const prisma = new PrismaClient();

var router = ExpressRouter();

router.post(
	"/user/register",
	GenericChecker(
		REGISTRATION_VALIDATOR_BODY,
		(req) => req.body,
		(req, newObj) => (req.body = newObj)
	),
	async function (req, res, next) {
		try {
			const user = await AuthHandler.getInstance().registerUser(req.body);
			if (user.hash) delete (user as any).hash;
			if (user.salt) delete (user as any).salt;
			res.send(WrapIV2DataWrap(user, undefined, ErrorCodes.SUCCESS));
		} catch (err) {
			console.error(err);
			res.status(/*500*/ 200).send(
				WrapIV2DataWrap(null, err, ErrorCodes.ERROR)
			);
		}
	}
);

router.post(
	"/user/login",
	GenericChecker(
		LOGIN_VALIDATOR_BODY,
		(req) => req.body,
		(req, newObj) => (req.body = newObj)
	),
	async function (req, res, next) {
		try {
			const data = await AuthHandler.getInstance().loginUser(req.body);
			delete (data.user as any).hash;
			delete (data.user as any).salt;
			res.send(WrapIV2DataWrap(data, undefined, ErrorCodes.SUCCESS));
		} catch (err) {
			console.error(err);
			res.status(/*500*/ 200).send(
				WrapIV2DataWrap(null, err, ErrorCodes.ERROR)
			);
		}
	}
);

export { router as AuthRouter };

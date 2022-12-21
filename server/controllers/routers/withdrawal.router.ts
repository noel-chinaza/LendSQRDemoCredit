import { PrismaClient } from "@prisma/client";
import { Router as ExpressRouter } from "express";

import passport from "passport";
import { ErrorCodes, WrapIV2DataWrap } from "..";
import { ProfileHandler } from "../handlers/profile.handler";
import { WithdrawalHandler } from "../handlers/withdrawal.handler";
import { GenericChecker } from "../middlewares/validation.middleware";
import { WITHDRAW_VALIDATOR_BODY } from "../validators/withdrawal.validator";

const prisma = new PrismaClient();

var router = ExpressRouter();

router.post(
	"/withdrawal",
	passport.authenticate("jwt", { session: false }),
	GenericChecker(
		WITHDRAW_VALIDATOR_BODY,
		(req) => req.body,
		(req, newObj) => (req.body = newObj)
	),
	async function (req, res, next) {
		try {
			await WithdrawalHandler.getInstance().initiateWithdrawal({
				...req.body,
				user: (req as any).user,
			});
			const account = await ProfileHandler.getInstance().getAccount({
				user: (req as any).user,
			});
			res.send(
				WrapIV2DataWrap(
					{
						message: "your withdrawal was successful",
						user: { ...(req as any).user, accounts: [account] },
					},
					undefined,
					ErrorCodes.SUCCESS
				)
			);
		} catch (err) {
			console.error(err);
			res.status(/*500*/ 200).send(
				WrapIV2DataWrap(null, err, ErrorCodes.ERROR)
			);
		}
	}
);

export { router as WithdrawalRouter };

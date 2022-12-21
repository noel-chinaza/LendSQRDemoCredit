import { PrismaClient } from "@prisma/client";
import { Router as ExpressRouter } from "express";

import passport from "passport";
import { ErrorCodes, WrapIV2DataWrap } from "..";
import { ProfileHandler } from "../handlers/profile.handler";
import { GenericChecker } from "../middlewares/validation.middleware";
import { TRANSFER_MONEY_TO_OTHER_USER_VALIDATOR } from "../validators/profile.validator";

const prisma = new PrismaClient();

var router = ExpressRouter();

router.get(
	"/profile",
	passport.authenticate("jwt", { session: false }),
	async function (req, res, next) {
		try {
			const account = await ProfileHandler.getInstance().getAccount({
				user: (req as any).user,
			});
			res.send(
				WrapIV2DataWrap(
					{ user: {...(req as any).user, accounts: [account]} },
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

router.get(
	"/transaction-history",
	passport.authenticate("jwt", { session: false }),
	async function (req, res, next) {
		try {
			const transactions = await ProfileHandler.getInstance().getTransactionHistory({
				user: (req as any).user,
			});
			res.send(
				WrapIV2DataWrap(
					{ transactions },
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

router.post(
	"/profile/transfer-to-beneficiary",
	passport.authenticate("jwt", { session: false }),
	GenericChecker(
		TRANSFER_MONEY_TO_OTHER_USER_VALIDATOR,
		(req) => req.body,
		(req, newObj) => (req.body = newObj)
	),
	async function (req, res, next) {
		try {
			await ProfileHandler.getInstance().transferMoneyToOtherUser({
				...req.body,
				user: (req as any).user,
			});
			const account = await ProfileHandler.getInstance().getAccount({
				user: (req as any).user,
			});
			res.send(
				WrapIV2DataWrap(
					{
						message: "your transfer was successful",
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

export { router as ProfileRouter };

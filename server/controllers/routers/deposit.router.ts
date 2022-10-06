import { PrismaClient } from "@prisma/client";
import { Router as ExpressRouter } from "express";

import { ErrorCodes, WrapIV2DataWrap } from "..";
import { DepositHandler } from "../handlers/deposit.handler";
import { ProfileHandler } from "../handlers/profile.handler";
import { GenericChecker } from "../middlewares/validation.middleware";
import {
	DEPOSIT_VALIDATOR_BODY,
	INITIATE_PAYMENT_VALIDATOR_BODY,
} from "../validators/deposit.validator";
import passport from "passport";
import { createHmac } from "crypto";

const prisma = new PrismaClient();

var router = ExpressRouter();

router.post(
	"/deposit/init-payment",
	passport.authenticate("jwt", { session: false }),
	GenericChecker(
		INITIATE_PAYMENT_VALIDATOR_BODY,
		(req) => req.body,
		(req, newObj) => (req.body = newObj)
	),
	async function (req, res, next) {
		try {
			const payment = await DepositHandler.getInstance().initiatePayment({
				...req.body,
				user: (req as any).user,
			});
			res.send(
				WrapIV2DataWrap({ payment }, undefined, ErrorCodes.SUCCESS)
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
	"/deposit/webhook",
	GenericChecker(
		DEPOSIT_VALIDATOR_BODY,
		(req) => req.body,
		(req, newObj) => (req.body = newObj)
	),
	async function (req, res, next) {
		try {
			await DepositHandler.getInstance().depositMoney(req.body);
			// deposit completed successfully
			// return the users balance manually because this is supposed to behave as a webhook
			const payment = await prisma.payment.findFirst({
				include: {
					user: {
						select: { name: true, id: true, accounts: { take: 1 } },
					},
				},
				where: {
					transactionReference: req.body.transactionReference,
				},
			});
			res.send(
				WrapIV2DataWrap(
					{
						message: "your deposit was successful",
						user: payment!.user,
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


router.post("/deposit/paystack-webhook", async function (req, res, next) {
	//validate event
	const hash = createHmac("sha512", process.env["PAYSTACK_SECRET"])
		.update(JSON.stringify(req.body))
		.digest("hex");

	if (hash == req.headers["x-paystack-signature"]) {
		// Retrieve the request's body
		const {data} = req.body;
		await DepositHandler.getInstance().depositMoney({
			amount: Number(data.amount)/100,
			transactionReference: data.reference
		});
		// Do something with event
	}
	res.send(200);
});

export { router as DepositRouter };

import { describe, expect, test } from "@jest/globals";
import { PaymentGateway, PrismaClient, User } from "@prisma/client";
import {
	MSG_INSUFFICIENT_FUNDS_FOR_WITHDRAWAL,
	MSG_NO_WITHDRAWAL_GATEWAY_FILFILLER_AVAILABLE
} from "../../messages/withdrawal.message";
import { AuthHandler } from "../auth.handler";
import { DepositHandler } from "../deposit.handler";
import { ProfileHandler } from "../profile.handler";
import { WithdrawalHandler } from "../withdrawal.handler";
const prisma = new PrismaClient();
let user: User;
beforeAll(async () => {

	user = await AuthHandler.getInstance().registerUser({
		name: "timothy",
		password: "1luv2play",
	});
	const implementedPayment =
		await DepositHandler.getInstance().initiatePayment({
			gateway: PaymentGateway.PAYSTACK,
			user: user,
			amount: 200,
		});
	await DepositHandler.getInstance().depositMoney({
		transactionReference: implementedPayment.transactionReference,
		amount: implementedPayment.amount.toNumber(),
	});
});

describe("Withdrawal System", () => {
	test("a user is unable to withdraw via unavailable gateways", async () => {
		try {
			await WithdrawalHandler.getInstance().initiateWithdrawal({
				user: user,
				gateway: "CRYPTO",
				amount: 100,
			});
		} catch (e) {
			expect(e).toBe(MSG_NO_WITHDRAWAL_GATEWAY_FILFILLER_AVAILABLE);
		}
	});
	test("a user is unable to withdraw more than he has", async () => {
		try {
			await WithdrawalHandler.getInstance().initiateWithdrawal({
				user: user,
				gateway: "BANK",
				amount: 1000,
			});
		} catch (e) {
			expect(e).toBe(MSG_INSUFFICIENT_FUNDS_FOR_WITHDRAWAL);
		}
	});
	test("a user is able to succcessfully withdraw", async () => {
		await WithdrawalHandler.getInstance().initiateWithdrawal({
			user: user,
			gateway: "BANK",
			amount: 100,
		});

		const userAccount = await ProfileHandler.getInstance().getAccount({
			user,
		});
		expect(userAccount.balance!.toNumber()).toEqual(100);
	});
	
});

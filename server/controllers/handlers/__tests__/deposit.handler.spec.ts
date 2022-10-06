import { describe, expect, test } from "@jest/globals";
import { Account, Payment, PaymentGateway, PrismaClient, User } from "@prisma/client";
import {
	MSG_INSUFFICIENT_AMOUNT_ON_GATEWAY,
	MSG_NON_EXISTENT_TRANSACTION_REFERENCE,
	MSG_NO_PAYMENT_GATEWAY_FILFILLER_AVAILABLE
} from "../../messages/deposit.message";
import { AuthHandler } from "../auth.handler";
import { DepositHandler } from "../deposit.handler";
import { ProfileHandler } from "../profile.handler";
const prisma = new PrismaClient();
let user: User;
let implementedPayment: Payment;
beforeAll(async () => {
	user = await AuthHandler.getInstance().registerUser({
		name: "ama",
		password: "1luv2play",
	});

	implementedPayment = await DepositHandler.getInstance().initiatePayment({
		gateway: PaymentGateway.PAYSTACK,
		user: user,
		amount: 200,
	});
});

describe("Deposit System", () => {
	test("a user is able to initiate a payment", async () => {
		expect(implementedPayment.gateway).toBe(PaymentGateway.PAYSTACK);
		expect(implementedPayment.amount.toNumber()).toEqual(200);
		expect(implementedPayment.userId).toBe(user.id);
	});

	test("non existing transactions are ignored", async () => {
		try {
			await DepositHandler.getInstance().depositMoney({
				transactionReference: `${implementedPayment.transactionReference}-beans`,
				amount: 200,
			});
		} catch (e) {
			expect(e).toBe(MSG_NON_EXISTENT_TRANSACTION_REFERENCE);
		}
	});
	test("insufficient amount provided by calling webhook isn't processed", async () => {
		try {
			await DepositHandler.getInstance().depositMoney({
				transactionReference: implementedPayment.transactionReference,
				amount: 100,
			});
		} catch (e) {
			expect(e).toBe(MSG_INSUFFICIENT_AMOUNT_ON_GATEWAY);
		}
	});

	test("unimplemented payment gateways fail successfully", async () => {
		try {

			const unimplementedPayment = await DepositHandler.getInstance().initiatePayment({
				gateway: PaymentGateway.FLUTTERWAVE,
				user: user,
				amount: 200,
			});
			
			await DepositHandler.getInstance().depositMoney({
				transactionReference: unimplementedPayment.transactionReference,
				amount: 200,
			});
		} catch (e) {
			expect(e).toBe(MSG_NO_PAYMENT_GATEWAY_FILFILLER_AVAILABLE);
		}
	});

	test("implemented payment gateways are successfully processed", async () => {
		await DepositHandler.getInstance().depositMoney({
			transactionReference: implementedPayment.transactionReference,
			amount: 200,
		});

		// the users available balance should be updated
		const userAccount: Account =
			await ProfileHandler.getInstance().getAccount({ user: user });
		expect(userAccount.balance!.toNumber()).toEqual(200);
	});
});

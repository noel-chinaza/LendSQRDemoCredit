import { describe, expect, test } from "@jest/globals";
import { Account, PaymentGateway, PrismaClient, User } from "@prisma/client";
import {
	MSG_NON_EXISTENT_DESTINATION_USER,
	MSG_SENDER_HAS_INSUFFICIENT_FUNDS
} from "../../messages/profile.message";
import { AuthHandler } from "../auth.handler";
import { DepositHandler } from "../deposit.handler";
import { ProfileHandler } from "../profile.handler";
const prisma = new PrismaClient();
let user: User;
let user2: User;
beforeAll(async () => {
	user = await AuthHandler.getInstance().registerUser({
		name: "chinaza",
		password: "1luv2play",
	});
	user2 = await AuthHandler.getInstance().registerUser({
		name: "tobias",
		password: "1luv2play",
	});
});

describe("Profile System", () => {
	test("a user is able to view his account balance", async () => {
		const account: Account = await ProfileHandler.getInstance().getAccount({
			user,
		});
		expect(account.balance!.toNumber()).toEqual(0);
	});
	test("a user must have sufficient funds to complete a transfer", async () => {
		try {
			await ProfileHandler.getInstance().transferMoneyToOtherUser({
				user: user,
				destinationUserTag: user2.name,
				amount: 100,
			});
		} catch (e) {
			expect(e).toBe(MSG_SENDER_HAS_INSUFFICIENT_FUNDS);
		}
	});
	
	test("a user can't transfer money to a non existent user", async () => {
		try {
			await ProfileHandler.getInstance().transferMoneyToOtherUser({
				user: user,
				destinationUserTag: "beansgumm",
				amount: 100,
			});
		} catch (e) {
			expect(e).toBe(MSG_NON_EXISTENT_DESTINATION_USER);
		}
	});

	test("a user should be able to transfer money successfully to another user", async () => {
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

		await ProfileHandler.getInstance().transferMoneyToOtherUser({
			user: user,
			destinationUserTag: user2.name,
			amount: 100,
		});

		// the users available balance should be updated
		const senderAccount: Account =
			await ProfileHandler.getInstance().getAccount({ user: user });
		const recipientAccount: Account =
			await ProfileHandler.getInstance().getAccount({ user: user2 });

		expect(senderAccount.balance!.toNumber()).toEqual(100);
		expect(recipientAccount.balance!.toNumber()).toEqual(100);
	});
});

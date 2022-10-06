import {
	Payment,
	PaymentGateway,
	PaymentStatus,
	PrismaClient,
	User,
} from "@prisma/client";
import { isNil } from "lodash";
import { Gateway } from ".";
import { Accounts } from "../classes/accounts";
import { Transaction } from "../classes/transaction";
const prisma = new PrismaClient();

export class PaystackPaymentGateway implements Gateway {
	constructor() {}

	// singleton design for creating paystack gateways
	private static paystackGatewayInstance: PaystackPaymentGateway;
	static getInstance() {
		if (isNil(PaystackPaymentGateway.paystackGatewayInstance))
			PaystackPaymentGateway.paystackGatewayInstance =
				new PaystackPaymentGateway();
		return PaystackPaymentGateway.paystackGatewayInstance;
	}

	async fulfillTransaction(payment: Payment & { user: User }) {
		// debiting paystack virtual system account and crediting user personal account
		const [accountToDebit, accountToCredit] = await prisma.$transaction([
			prisma.account.findFirst({
				where: {
					tag: Accounts.getSystemFundingAccount("PAYSTACK"),
				},
			}),
			prisma.account.findFirst({
				where: {
					tag: Accounts.getUserDefaultAccount(payment.user),
				},
			}),
		]);

		// give this user his money
		await new Transaction()
			.entry(`user funded his account via ${PaymentGateway.PAYSTACK}`)
			.credit(accountToCredit!, payment.amount.toNumber())
			.debit(accountToDebit!, payment.amount.toNumber())
			.commit();

			// mark the payment as fulfilled so it can't be reused
		await prisma.payment.update({
			where: {
				id: payment.id,
			},
			data: {
				status: PaymentStatus.FULFILLED,
			},
		});
	}
}

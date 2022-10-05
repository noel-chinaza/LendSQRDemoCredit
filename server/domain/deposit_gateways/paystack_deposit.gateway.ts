import {
	Account,
	Payment,
	PaymentGateway,
	PrismaClient,
	PrismaPromise,
	User,
} from "@prisma/client";
import { isNil } from "lodash";
import { Gateway } from ".";
import { Accounts } from "../classes/accounts";
import { Transaction } from "../classes/transaction";
const prisma = new PrismaClient();

export class PaystackPaymentGateway extends Gateway {
	constructor() {
        super();
    }

    // singleton design for creating paystack gateways
	private static paystackGatewayInstance: PaystackPaymentGateway;
	static getInstance() {
		if (isNil(PaystackPaymentGateway.paystackGatewayInstance))
			PaystackPaymentGateway.paystackGatewayInstance = new PaystackPaymentGateway();
		return PaystackPaymentGateway.paystackGatewayInstance;
	}

    
	override async fulfillTransaction(payment: Payment & { user: User }) {
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
			.credit(accountToCredit!, payment.amount.toNumber())
			.debit(accountToDebit!, payment.amount.toNumber())
			.commit();
	}
}

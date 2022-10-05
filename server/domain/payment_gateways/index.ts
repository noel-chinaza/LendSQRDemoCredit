import { Payment, PaymentGateway, PrismaClient, User } from "@prisma/client";
import { isNil } from "lodash";
import { PaystackPaymentGateway } from "./paystack_deposit.gateway";

const prisma = new PrismaClient();

// typically every payment gateway will have different protocols to fulfill payments
export abstract class Gateway {
	 fulfillTransaction(payment: Payment & { user: User }){}
}

class PaymentGatewayEntrance {
	public async paymentReceived(transactionReference: string, amount: number) {
		const payment = await prisma.payment.findFirst({
			include: { user: true },
			where: { transactionReference },
		});

		// only fulfill if the amount received is more or equal to the registered amount
		if (isNil(payment)) {
			throw "that transaction doesn't exist";
		}

		if (payment.amount.toNumber() >= amount) {
			switch (payment?.gateway) {
				case PaymentGateway.PAYSTACK:
					PaystackPaymentGateway.getInstance().fulfillTransaction(payment);
					break;
				default:
					throw "no payment fulfillers for that provider";
			}
		} else {
            throw `insufficient amount paid via ${payment.gateway}`;
        }
	}
}

import { Payment, PaymentGateway, PaymentStatus, PrismaClient, User } from "@prisma/client";
import { isNil } from "lodash";
import { MSG_INSUFFICIENT_AMOUNT_ON_GATEWAY, MSG_NON_EXISTENT_TRANSACTION_REFERENCE, MSG_NO_PAYMENT_GATEWAY_FILFILLER_AVAILABLE } from "../../controllers/messages/deposit.message";
import { PaystackPaymentGateway } from "./paystack_deposit.gateway";

const prisma = new PrismaClient();

// typically every payment gateway will have different protocols to fulfill payments
export interface Gateway {
	 fulfillTransaction(payment: Payment & { user: User })
	 initializePaymentOnProvider(payment: Payment)	 

}

export class PaymentGatewayEntrance {
	public static async initiatePaymentInitialization(payment: Payment & {user: {name: string}}) {
		switch(payment.gateway) {
			case PaymentGateway.PAYSTACK:
				return await PaystackPaymentGateway.getInstance().initializePaymentOnProvider(payment);
				default:
					throw MSG_NO_PAYMENT_GATEWAY_FILFILLER_AVAILABLE;

		}
	}
	public static async paymentReceived(transactionReference: string, amount: number) {
		// only pending payments can be processed
		const payment = await prisma.payment.findFirst({
			include: { user: true },
			where: { transactionReference , status: PaymentStatus.PENDING},
		});

		// only fulfill if the amount received is more or equal to the registered amount
		if (isNil(payment)) {
			throw MSG_NON_EXISTENT_TRANSACTION_REFERENCE;
		}

		if (amount >= payment.amount.toNumber()) {
			switch (payment.gateway) {
				case PaymentGateway.PAYSTACK:
					await PaystackPaymentGateway.getInstance().fulfillTransaction(payment);
					break;
				default:
					throw MSG_NO_PAYMENT_GATEWAY_FILFILLER_AVAILABLE;
			}
		} else {
            throw MSG_INSUFFICIENT_AMOUNT_ON_GATEWAY;
        }
	}
}

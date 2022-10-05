import { Payment, PaymentGateway, PrismaClient, User } from "@prisma/client";
import { isNil } from "lodash";
import { PaymentGatewayEntrance } from "../../domain/deposit_gateways";
import { GenericCheckerInternal } from "../middlewares/validation.middleware";
import { DEPOSIT_VALIDATOR_BODY, INITIATE_PAYMENT_VALIDATOR_BODY } from "../validators/deposit.validator";
const prisma = new PrismaClient();

export class DepositHandler {
	constructor() {}

	// singleton design for creating deposit handler interface
	private static depositHandlerInstance: DepositHandler;
	static getInstance() {
		if (isNil(DepositHandler.depositHandlerInstance))
			DepositHandler.depositHandlerInstance = new DepositHandler();
		return DepositHandler.depositHandlerInstance;
	}

	// called by a user to request a transaction reference to complete a payment on a payment provider
	async initiatePayment(data: {
		user: User;
		gateway: PaymentGateway;
		amount: number,
	}): Promise<Payment> {
		await GenericCheckerInternal(INITIATE_PAYMENT_VALIDATOR_BODY, data);
		const { user, gateway, amount } = data;

		const payment = await prisma.payment.create({
			data: {
				gateway,
				userId: user.id,
				amount
			},
		});

		return payment;
	}

	// this is typically called by the payment provider via a webhook after they've successfully confirmed payment
	async depositMoney(data: {
		transactionReference: string,
		amount: number,
	}) {
		
		await GenericCheckerInternal(DEPOSIT_VALIDATOR_BODY, data);
		const { transactionReference, amount } = data;

		await PaymentGatewayEntrance.paymentReceived(
			transactionReference,
			amount
		);
	}
}

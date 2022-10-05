import { PaymentGateway, PrismaClient, User } from "@prisma/client";
import { isNil } from "lodash";
import { PaymentGatewayEntrance } from "../../domain/deposit_gateways";
const prisma = new PrismaClient();

export class DepositHandler {
	constructor() {}

	// singleton design for creating DepositHandler interface
	private static depositHandlerInstance: DepositHandler;
	static getInstance() {
		if (isNil(DepositHandler.depositHandlerInstance))
			DepositHandler.depositHandlerInstance = new DepositHandler();
		return DepositHandler.depositHandlerInstance;
	}

	// called by a user to request a transaction reference to complete a payment on a payment provider
	async initiatePayment({
		user,
		gateway,
	}: {
		user: User;
		gateway: PaymentGateway;
	}) {
		const payment = await prisma.payment.create({
			data: {
				gateway,
				userId: user.id,
			},
		});

		return payment;
	}

	// this is typically called by the payment provider via a webhook after they've successfully confirmed payment
	async depositMoney({
		transactionReference,
		amount,
	}: {
		transactionReference: string;
		amount: number;
	}) {
		await PaymentGatewayEntrance.paymentReceived(
			transactionReference,
			amount
		);
	}
}

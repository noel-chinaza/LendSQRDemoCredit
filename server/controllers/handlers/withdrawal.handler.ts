import { PrismaClient, User } from "@prisma/client";
import { isNil } from "lodash";
import { WithdrawalGateway } from "../../domain/classes/accounts";
import { WithdrawalChannelEntrance } from "../../domain/withdrawal_gateways";
import { GenericCheckerInternal } from "../middlewares/validation.middleware";
import { WITHDRAW_VALIDATOR_BODY } from "../validators/withdrawal.validator";
const prisma = new PrismaClient();

export class WithdrawalHandler {
	constructor() {}

	// singleton design for creating WithdrawalHandler interface
	private static withdrawalHandlerInstance: WithdrawalHandler;
	static getInstance() {
		if (isNil(WithdrawalHandler.withdrawalHandlerInstance))
			WithdrawalHandler.withdrawalHandlerInstance =
				new WithdrawalHandler();
		return WithdrawalHandler.withdrawalHandlerInstance;
	}

	// called by a user to request withdrawal of a certain amount of money
	async initiateWithdrawal(data: {
		amount: number,
		user: User,
		gateway: WithdrawalGateway,
	}) {
		await GenericCheckerInternal(WITHDRAW_VALIDATOR_BODY, data);
		const { amount, user, gateway } = data;

		await WithdrawalChannelEntrance.withdraw(amount, gateway, user);
	}
}

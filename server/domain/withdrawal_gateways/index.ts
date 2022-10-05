import {
	Account, PrismaClient,
	User
} from "@prisma/client";
import {
	MSG_INSUFFICIENT_FUNDS_FOR_WITHDRAWAL,
	MSG_NO_WITHDRAWAL_GATEWAY_FILFILLER_AVAILABLE
} from "../../controllers/messages/withdrawal.message";
import { Accounts, WithdrawalGateway } from "../classes/accounts";
import { BankWithdrawalGateway } from "./bank_withdrawal.gateway";

const prisma = new PrismaClient();

// typically every payment gateway will have different protocols to fulfill payments
export interface Gateway {
	completeWithdrawal(amount: number, user: User);
}

export class WithdrawalChannelEntrance {
	public static async withdraw(
		amount: number,
		gateway: WithdrawalGateway,
		user: User
	) {
		const userAccount: Account = (await prisma.account.findFirst({
			where: {
				tag: Accounts.getUserDefaultAccount(user),
			},
		}))!;

		// only accept withdrawal if the user has more than the registered amount
		if (userAccount.balance!.toNumber() >= amount) {
			switch (gateway) {
				case "BANK":
					await BankWithdrawalGateway.getInstance().completeWithdrawal(
						amount,
						user
					);
					break;
				default:
					throw MSG_NO_WITHDRAWAL_GATEWAY_FILFILLER_AVAILABLE;
			}
		} else {
			throw MSG_INSUFFICIENT_FUNDS_FOR_WITHDRAWAL;
		}
	}
}

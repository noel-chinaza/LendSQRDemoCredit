import { Payment, PaymentGateway, PrismaClient, User } from "@prisma/client";
import { isNil } from "lodash";
import { Accounts, WithdrawalGateway } from "../classes/accounts";
import { BankWithdrawalGateway } from "./bank_withdrawal.gateway";

const prisma = new PrismaClient();

// typically every payment gateway will have different protocols to fulfill payments
export abstract class Gateway{
	completeWithdrawal(amount: number, user: User){}
}

export class WithdrawalChannelEntrance {
	public static async withdraw(amount: number, gateway: WithdrawalGateway, user: User) {

		const userAccount = await prisma.account.findFirst({
			where: {
				tag: Accounts.getUserDefaultAccount(user)
			}
		});

		// only accept withdrawal if the user has more than the registered amount
		if (isNil(userAccount)) {
			throw "invalid user provided; no accounts available";
		}


		if (userAccount.balance!.toNumber() >= amount) {
			switch (gateway) {
				case "BANK":
					await BankWithdrawalGateway.getInstance().completeWithdrawal(amount, user);
					break;
				default:
					throw "no gateways implemented for that provider";
			}
		}
	}
}

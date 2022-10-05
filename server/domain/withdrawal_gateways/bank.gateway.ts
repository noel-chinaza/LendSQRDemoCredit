import {
    PrismaClient, User
} from "@prisma/client";
import { isNil } from "lodash";
import { Gateway } from ".";
import { Accounts } from "../classes/accounts";
import { Transaction } from "../classes/transaction";
const prisma = new PrismaClient();

export class BankWithdrawalGateway extends Gateway {
	constructor() {
        super();
    }

    // singleton design for creating bank gateway
	private static bankGatewayInstance: BankWithdrawalGateway;
	static getInstance() {
		if (isNil(BankWithdrawalGateway.bankGatewayInstance))
			BankWithdrawalGateway.bankGatewayInstance = new BankWithdrawalGateway();
		return BankWithdrawalGateway.bankGatewayInstance;
	}

    
	override async completeWithdrawal(amount: number, user: User){
		// debitin users personal account and credit the system bin account
        // typically an external API is called to credit the users actual bank account

		const [accountToDebit, accountToCredit] = await prisma.$transaction([
			prisma.account.findFirst({
				where: {
					tag: Accounts.getUserDefaultAccount(user),
				},
			}),
			prisma.account.findFirst({
				where: {
					tag: Accounts.getWithdrawalBinAccount("BANK"),
				},
			}),
		]);

		// remove this users money
		await new Transaction()
			.credit(accountToCredit!, amount)
			.debit(accountToDebit!, amount)
			.commit();
	}
}

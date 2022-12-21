import { PaymentGateway, User } from "@prisma/client";

export type WithdrawalGateway =  "CRYPTO" | "BANK";

/* this class is responsible for generating app wide identifiers/tags for each account */
/* this class reduces the queries required to actually fect accounts from the database */
export abstract class Accounts {
	static getUserDefaultAccount(user: User): string {
		return `USER_ACCOUNT:${user.id}`;
	}
	static getSystemFundingAccount(gateway: PaymentGateway): string {
		return `FUNDING_GATEWAY:${gateway}`;
	}
	static getWithdrawalBinAccount(
		withdrawalGateway: WithdrawalGateway
	): string {
		return `WITHDRAWAL_BIN_ACCOUNT:${withdrawalGateway}`;
	}
}

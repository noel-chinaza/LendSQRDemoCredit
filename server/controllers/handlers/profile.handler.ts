import { Account, PrismaClient, TransactionEntry, User } from "@prisma/client";
import { isNil } from "lodash";
import { Accounts } from "../../domain/classes/accounts";
import { Transaction } from "../../domain/classes/transaction";
import {
	MSG_NON_EXISTENT_DESTINATION_USER,
	MSG_SENDER_HAS_INSUFFICIENT_FUNDS,
} from "../messages/profile.message";
import { GenericCheckerInternal } from "../middlewares/validation.middleware";
import { TRANSFER_MONEY_TO_OTHER_USER_VALIDATOR as TRANSFER_MONEY_TO_OTHER_USER_VALIDATOR_BODY } from "../validators/profile.validator";
const prisma = new PrismaClient();

export class ProfileHandler {
	constructor() {}

	// singleton design for creating ProfileHandler interface
	private static profileHandlerInstance: ProfileHandler;
	static getInstance() {
		if (isNil(ProfileHandler.profileHandlerInstance))
			ProfileHandler.profileHandlerInstance = new ProfileHandler();
		return ProfileHandler.profileHandlerInstance;
	}

	// called by a user retrieve a users account detail
	async getAccount(data: { user: User }): Promise<Account> {
		const { user } = data;
		const account = await prisma.account.findFirst({
			where: {
				tag: Accounts.getUserDefaultAccount(user),
			},
		});
		return account!;
	}

	// called by a user retrieve a users past transactions
	async getTransactionHistory(data: {
		user: User;
	}): Promise<TransactionEntry[]> {
		const { user } = data;
		
		const transactions = await prisma.transactionEntry.findMany({
			where: {
				OR: [
					{
						creditAccount: {
							tag: Accounts.getUserDefaultAccount(user),
						},
					},
					{
						debitAccount: {
							tag: Accounts.getUserDefaultAccount(user),
						},
					},
				],
			},
		});

		return transactions;
	}

	async transferMoneyToOtherUser(data: {
		// the logged in user who wishes to transfer money
		user: User;
		// the username of the other user,
		destinationUserTag: string;
		amount: number;
	}) {
		await GenericCheckerInternal(
			TRANSFER_MONEY_TO_OTHER_USER_VALIDATOR_BODY,
			data
		);
		const { user, destinationUserTag, amount } = data;

		const destinationUser = await prisma.user.findFirst({
			where: {
				name: destinationUserTag,
			},
		});

		if (isNil(destinationUser)) throw MSG_NON_EXISTENT_DESTINATION_USER;

		// a user cant transfer money to himself
		if (destinationUser.name == user.name)
			throw MSG_NON_EXISTENT_DESTINATION_USER;

		const [accountToDebit, accountToCredit] = await prisma.$transaction([
			prisma.account.findFirst({
				where: { tag: Accounts.getUserDefaultAccount(user) },
			}),
			prisma.account.findFirst({
				where: { tag: Accounts.getUserDefaultAccount(destinationUser) },
			}),
		]);

		// sender must have sufficient funds
		if (accountToDebit!.balance!.toNumber() < amount)
			throw MSG_SENDER_HAS_INSUFFICIENT_FUNDS;

		await new Transaction()
			.entry(`${user.name} sent ${amount} to ${destinationUser.name}`)
			.credit(accountToCredit!, amount)
			.debit(accountToDebit!, amount)
			.commit();
	}
}

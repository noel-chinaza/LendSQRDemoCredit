import { Account, PrismaClient, PrismaPromise } from "@prisma/client";
const prisma = new PrismaClient();

/* this is a class that abstracts the complexities of a traditional accountign system */
class Transaction {
	private debitAmounts: { amount: number; accountId: number }[] = [];
	private creditAmounts: { amount: number; accountId: number }[] = [];

	private comment: string;

	private transactions: PrismaPromise<any>[] = [];

	constructor() {}

	public entry(comment: string) {
		this.comment = comment;
		return this;
	}

	public debit(accountToDebit: Account, amountToDebit: number) {
		this.transactions.push(
			prisma.transactionEntry.create({
				data: {
					debitAmount: amountToDebit,
					description: this.comment,
					debitAccount: { connect: { id: accountToDebit.id } },
				},
			})
		);
		this.debitAmounts.push({
			amount: amountToDebit,
			accountId: accountToDebit.id,
		});
		return this;
	}

	public credit(accountToCredit: Account, amountToCredit: number) {
		this.transactions.push(
			prisma.transactionEntry.create({
				data: {
					creditAmount: amountToCredit,
					description: this.comment,
					creditAccount: { connect: { id: accountToCredit.id } },
				},
			})
		);
		this.creditAmounts.push({
			amount: amountToCredit,
			accountId: accountToCredit.id,
		});
		return this;
	}

	public async commit() {
		const totalDebitAmount = this.debitAmounts
			.map((entry) => entry.amount)
			.reduce((a, b) => a + b);
		const totalCreditAmount = this.creditAmounts
			.map((entry) => entry.amount)
			.reduce((a, b) => a + b);

		if (totalCreditAmount - totalDebitAmount != 0) {
			throw "the summation of all debits and credits must all add up to 0";
		}

		// update the account balances for faster behaviour
		const resultMap: Map<number /* accountId */, number /* balance */> =
			new Map();

		this.debitAmounts.forEach((entry) => {
			if (!resultMap.has(entry.accountId)) {
				resultMap.set(entry.accountId, 0);
			}
			resultMap.set(
				entry.accountId,
				resultMap.get(entry.accountId)! - entry.amount
			);
		});
		this.creditAmounts.forEach((entry) => {
			if (!resultMap.has(entry.accountId)) {
				resultMap.set(entry.accountId, 0);
			}
			resultMap.set(
				entry.accountId,
				resultMap.get(entry.accountId)! + entry.amount
			);
		});

		// get all accounts we'd be updating balances of
		let accounts = await prisma.account.findMany({
			where: {
				id: {
					in: [...resultMap.keys()],
				},
			},
		});

		accounts.forEach((account) => {
			// update result map with the correct balances
			resultMap.set(
				account.id,
				resultMap.get(account.id)! + account.balance!.toNumber()
			);
			// add the database transactions to actually commit the balance
			this.transactions.push(
				prisma.account.update({
					where: {
						id: account.id,
					},
					data: {
						balance: resultMap.get(account.id),
					},
				})
			);
		});

		// commit all transactions
		await prisma.$transaction(this.transactions);
	}
}

export { Transaction };

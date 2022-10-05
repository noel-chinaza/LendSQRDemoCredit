import { Prisma, PrismaClient, UserTier } from "@prisma/client";
import { SYSTEM_ACCOUNT_USER_NAME } from "../../server/config/default";
import { Accounts } from "../../server/domain/classes/accounts";

const prisma = new PrismaClient();

export async function exec() {
	await prisma.user.upsert({
		where: {
			name: SYSTEM_ACCOUNT_USER_NAME,
		},
		create: {
			name: SYSTEM_ACCOUNT_USER_NAME,
			userTier: UserTier.GOD,
			accounts: {
				createMany: {
					data: [
						{
							tag: Accounts.getSystemFundingAccount(
								"FLUTTERWAVE"
							),
						},
						{
							tag: Accounts.getSystemFundingAccount("PAYSTACK"),
						},
						{
							tag: Accounts.getWithdrawalBinAccount("BANK"),
						},
						{
							tag: Accounts.getWithdrawalBinAccount("CRYPTO"),
						},
					],
					skipDuplicates: true,
				},
			},
		},
		update: {},
	});
	console.warn("planted system at user 0");
}

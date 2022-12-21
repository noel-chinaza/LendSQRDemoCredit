import { PrismaClient, UserTier } from "@prisma/client";
const prisma = new PrismaClient();

async function cleanSystemForTests() {
	await prisma.payment.deleteMany({
		where: {
			user: {
				userTier: UserTier.CIVILIAN,
			},
		},
	});
	await prisma.transactionEntry.deleteMany({
		where: {
			OR: [
				{
					creditAccount: {
						user: {
							userTier: UserTier.CIVILIAN,
						},
					},
				},
				{
					debitAccount: {
						user: {
							userTier: UserTier.CIVILIAN,
						},
					},
				},
			],
		},
	});
	await prisma.account.deleteMany({
		where: {
			user: {
				userTier: UserTier.CIVILIAN,
			},
		},
	});
	await prisma.user.deleteMany({
		where: {
			userTier: UserTier.CIVILIAN,
		},
	});
	console.warn("system database has been primed for test");
}

cleanSystemForTests();
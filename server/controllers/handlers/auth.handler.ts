import { PrismaClient, User, UserTier } from "@prisma/client";
import { pbkdf2Sync, randomBytes } from "crypto";
import { sign as JWTSign } from "jsonwebtoken";
import { isNil } from "lodash";
import { Accounts } from "../../domain/classes/accounts";
const prisma = new PrismaClient();

export class AuthHandler {
	constructor() {}

	// singleton design for creating paystack gateways
	private static authHandlerInstance: AuthHandler;
	static getInstance() {
		if (isNil(AuthHandler.authHandlerInstance))
			AuthHandler.authHandlerInstance = new AuthHandler();
		return AuthHandler.authHandlerInstance;
	}

	async registerUser({ name, password }): Promise<User> {
		let arr: Array<User> = await prisma.user.findMany({
			where: {
				name: {
					equals: name,
				},
			},
		});

		if (arr.length > 0) {
			throw "duplicate user account already exists";
		}

		const salt: string = randomBytes(16).toString("hex");
		const hash = pbkdf2Sync(password, salt, 10000, 512, "sha512").toString(
			"hex"
		);

		// create user account
		const user = await prisma.user.create({
			data: {
				name,
				salt,
				hash,
			},
		});

		// create users debit/credit account
		await prisma.account.create({
			data: {
				tag: Accounts.getUserDefaultAccount(user),
				userId: user.id,
			},
		});

		return user;
	}

	async loginUser({ name, password }) {
		const user = await prisma.user.findFirst({
			where: {
				name,
				userTier: UserTier.CIVILIAN,
			},
		});

		if (!user) throw "there's no such user on this server";

		const hash = pbkdf2Sync(
			password,
			user!.salt!,
			10000,
			512,
			"sha512"
		).toString("hex");

		if (user.hash != hash) throw "invalid password provided";

		return {user, token: JWTSign(user, process.env["SESSION_SECRET"])};
	}
}

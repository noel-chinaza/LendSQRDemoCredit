import { PrismaClient, User, UserTier } from "@prisma/client";
import { pbkdf2Sync, randomBytes } from "crypto";
import { sign as JWTSign } from "jsonwebtoken";
import { isNil } from "lodash";
import { Accounts } from "../../domain/classes/accounts";
import {
	MSG_DUPLICATE_USER_ACCOUNT,
	MSG_INVALID_PASSWORD_FOR_ACCOUNT,
	MSG_NON_EXISTENT_USER
} from "../messages/auth.message";
import { GenericCheckerInternal } from "../middlewares/validation.middleware";
import { LOGIN_VALIDATOR_BODY, REGISTRATION_VALIDATOR_BODY } from "../validators/auth.validator";
const prisma = new PrismaClient();

export class AuthHandler {
	constructor() {}

	// singleton design for creating auth handler
	private static authHandlerInstance: AuthHandler;
	static getInstance() {
		if (isNil(AuthHandler.authHandlerInstance))
			AuthHandler.authHandlerInstance = new AuthHandler();
		return AuthHandler.authHandlerInstance;
	}

	async registerUser(data: {
		name: string;
		password: string;
	}): Promise<User> {
		await GenericCheckerInternal(REGISTRATION_VALIDATOR_BODY, data);
		const { name, password } = data;

		let arr: Array<User> = await prisma.user.findMany({
			where: {
				name: {
					equals: name,
				},
			},
		});

		if (arr.length > 0) {
			throw MSG_DUPLICATE_USER_ACCOUNT;
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

	async loginUser(data: {
		name: string,
		password: string,
	}): Promise<{ user: User; token: string }> {
		await GenericCheckerInternal(LOGIN_VALIDATOR_BODY, data);
		const { name, password } = data;

		const user = await prisma.user.findFirst({
			where: {
				name,
				userTier: UserTier.CIVILIAN,
			},
		});

		if (isNil(user)) throw MSG_NON_EXISTENT_USER;

		const hash = pbkdf2Sync(
			password,
			user!.salt!,
			10000,
			512,
			"sha512"
		).toString("hex");

		if (user.hash != hash) throw MSG_INVALID_PASSWORD_FOR_ACCOUNT;

		return { user, token: JWTSign(user, process.env["SESSION_SECRET"]) };
	}
}

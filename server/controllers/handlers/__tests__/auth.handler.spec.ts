import { describe, expect, test } from "@jest/globals";
import { PrismaClient } from "@prisma/client";
import {
	MSG_DUPLICATE_USER_ACCOUNT,
	MSG_NON_EXISTENT_USER
} from "../../messages/auth.message";
import { AuthHandler } from "../auth.handler";
const prisma = new PrismaClient();


describe("Authentication System", () => {
	test("unknown user is unable to login", async () => {
		try {
			await AuthHandler.getInstance().loginUser({
				name: "beemo",
				password: "1luv2play",
			});
		} catch (e) {
			expect(e).toBe(MSG_NON_EXISTENT_USER);
		}
	});
	test("user is able to register succesfully", async () => {
		const newUser = await AuthHandler.getInstance().registerUser({
			name: "noel",
			password: "1luv2play",
		});
		expect(newUser.name).toBe("noel");
	});
	test("user is able to login succesfully", async () => {
		const { user } = await AuthHandler.getInstance().loginUser({
			name: "noel",
			password: "1luv2play",
		});
		expect(user.name).toBe("noel");
	});
	test("there can't be duplicate users", async () => {
		try {
			await AuthHandler.getInstance().registerUser({
				name: "noel",
				password: "1luv2play",
			});
		} catch (e) {
			expect(e).toBe(MSG_DUPLICATE_USER_ACCOUNT);
		}
	});
});
